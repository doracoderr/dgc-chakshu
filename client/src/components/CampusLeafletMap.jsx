import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';

// Tight bounding box around the actual campus buildings — the map opens
// zoomed to exactly this area and cannot be zoomed/panned out past it.
const CAMPUS_BOUNDS = [
  [28.4658, 77.02255], // south-west
  [28.4685, 77.02500], // north-east
];
// Slightly larger box used only to limit panning, so the campus doesn't
// feel glued to the very edge of the screen.
const PAN_BOUNDS = [
  [28.4650, 77.02180],
  [28.4693, 77.02580],
];
const MIN_ZOOM = 17;
const MAX_ZOOM = 21;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// Small circular thumbnail marker. Falls back to a plain dot if the
// entity has no photo yet.
function thumbnailIcon(photoUrl) {
  const inner = photoUrl
    ? `<span class="campus-marker-thumb" style="background-image:url('${photoUrl}')"></span>`
    : '<span class="marker-dot"></span>';
  return L.divIcon({
    className: 'campus-marker',
    html: inner,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function directionsUrl(entity, userPos) {
  const dest = `${entity.location.lat},${entity.location.lng}`;
  const origin = userPos ? `${userPos.lat},${userPos.lng}` : '';
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=walking`;
}

function popupCard(entity, userPos) {
  const el = document.createElement('div');
  el.className = 'campus-marker-popup';
  el.innerHTML = `
    ${entity.photoUrl ? `<img class="campus-popup-img" src="${entity.photoUrl}" alt="${escapeHtml(entity.name)}" />` : ''}
    <div class="campus-popup-body">
      <span class="campus-popup-type">${entity.type === 'department' ? 'Department' : 'Building'}</span>
      <strong>${escapeHtml(entity.name)}</strong>
      ${entity.description ? `<p>${escapeHtml(entity.description)}</p>` : ''}
      <div class="campus-popup-actions">
        <button type="button" class="campus-marker-link">View details</button>
        <a class="campus-marker-directions" href="${directionsUrl(entity, userPos)}" target="_blank" rel="noopener noreferrer">🧭 Directions</a>
      </div>
    </div>
  `;
  return el;
}

function userLocationIcon() {
  return L.divIcon({
    className: 'user-location-marker',
    html: '<span class="user-location-pulse"></span><span class="user-location-dot"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function CampusLeafletMap() {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [entities, setEntities] = useState([]); // merged blocks + departments
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const navigate = useNavigate();

  // Load blocks + departments once
  useEffect(() => {
    Promise.all([api.get('/blocks'), api.get('/departments')])
      .then(([blocksRes, deptsRes]) => {
        const blocks = (blocksRes.data.data || []).map((b) => ({
          id: b._id,
          type: 'block',
          name: b.name,
          description: b.description,
          photoUrl: b.coverImage,
          location: b.location,
          link: `/blocks/${b._id}`,
        }));
        const departments = (deptsRes.data.data || []).map((d) => ({
          id: d._id,
          type: 'department',
          name: d.name,
          description: d.description || (d.hodName ? `HOD: ${d.hodName}` : ''),
          photoUrl: d.coverImage,
          location: d.location,
          link: `/departments`,
        }));
        setEntities([...blocks, ...departments]);
      })
      .catch((err) => setError(`Could not load buildings: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  // Create the map once, tightly locked to campus
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const map = L.map(mapElRef.current, {
      center: [(CAMPUS_BOUNDS[0][0] + CAMPUS_BOUNDS[1][0]) / 2, (CAMPUS_BOUNDS[0][1] + CAMPUS_BOUNDS[1][1]) / 2],
      zoom: MIN_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: PAN_BOUNDS,
      maxBoundsViscosity: 1.0,
      // Interactions are on by default — the map behaves like any normal
      // embedded map (drag to pan, scroll/pinch to zoom).
      scrollWheelZoom: true,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: MAX_ZOOM,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    map.fitBounds(CAMPUS_BOUNDS, { padding: [16, 16] });
    setTimeout(() => map.invalidateSize(), 200);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // "My location" — asks for GPS, drops a blue dot, and centers the map.
  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Location is not supported on this device/browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = mapRef.current;
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        setLocating(false);
        if (!map) return;

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([coords.lat, coords.lng]);
        } else {
          userMarkerRef.current = L.marker([coords.lat, coords.lng], {
            icon: userLocationIcon(),
            zIndexOffset: 1000,
          })
            .addTo(map)
            .bindPopup('You are here');
        }
        map.setView([coords.lat, coords.lng], Math.max(map.getZoom(), MIN_ZOOM + 1));
      },
      () => {
        setLocating(false);
        setError('Could not get your location. Please allow location access and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Plot markers whenever the entity list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const withLocation = entities.filter(
      (e) => e.location && typeof e.location.lat === 'number' && typeof e.location.lng === 'number'
    );

    const markers = withLocation.map((entity) => {
      const marker = L.marker([entity.location.lat, entity.location.lng], {
        icon: thumbnailIcon(entity.photoUrl),
      }).addTo(map);

      const card = popupCard(entity, userPos);
      card.querySelector('.campus-marker-link').addEventListener('click', () => {
        navigate(entity.link);
      });
      marker.bindPopup(card, { closeButton: true, autoPan: true });

      // Hover-to-open on desktop, without the popup vanishing while the
      // mouse is moving from the marker onto the popup card itself (that
      // was closing the popup before "Directions" could be clicked).
      let closeTimer = null;
      const cancelClose = () => clearTimeout(closeTimer);
      const scheduleClose = () => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          const overMarker = marker.getElement()?.matches(':hover');
          const overPopup = card.matches(':hover');
          if (!overMarker && !overPopup) marker.closePopup();
        }, 250);
      };

      marker.on('mouseover', () => {
        cancelClose();
        marker.openPopup();
      });
      marker.on('mouseout', scheduleClose);
      card.addEventListener('mouseenter', cancelClose);
      card.addEventListener('mouseleave', scheduleClose);

      // On touch devices, tapping the marker opens the popup via Leaflet's
      // built-in click handling (no extra code needed here).

      return marker;
    });

    if (withLocation.length === 1) {
      map.setView([withLocation[0].location.lat, withLocation[0].location.lng], MAX_ZOOM - 1);
    } else if (withLocation.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    return () => {
      markers.forEach((m) => map.removeLayer(m));
    };
  }, [entities, navigate, userPos]);

  const withLocationCount = entities.filter((e) => e.location?.lat != null && e.location?.lng != null).length;

  return (
    <div className="leaflet-map-wrapper">
      {loading && <p className="map-info">Loading campus buildings…</p>}
      {error && <p className="map-error-msg">{error}</p>}
      {!loading && !error && withLocationCount === 0 && (
        <p className="map-info">
          No buildings/departments have GPS coordinates yet. Add them from the Admin panel (Latitude/Longitude, or tap "Use my current location").
        </p>
      )}

      <div className="leaflet-map-container-outer">
        <div ref={mapElRef} className="leaflet-map-container" />

        <button
          type="button"
          className="campus-locate-btn"
          onClick={handleLocate}
          disabled={locating}
          title="Show my current location"
        >
          {locating ? '📍…' : '📍 My Location'}
        </button>
      </div>
    </div>
  );
}
