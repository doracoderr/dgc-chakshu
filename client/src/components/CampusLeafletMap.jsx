import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import { PATH_NODES, PATH_EDGES } from '../data/campusPaths';

// Tight bounding box around the actual campus buildings — the map opens
// zoomed to exactly this area and cannot be zoomed/panned out past it.
const CAMPUS_BOUNDS = [
  [28.4658, 77.02255], // south-west
  [28.4685, 77.02500], // north-east
];
// Noticeably larger box used only to limit panning — gives popups near the
// north/south edge of campus (e.g. IGNOU Study Centre) enough slack to
// auto-pan into view instead of jittering against a hard wall.
const PAN_BOUNDS = [
  [28.4645, 77.02120],
  [28.4698, 77.02640],
];
const MIN_ZOOM = 16; // one step further out by default than before
const MAX_ZOOM = 20;
// OpenStreetMap only actually has tiles up to this zoom around campus —
// past it Leaflet just upscales the last real tile instead of showing a
// blank grey square, which is what happened before this was set.
const TILE_MAX_NATIVE_ZOOM = 19;
const CAMPUS_CENTER = [
  (CAMPUS_BOUNDS[0][0] + CAMPUS_BOUNDS[1][0]) / 2,
  (CAMPUS_BOUNDS[0][1] + CAMPUS_BOUNDS[1][1]) / 2,
];
// If the user's GPS position is farther than this from campus, directions
// won't auto-route — instead we ask them to confirm or pick a building.
const FAR_AWAY_KM = 0.5;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// Distance between two lat/lng points, in kilometres (Haversine formula).
function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// Average walking pace, used to estimate "~N min walk" from a distance.
const WALK_KMPH = 4.5;

// How close a start/end point needs to be to a path node to "snap" onto
// the internal path network. Beyond this, we just connect it directly.
const NODE_SNAP_KM = 0.08; // 80 m

// Finds a walking route that stays entirely inside campus, by routing
// through the internal PATH_NODES/PATH_EDGES network (Dijkstra) instead of
// any real-world road service. If no path network has been defined yet,
// it falls back to a straight line — still fully inside the campus
// boundary, just not bent along a real lane.
function buildCampusRoute(origin, destination) {
  const nodeIds = Object.keys(PATH_NODES);

  if (nodeIds.length === 0 || PATH_EDGES.length === 0) {
    return [origin, destination];
  }

  // Build an adjacency list from the defined edges.
  const graph = {};
  nodeIds.forEach((id) => (graph[id] = []));
  PATH_EDGES.forEach(([a, b]) => {
    if (!PATH_NODES[a] || !PATH_NODES[b]) return;
    const d = distanceKm(PATH_NODES[a], PATH_NODES[b]);
    graph[a].push({ to: b, d });
    graph[b].push({ to: a, d });
  });

  // Connect origin/destination to their nearest path node.
  const nearestNode = (point) => {
    let best = null;
    let bestD = Infinity;
    nodeIds.forEach((id) => {
      const d = distanceKm(point, PATH_NODES[id]);
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    });
    return { id: best, d: bestD };
  };

  const startNode = nearestNode(origin);
  const endNode = nearestNode(destination);

  // Too far from the path network to bother snapping — just go direct.
  if (!startNode.id || !endNode.id || startNode.d > NODE_SNAP_KM || endNode.d > NODE_SNAP_KM) {
    return [origin, destination];
  }

  // Dijkstra's shortest path over the node graph.
  const dist = {};
  const prev = {};
  const visited = new Set();
  nodeIds.forEach((id) => (dist[id] = Infinity));
  dist[startNode.id] = 0;

  while (visited.size < nodeIds.length) {
    let u = null;
    let best = Infinity;
    nodeIds.forEach((id) => {
      if (!visited.has(id) && dist[id] < best) {
        best = dist[id];
        u = id;
      }
    });
    if (u === null) break;
    visited.add(u);
    if (u === endNode.id) break;

    graph[u].forEach(({ to, d }) => {
      const alt = dist[u] + d;
      if (alt < dist[to]) {
        dist[to] = alt;
        prev[to] = u;
      }
    });
  }

  if (dist[endNode.id] === Infinity) {
    // Nodes aren't connected to each other — fall back to direct line.
    return [origin, destination];
  }

  const nodePath = [];
  let cur = endNode.id;
  while (cur !== undefined) {
    nodePath.unshift(PATH_NODES[cur]);
    cur = prev[cur];
  }

  return [origin, ...nodePath, destination];
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
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
  });
}

// Category -> human label shown in the popup card. Anything other than
// 'building' (landmark / facility / amenity) is a non-teaching marker —
// statues, gates, canteen, washrooms, etc — and gets its own label
// instead of being mislabeled "Building".
function popupCard(entity) {
  const el = document.createElement('div');
  el.className = 'campus-marker-popup';
  const typeLabel =
    entity.type === 'department'
      ? 'Department'
      : entity.category === 'landmark'
      ? 'Landmark'
      : entity.category === 'facility'
      ? 'Facility'
      : entity.category === 'amenity'
      ? 'Amenity'
      : 'Building';
  el.innerHTML = `
    ${entity.photoUrl ? `<div class="campus-popup-img-wrap"><img class="campus-popup-img" src="${entity.photoUrl}" alt="${escapeHtml(entity.name)}" /></div>` : ''}
    <div class="campus-popup-body">
      <span class="campus-popup-type">${typeLabel}</span>
      <strong>${escapeHtml(entity.name)}</strong>
      ${entity.description ? `<p>${escapeHtml(entity.description)}</p>` : ''}
      <div class="campus-popup-actions">
        <button type="button" class="campus-marker-link">View details</button>
        <button type="button" class="campus-marker-directions">🧭 Directions</button>
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

// Google Maps' own locate icon: an outer ring with a filled center dot
// and four short tick marks — instantly recognisable as the "locate me"
// crosshair. Rendered as SVG (not emoji) so it can be recoloured and
// animated cleanly for the loading/active states.
const LOCATE_ICON_SVG = `
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2"/>
    <circle class="campus-locate-icon-dot" cx="12" cy="12" r="2.5" fill="currentColor"/>
  </svg>
`;

// A small Leaflet control button, placed in the same corner stack as the
// zoom +/- buttons (like the "locate me" icon next to zoom controls on
// Google Maps).
const LocateControl = L.Control.extend({
  options: { position: 'topright' },
  onAdd() {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control campus-locate-control');
    const btn = L.DomUtil.create('a', 'campus-locate-control-btn', container);
    btn.href = '#';
    btn.title = 'Show my current location';
    btn.innerHTML = LOCATE_ICON_SVG;
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(btn, 'click', (e) => {
      L.DomEvent.preventDefault(e);
      if (this.options.onClick) this.options.onClick();
    });
    this._container = container;
    this._btn = btn;
    return container;
  },
  // While Leaflet is waiting on the GPS fix, the crosshair itself pulses
  // (Google Maps blinks its dot the same way while it's still locating).
  setLoading(isLoading) {
    if (this._btn) L.DomUtil[isLoading ? 'addClass' : 'removeClass'](this._btn, 'campus-locate-control-btn--loading');
  },
  // Toggled on once live tracking starts (Google Maps-style filled/blue
  // state), and off again on a second click that turns tracking off.
  setActive(isActive) {
    this._active = isActive;
    if (this._container) {
      this._btn.title = isActive ? 'Stop sharing my location' : 'Show my current location';
      L.DomUtil[isActive ? 'addClass' : 'removeClass'](this._container, 'campus-locate-control--active');
    }
  },
});

export default function CampusLeafletMap() {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const locateControlRef = useRef(null);
  const userPosRef = useRef(null);
  const watchIdRef = useRef(null);
  // Mirror liveTracking/locating in refs too. The locate button's click
  // handler is wired up once, inside the map's one-time setup effect, so
  // it always closes over that very first render's handleLocate — reading
  // the `liveTracking`/`locating` STATE there would forever see their
  // initial (false) values and a second click would never be recognised
  // as "turn it off". Refs are mutable and always read fresh instead.
  const liveTrackingRef = useRef(false);
  const locatingRef = useRef(false);
  const [liveTracking, setLiveTracking] = useState(false);

  const [entities, setEntities] = useState([]); // merged blocks + departments
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [locationNote, setLocationNote] = useState(null); // "you're far away" style message
  const [nearest, setNearest] = useState(null); // { entity, km }
  const [routeStatus, setRouteStatus] = useState(null); // text shown once a route is drawn
  const [farNotice, setFarNotice] = useState(null); // { entity, distanceText } — shown instead of auto-routing
  const [pickerOpen, setPickerOpen] = useState(false); // "pick your building" list
  const [locateToast, setLocateToast] = useState(null); // brief "Location turned on/off" message
  const toastTimerRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pendingDestRef = useRef(null);
  const autoRoutedRef = useRef(null); // guards against re-triggering for the same ?to= id

  useEffect(() => {
    userPosRef.current = userPos;
  }, [userPos]);

  // Errors are transient — clear themselves after a bit so they don't
  // permanently sit on screen, on top of the manual close button.
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(t);
  }, [error]);

  // Load blocks + departments once
  useEffect(() => {
    Promise.all([api.get('/blocks'), api.get('/departments')])
      .then(([blocksRes, deptsRes]) => {
        const blocks = (blocksRes.data.data || []).map((b) => ({
          id: b._id,
          type: 'block',
          category: b.category || 'building',
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

  // Draws (or redraws) a walking route on the SAME map from a given start
  // point to the destination entity, using ONLY the internal campus path
  // network (see src/data/campusPaths.js) — never a public/outside road.
  const routeBetween = (origin, destEntity, originLabel) => {
    const map = mapRef.current;
    if (!map || !destEntity?.location) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    const points = buildCampusRoute(origin, destEntity.location);
    const latlngs = points.map((p) => [p.lat, p.lng]);

    // A pale, thicker "casing" line underneath the bold route line makes
    // the active route pop out clearly against the faint permanent roads.
    const casing = L.polyline(latlngs, {
      color: '#FFFFFF',
      weight: 9,
      opacity: 0.85,
      lineJoin: 'round',
      lineCap: 'round',
    });
    const highlight = L.polyline(latlngs, {
      color: '#1F6FAE',
      weight: 5,
      opacity: 0.95,
      lineJoin: 'round',
      lineCap: 'round',
    });
    const line = L.layerGroup([casing, highlight]).addTo(map);
    routeLayerRef.current = line;
    map.fitBounds(highlight.getBounds(), { padding: [40, 40], maxZoom: MAX_ZOOM });

    let totalKm = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalKm += distanceKm(points[i], points[i + 1]);
    }
    const mins = Math.max(1, Math.round((totalKm / WALK_KMPH) * 60));

    setRouteStatus(
      `🚶 ${originLabel ? `From ${originLabel} — ` : ''}${formatDistance(totalKm)} • ~${mins} min walk to ${destEntity.name}`
    );
  };

  const clearRoute = () => {
    const map = mapRef.current;
    if (routeLayerRef.current && map) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setRouteStatus(null);
    setFarNotice(null);
    setPickerOpen(false);
  };

  // Directions button in a popup calls this. If the user is on/near
  // campus, it routes straight away. If they're farther than
  // FAR_AWAY_KM, we don't guess — we ask them to either use their live
  // location anyway, or pick which building they're starting from.
  const requestDirections = (entity) => {
    setFarNotice(null);
    setPickerOpen(false);
    pendingDestRef.current = entity;

    const proceed = (pos) => {
      if (!pos) {
        setRouteStatus('Could not get your location for directions.');
        return;
      }
      const distKm = distanceKm(pos, { lat: CAMPUS_CENTER[0], lng: CAMPUS_CENTER[1] });
      if (distKm > FAR_AWAY_KM) {
        setRouteStatus(null);
        setFarNotice({ entity, distanceText: formatDistance(distKm) });
      } else {
        routeBetween(pos, entity);
      }
    };

    if (userPosRef.current) {
      proceed(userPosRef.current);
    } else {
      setRouteStatus('📍 Getting your location…');
      handleLocate(() => proceed(userPosRef.current));
    }
  };

  // "Use my live location anyway" choice on the far-away notice.
  const useLiveLocationAnyway = () => {
    const entity = farNotice?.entity || pendingDestRef.current;
    setFarNotice(null);
    if (entity && userPosRef.current) routeBetween(userPosRef.current, entity);
  };

  // "Pick a building instead" choice — shows a simple list of available
  // buildings/departments; whichever one the user picks becomes the
  // starting point for the route.
  const pickBuildingAsStart = (building) => {
    const entity = pendingDestRef.current;
    setPickerOpen(false);
    setFarNotice(null);
    if (entity && building?.location) routeBetween(building.location, entity, building.name);
  };

  // Create the map once, tightly locked to campus
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const map = L.map(mapElRef.current, {
      center: CAMPUS_CENTER,
      zoom: MIN_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: PAN_BOUNDS,
      maxBoundsViscosity: 1.0,
      // Plain scroll now scrolls the PAGE (so the footer stays reachable
      // while hovering the map). Zooming by wheel needs Ctrl/Cmd held —
      // handled manually below — same convention as Google Maps embeds.
      scrollWheelZoom: false,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Ctrl/Cmd + scroll zooms the map. A plain scroll used to fall
    // through and scroll the whole PAGE instead — but since the map
    // fills exactly one screen, that made the page scroll away from the
    // navbar/header and left just the (same) map filling the window,
    // looking like it had gone "fullscreen". Plain scroll over the map
    // is now a no-op instead, so the map always stays pinned at its own
    // fixed size; scroll from outside the map to reach the footer.
    const mapContainerEl = mapElRef.current;
    const handleWheelZoom = (e) => {
      e.preventDefault();
      if (!e.ctrlKey && !e.metaKey) return;
      const delta = e.deltaY < 0 ? 1 : -1;
      map.setZoom(map.getZoom() + delta, { animate: true });
    };
    mapContainerEl.addEventListener('wheel', handleWheelZoom, { passive: false });

    // Mobile: Leaflet's touch handling grabs ALL touch gestures on the
    // map by default (touch-action: none). We still want one-finger
    // vertical swipe to scroll the page (not pan the map) so the footer
    // stays reachable on touch devices; horizontal drag and two-finger
    // pinch-zoom stay handled by Leaflet.
    mapContainerEl.style.touchAction = 'pan-y';

    const locateControl = new LocateControl({
      onClick: () => handleLocate(),
    });
    locateControl.addTo(map);
    locateControlRef.current = locateControl;

    // Plain OpenStreetMap tiles — free, no API key required, unlike
    // CARTO's raster basemaps which now need a key even for light use.
    // Visual clutter (nearby hospitals/clinics etc. baked into the
    // tiles) is instead toned down with a CSS filter below, based on
    // zoom, so our own building markers stay the clear focus at the
    // default zoom without depending on a third-party tile style.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: MAX_ZOOM,
      maxNativeZoom: TILE_MAX_NATIVE_ZOOM,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Fade the base tiles' own labels/icons (hospitals, clinics, shops,
    // etc.) at the default zoom so they don't compete with our building
    // markers, then progressively bring them back to full clarity as
    // the user zooms in — the same "more detail as you zoom" feel as
    // Google Maps, without needing a different tile provider.
    const tilePane = map.getPane('tilePane');
    const updateTileDeclutter = () => {
      if (!tilePane) return;
      const z = map.getZoom();
      tilePane.classList.remove('map-declutter-heavy', 'map-declutter-medium');
      if (z <= MIN_ZOOM + 1) tilePane.classList.add('map-declutter-heavy');
      else if (z <= MIN_ZOOM + 3) tilePane.classList.add('map-declutter-medium');
    };
    updateTileDeclutter();
    map.on('zoomend', updateTileDeclutter);

    // Dev helper: click anywhere on the map to print its lat/lng in the
    // browser console — used to plot the points for src/data/campusPaths.js.
    map.on('click', (e) => {
      // eslint-disable-next-line no-console
      console.log(`Map clicked: { lat: ${e.latlng.lat.toFixed(6)}, lng: ${e.latlng.lng.toFixed(6)} }`);
    });

    // Permanently show the known internal campus walkways (faint), so
    // people can see the paths even before asking for Directions. The
    // active route (when Directions is used) is drawn separately, on top,
    // in a bold highlighted colour so it's easy to tell apart.
    PATH_EDGES.forEach(([a, b]) => {
      const nodeA = PATH_NODES[a];
      const nodeB = PATH_NODES[b];
      if (!nodeA || !nodeB) return;
      L.polyline(
        [
          [nodeA.lat, nodeA.lng],
          [nodeB.lat, nodeB.lng],
        ],
        {
          color: '#8AA6BF',
          weight: 3,
          opacity: 0.65,
          dashArray: '1 8',
          lineCap: 'round',
          interactive: false,
        }
      ).addTo(map);
    });

    mapRef.current = map;

    map.fitBounds(CAMPUS_BOUNDS, { padding: [34, 34] });
    setTimeout(() => map.invalidateSize(), 200);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mapContainerEl.removeEventListener('wheel', handleWheelZoom);
      map.off('zoomend', updateTileDeclutter);
      clearTimeout(toastTimerRef.current);
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Brief "Location turned on/off" pill, auto-dismissing on its own.
  const showLocateToast = (msg) => {
    clearTimeout(toastTimerRef.current);
    setLocateToast(msg);
    toastTimerRef.current = setTimeout(() => setLocateToast(null), 2500);
  };

  // Turns off live tracking (Google Maps-style second click on the pin):
  // stops watching GPS, removes the blue dot, and resets the button.
  const stopLiveTracking = ({ notify = false } = {}) => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    const map = mapRef.current;
    if (userMarkerRef.current && map) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    liveTrackingRef.current = false;
    locatingRef.current = false;
    setLiveTracking(false);
    setLocating(false);
    setUserPos(null);
    userPosRef.current = null;
    setLocationNote(null);
    setNearest(null);
    locateControlRef.current?.setLoading(false);
    locateControlRef.current?.setActive(false);
    if (notify) showLocateToast('📍 Location turned off');
  };

  // "My location" — like Google Maps: first click asks for GPS, drops a
  // live blue dot that keeps updating, centers the map once, and works
  // out the nearest building. A second click on the same button turns it
  // back off. Accepts an optional callback to run once we have a first
  // fix (used by the Directions button to chain straight into routing).
  const handleLocate = (onDone) => {
    if (!navigator.geolocation) {
      setError('Location is not supported on this device/browser.');
      return;
    }

    // Second click while already tracking (or still waiting on the very
    // first fix) turns it back off — same "tap again to stop" toggle as
    // Google Maps' locate button.
    if (liveTrackingRef.current || locatingRef.current) {
      stopLiveTracking({ notify: true });
      return;
    }

    setLocating(true);
    locatingRef.current = true;
    locateControlRef.current?.setLoading(true);
    let gotFirstFix = false;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const map = mapRef.current;
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        userPosRef.current = coords;
        setLocating(false);
        locatingRef.current = false;
        setLiveTracking(true);
        liveTrackingRef.current = true;
        locateControlRef.current?.setLoading(false);
        locateControlRef.current?.setActive(true);

        if (map) {
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
          // Only recenter on the very first fix — later updates just
          // move the dot, so panning/zooming while tracking isn't
          // fought over.
          if (!gotFirstFix) {
            map.setView([coords.lat, coords.lng], Math.max(map.getZoom(), MIN_ZOOM + 1));
          }
        }

        // Far from campus? Just say so, simply.
        const distFromCampus = distanceKm(coords, { lat: CAMPUS_CENTER[0], lng: CAMPUS_CENTER[1] });
        if (distFromCampus > FAR_AWAY_KM) {
          setLocationNote(
            `📍 You're ${formatDistance(distFromCampus)} away from DGC campus. Come within 500 m of the college and I'll be able to guide you in! 🚶`
          );
        } else {
          setLocationNote(null);
        }

        if (!gotFirstFix) {
          gotFirstFix = true;
          showLocateToast('📍 Location turned on');
          onDone?.();
        }
      },
      () => {
        setLocating(false);
        locatingRef.current = false;
        locateControlRef.current?.setLoading(false);
        stopLiveTracking();
        setError('Could not get your location. Please allow location access and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  // Work out the nearest block/department to the user whenever we have
  // both a position and the entity list.
  useEffect(() => {
    if (!userPos || entities.length === 0) {
      setNearest(null);
      return;
    }
    const withLocation = entities.filter(
      (e) => e.location && typeof e.location.lat === 'number' && typeof e.location.lng === 'number'
    );
    if (withLocation.length === 0) {
      setNearest(null);
      return;
    }
    let best = null;
    for (const e of withLocation) {
      const km = distanceKm(userPos, e.location);
      if (!best || km < best.km) best = { entity: e, km };
    }
    setNearest(best);
  }, [userPos, entities]);

  // From this zoom level onward, landmarks/facilities/amenities and
  // department markers join the buildings on the map — below it, only
  // the campus buildings/blocks themselves show, the same "buildings
  // first, everything else after a little zoom" layering Google Maps
  // uses.
  const DETAIL_ZOOM = MIN_ZOOM + 1;

  // Plot markers whenever the entity list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const withLocation = entities.filter(
      (e) => e.location && typeof e.location.lat === 'number' && typeof e.location.lng === 'number'
    );

    const markers = withLocation.map((entity) => {
      // Only an actual building/block counts as "primary" — landmarks,
      // facilities, amenities, and departments are all secondary detail
      // that only shows up once the user has zoomed in a bit.
      const isPrimary = entity.type === 'block' && (!entity.category || entity.category === 'building');

      const marker = L.marker([entity.location.lat, entity.location.lng], {
        icon: thumbnailIcon(entity.photoUrl),
      });
      marker._isPrimary = isPrimary;

      const card = popupCard(entity);

      card.querySelector('.campus-marker-link').addEventListener('click', () => {
        navigate(entity.link);
      });
      card.querySelector('.campus-marker-directions').addEventListener('click', () => {
        requestDirections(entity);
      });

      marker.bindPopup(card, {
        closeButton: true,
        autoPan: false, // hovering must never move the map — that was the real cause of the flicker/ghosting
      });

      // Only one popup open at a time — closes any others so clustered
      // markers don't stack overlapping popups on top of each other.
      let closeTimer = null;
      const cancelClose = () => clearTimeout(closeTimer);
      const scheduleClose = () => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          const overMarker = marker.getElement()?.matches(':hover');
          const overPopup = card.matches(':hover');
          if (!overMarker && !overPopup) marker.closePopup();
        }, 320);
      };

      const openThisOne = () => {
        cancelClose();
        markersRef.current.forEach((m) => {
          if (m !== marker) m.closePopup();
        });
        marker.openPopup();
      };

      // Popups can render partly outside the visible map area — off the
      // top at any zoom, or off any other edge too — and get clipped.
      // On a deliberate click we nudge the view by exactly however much
      // is hidden, on whichever edges are affected, so the whole card
      // (image included) always ends up fully visible. Never runs on
      // hover, so hovering between markers stays flicker-free.
      const revealPopup = () => {
        const popup = marker.getPopup();
        const popupEl = popup?.isOpen() ? popup.getElement() : null;
        if (!popupEl) return;
        const margin = 14;
        const mapRect = map.getContainer().getBoundingClientRect();
        const popupRect = popupEl.getBoundingClientRect();

        let panX = 0;
        let panY = 0;
        const overflowTop = mapRect.top - popupRect.top;
        const overflowBottom = popupRect.bottom - mapRect.bottom;
        const overflowLeft = mapRect.left - popupRect.left;
        const overflowRight = popupRect.right - mapRect.right;

        if (overflowTop > 0) panY = -(overflowTop + margin);
        else if (overflowBottom > 0) panY = overflowBottom + margin;

        if (overflowLeft > 0) panX = -(overflowLeft + margin);
        else if (overflowRight > 0) panX = overflowRight + margin;

        if (panX !== 0 || panY !== 0) {
          map.panBy([panX, panY], { animate: true });
        }
      };

      const openAndReveal = () => {
        openThisOne();
        requestAnimationFrame(revealPopup);
        // The popup's photo loads asynchronously and grows the card
        // afterwards — re-check once it's in so a late-loading image
        // can't push the top back out of view.
        const img = card.querySelector('.campus-popup-img');
        if (img && !img.complete) {
          img.addEventListener('load', revealPopup, { once: true });
        }
      };

      marker.on('mouseover', openThisOne);
      marker.on('mouseout', scheduleClose);
      // Touch devices don't fire hover reliably, so a tap must also open
      // it directly (idempotent if hover already opened it).
      marker.on('click', openAndReveal);
      card.addEventListener('mouseenter', cancelClose);
      card.addEventListener('mouseleave', scheduleClose);

      return marker;
    });

    markersRef.current = markers;

    // Buildings/blocks are always on the map; everything else (the
    // secondary layer) is added/removed together based on zoom.
    const primaryMarkers = markers.filter((m) => m._isPrimary);
    const secondaryMarkers = markers.filter((m) => !m._isPrimary);
    primaryMarkers.forEach((m) => m.addTo(map));
    const secondaryLayer = L.layerGroup(secondaryMarkers);

    const updateMarkerTiers = () => {
      const detailed = map.getZoom() >= DETAIL_ZOOM;
      if (detailed && !map.hasLayer(secondaryLayer)) secondaryLayer.addTo(map);
      else if (!detailed && map.hasLayer(secondaryLayer)) map.removeLayer(secondaryLayer);
    };
    updateMarkerTiers();
    map.on('zoomend', updateMarkerTiers);

    if (withLocation.length === 1) {
      map.setView([withLocation[0].location.lat, withLocation[0].location.lng], MAX_ZOOM - 2);
    } else if (withLocation.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.35));
    }

    return () => {
      map.off('zoomend', updateMarkerTiers);
      map.removeLayer(secondaryLayer);
      markers.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
    };
  }, [entities, navigate]);

  // Deep link support: /map?to=<entityId> (used by the "Get Directions"
  // button on a block/landmark detail page) auto-starts routing to that
  // entity, the same as if the user had tapped Directions on its popup —
  // all still through our own internal campus path network, never an
  // external maps app.
  useEffect(() => {
    const targetId = searchParams.get('to');
    if (!targetId || entities.length === 0) return;
    if (autoRoutedRef.current === targetId) return; // already handled this id

    const entity = entities.find((e) => e.id === targetId);
    if (!entity || !entity.location) return;

    autoRoutedRef.current = targetId;
    requestDirections(entity);

    // Drop the query param so a later manual refresh/back-nav doesn't
    // silently re-trigger routing.
    const next = new URLSearchParams(searchParams);
    next.delete('to');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, searchParams]);

  const withLocationCount = entities.filter((e) => e.location?.lat != null && e.location?.lng != null).length;

  return (
    <div className="leaflet-map-wrapper">
      <div className="campus-map-legend">
        <span><span className="campus-marker-thumb-mini" /> Tap a building for details</span>
        <span>🧭 Directions from any popup</span>
        <span>📍 Tap the pin (top-right) for your live location</span>
        <span>🖱️ Ctrl + scroll to zoom</span>
      </div>

      {loading && <p className="map-info">Loading campus buildings…</p>}
      {error && (
        <div className="map-error-msg">
          <span>{error}</span>
          <button type="button" className="campus-banner-close" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}
      {!loading && !error && withLocationCount === 0 && (
        <p className="map-info">
          No buildings/departments have GPS coordinates yet. Add them from the Admin panel (Latitude/Longitude, or tap "Use my current location").
        </p>
      )}

      <div className="leaflet-map-container-outer">
        <div ref={mapElRef} className="leaflet-map-container" />

        {farNotice && (
          <div className="campus-location-banner">
            <span>
              🚶 You're {farNotice.distanceText} from DGC campus — get within 500 m of the college for me to
              chart walking directions, or try one of these instead:
            </span>
            <div className="campus-banner-actions">
              <button type="button" onClick={useLiveLocationAnyway}>
                Use my live location
              </button>
              <button type="button" onClick={() => setPickerOpen(true)}>
                Pick my building instead
              </button>
              <button type="button" className="campus-banner-close" onClick={clearRoute}>
                ✕
              </button>
            </div>
          </div>
        )}

        {pickerOpen && (
          <div className="campus-building-picker">
            <div className="campus-building-picker-header">
              <span>Which building are you starting from?</span>
              <button type="button" onClick={() => setPickerOpen(false)}>
                ✕
              </button>
            </div>
            <ul>
              {entities
                .filter((e) => e.location?.lat != null && e.location?.lng != null && e.id !== pendingDestRef.current?.id)
                .map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => pickBuildingAsStart(e)}>
                      {e.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {!farNotice && !pickerOpen && routeStatus && (
          <div className="campus-location-banner">
            <span>{routeStatus}</span>
            <button type="button" className="campus-banner-close" onClick={clearRoute}>
              ✕ Clear
            </button>
          </div>
        )}

        {!farNotice && !pickerOpen && !routeStatus && locationNote && (
          <div className="campus-location-banner">
            <span>{locationNote}</span>
            <button
              type="button"
              className="campus-banner-close"
              onClick={() => {
                setLocationNote(null);
                setNearest(null);
              }}
            >
              ✕
            </button>
          </div>
        )}

        {locateToast && <div className="campus-locate-toast">{locateToast}</div>}
      </div>
    </div>
  );
}