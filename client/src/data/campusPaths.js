// ─────────────────────────────────────────────────────────────────────────
// CAMPUS INTERNAL PATH NETWORK
// ─────────────────────────────────────────────────────────────────────────
// The public map (OpenStreetMap) only knows about real, mapped ROADS —
// the ones outside campus (Old Railway Road, Amar Paul Street, etc). It has
// no idea where the actual walkways *inside* DGC campus are, so a normal
// road-routing service will happily send someone for a walk down the public
// road, out of the gate, and back in — which is exactly the wrong result
// for a campus map.
//
// This file is where the REAL internal paths live, so that "Directions"
// always keeps people walking inside the campus.
//
// HOW TO ADD MORE ROADS
// ----------------------
// 1. Open https://geojson.io/?map=16.42/28.46759/77.02317
// 2. On the right, paste the building points (ask Claude for the current
//    GeoJSON of buildings) so you can see them on the map as reference.
// 3. Use the Line tool to draw each road/lane, clicking at every turn or
//    junction, following the real campus walkways (compare against the
//    "Campus Layout Image" in the app for the overall road layout).
// 4. Save → export as GeoJSON, and send that file/JSON back — it gets
//    converted into NODES + EDGES below automatically (nearby line
//    endpoints across different roads are merged into shared junction
//    nodes, so the network stays connected).
// 5. Buildings automatically connect to the nearest node within
//    NODE_SNAP_KM (see CampusLeafletMap.jsx) — so a node doesn't need to
//    sit exactly on a building, just on the path right outside it.
//
// Any building/department without a nearby node yet still gets a direct
// straight line (100% inside campus, just not bent along a real lane).
// ─────────────────────────────────────────────────────────────────────────

// { nodeId: { lat, lng } }
// Filled in from roads drawn on geojson.io, snapped to the nearest
// building each one sits next to (see the comment on each node).
export const PATH_NODES = {
  apj_gate: { lat: 28.466656, lng: 77.023532 }, // right outside A.P.J. Kalam Block
  apj_polsci_bend: { lat: 28.466600, lng: 77.023560 }, // bend so this hop doesn't cut straight through the block between them
  polsci_gate: { lat: 28.466563, lng: 77.023495 }, // outside Dept. of Political Science
  csdept_gate: { lat: 28.466659, lng: 77.023298 }, // outside Dept. of Computer Science
  rkhall_junction: { lat: 28.466431, lng: 77.023117 }, // near R.K. Hall
  arts_junction: { lat: 28.466385, lng: 77.023191 }, // near Arts Block
  lib_polsci_junction: { lat: 28.466420, lng: 77.023403 }, // path bend between Library and Pol. Sci.
  lib_north: { lat: 28.466315, lng: 77.023317 }, // right outside the Library
  engdept_gate: { lat: 28.466475, lng: 77.023054 }, // near Dept. of English

  // TODO: add more nodes here once the rest of campus (IGNOU, Old Science
  // Block, Principal Office, Tagore Auditorium, Chanakya Block, hostels,
  // parking, entry gate, etc.) is drawn.
};

// [ [nodeIdA, nodeIdB], ... ] — each pair is a walkable segment between
// two nodes above.
export const PATH_EDGES = [
  ['apj_gate', 'apj_polsci_bend'],
  ['apj_polsci_bend', 'polsci_gate'],
  ['polsci_gate', 'lib_polsci_junction'],
  ['lib_polsci_junction', 'lib_north'],
  ['lib_north', 'arts_junction'],
  ['arts_junction', 'rkhall_junction'],
  ['rkhall_junction', 'engdept_gate'],
  ['polsci_gate', 'csdept_gate'],

  // NOTE: rkhall_junction <-> csdept_gate is intentionally NOT connected
  // directly — that's just the narrow back gap behind the Library, not the
  // real walking route. Going from CS Dept towards R.K. Hall/English Dept
  // now correctly goes the long way round, past the Library's front
  // (polsci_gate -> lib_polsci_junction -> lib_north -> arts_junction).

  // TODO: more edges as more roads are drawn.
];

// ─────────────────────────────────────────────────────────────────────────
// ⚠️ ACCURACY NOTE
// ─────────────────────────────────────────────────────────────────────────
// The node coordinates above are ESTIMATED from the building photos' GPS
// tags, nudged by hand to avoid the worst case of a route cutting straight
// through a building. They are NOT traced from the real paved walkways, so
// routes can still occasionally look slightly "off" against the satellite/
// building outlines, especially over longer hops.
//
// For pixel/GPS-accurate roads: open
// https://geojson.io/?map=19/28.46660/77.02330, trace each real walkway
// with the Line tool (click at every bend/junction, comparing against the
// "Campus Layout Image" for the overall shape), then Save → Export →
// GeoJSON, and send that file back — it converts directly into NODES +
// EDGES here, no manual coordinate typing needed.
// ─────────────────────────────────────────────────────────────────────────
