import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/map.css';
import SearchBar from '../components/SearchBar';

// Dronacharya Government College, New Railway Road, Gurugram
const collegeLocation = [28.4668, 77.0237];
const collegeEntryLocation = [28.46869366205323, 77.02494752097262]; // Main Entry Gate

// Campus Building Locations
const campusBuildings = [
  {
    name: 'Old Science Block',
    location: [28.46676861319479, 77.02472354269356],
  },
  {
    name: 'Admin Block',
    location: [28.46599789131405, 77.02368537863387],
  },
  {
    name: 'APJ Floor Building',
    location: [28.466804928508097, 77.02352887992866],
  },
];

export default function Home() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const userCoordsRef = useRef(null);

  const [locationStatus, setLocationStatus] = useState('requesting'); // 'requesting' | 'active' | 'denied' | 'unavailable'
  const [errorMessage, setErrorMessage] = useState('');

  // Center map on user's current location
  const handleCenterOnUser = () => {
    if (userCoordsRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(userCoordsRef.current, Math.max(mapInstanceRef.current.getZoom(), 17), {
        duration: 1.2,
      });
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    } else if (locationStatus === 'denied') {
      alert('Location access was denied. Please allow location permissions in your browser settings.');
    } else {
      alert('Waiting for GPS fix. Please ensure location services are enabled.');
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // 1. Initialize Map
    const map = L.map(mapContainerRef.current).setView(collegeLocation, 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    // 2. College Main Entry Gate Marker
    const entryIcon = L.divIcon({
      className: 'college-entry-marker',
      html: `
        <div class="entry-marker-container">
          <div class="entry-marker-badge">🚪 College Main Entry</div>
          <div class="entry-marker-dot"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    L.marker(collegeEntryLocation, { icon: entryIcon })
      .bindPopup('<b>🚪 College Main Entry</b><br>Main Gate — New Railway Road')
      .addTo(map);

    // 3. Campus Building Markers
    campusBuildings.forEach((building) => {
      const buildingIcon = L.divIcon({
        className: 'building-marker',
        html: `
          <div class="building-marker-container">
            <div class="building-marker-badge">🏢 ${building.name}</div>
            <div class="building-marker-dot"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      L.marker(building.location, { icon: buildingIcon })
        .bindPopup(`<b>🏢 ${building.name}</b>`)
        .addTo(map);
    });

    // 2. Custom User Marker Icon using CSS classes from map.css
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="user-marker-container">
          <div class="user-marker-badge">📍 You are here</div>
          <div class="user-marker-dot"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    // 3. Live Geolocation Tracking with watchPosition
    let watchId = null;

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const userLatLng = [latitude, longitude];
          userCoordsRef.current = userLatLng;
          setLocationStatus('active');
          setErrorMessage('');

          // Update or create accuracy circle
          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setLatLng(userLatLng);
            accuracyCircleRef.current.setRadius(accuracy);
          } else {
            accuracyCircleRef.current = L.circle(userLatLng, {
              radius: accuracy,
              color: '#1F6FAE',
              fillColor: '#1F6FAE',
              fillOpacity: 0.15,
              weight: 1.5,
            }).addTo(map);
          }

          // Update or create user location marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(userLatLng);
          } else {
            userMarkerRef.current = L.marker(userLatLng, { icon: userIcon })
              .bindPopup('<b>📍 You are here</b><br>Accuracy: ±' + Math.round(accuracy) + 'm')
              .addTo(map);
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationStatus('denied');
            setErrorMessage('Location permission denied. Enable location access to see your position on campus.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationStatus('unavailable');
            setErrorMessage('GPS position unavailable. Please check your device location settings.');
          } else if (error.code === error.TIMEOUT) {
            setLocationStatus('unavailable');
            setErrorMessage('Location request timed out. Retrying GPS connection...');
          } else {
            setLocationStatus('unavailable');
            setErrorMessage('Unable to retrieve location.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 5000,
        }
      );
    } else {
      setLocationStatus('unavailable');
      setErrorMessage('Geolocation is not supported by your browser.');
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="page home-page">
      <h1>DGC Chakshu</h1>
      <p className="tagline">See • Find • Navigate</p>
      <SearchBar />
      <p className="subtitle">Find blocks, rooms, departments and faculty across campus.</p>

      <div className="map-wrapper">
        <div ref={mapContainerRef} id="map" className="map-container" />

        {/* Center on User Location Button */}
        <button
          type="button"
          onClick={handleCenterOnUser}
          title="Center on my location"
          className="map-locate-btn"
        >
          <span>📍</span>
          <span>My Location</span>
        </button>
      </div>

      {errorMessage && (
        <p className="map-error-msg">
          {errorMessage}
        </p>
      )}
    </div>
  );
}



