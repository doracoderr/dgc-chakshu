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
// All nodes below come from live GPS walk recordings (2026-09-10) — the
// previous hand-estimated node set has been removed at the user's request,
// so only actually-walked roads are on the map for now.
export const PATH_NODES = {
  // "Old sci to main gate" walk, simplified from 73 recorded points:
  old_sci_walk_1: { lat: 28.466423, lng: 77.024048 }, // walk start, east side near CS dept block
  old_sci_walk_2: { lat: 28.466819, lng: 77.024281 },
  old_sci_walk_3: { lat: 28.467164, lng: 77.024669 },
  old_sci_walk_4: { lat: 28.467697, lng: 77.024817 },
  old_sci_walk_5: { lat: 28.468218, lng: 77.024561 },
  old_sci_walk_6: { lat: 28.468397, lng: 77.024625 },
  old_sci_block_junction: { lat: 28.468691, lng: 77.024870 }, // near Old Science Block/IGNOU — shared endpoint with "Clg main roads" walk below (recorded ~9m apart, treated as the same junction)

  // "Clg main roads" walk, simplified from 75 recorded points, continues
  // from old_sci_block_junction back down toward the library side:
  clg_main_walk_1: { lat: 28.468256, lng: 77.024644 },
  clg_main_walk_2: { lat: 28.466826, lng: 77.024079 },
  clg_main_walk_3: { lat: 28.466583, lng: 77.023894 },
  clg_main_walk_end: { lat: 28.466643, lng: 77.023557 }, // west end of this walk, near the library/back side

  // "Rk hall front" walk, simplified from 15 recorded points:
  rkhall_front_start: { lat: 28.466557, lng: 77.023004 }, // in front of R.K. Hall
  rkhall_front_mid: { lat: 28.466492, lng: 77.023002 },
  rkhall_front_end: { lat: 28.466333, lng: 77.023305 }, // far end of the R.K. Hall front walk

  // TODO: add more nodes here as more roads get walked and sent over.
};

// [ [nodeIdA, nodeIdB], ... ] — each pair is a walkable segment between
// two nodes above.
export const PATH_EDGES = [
  ['old_sci_walk_1', 'old_sci_walk_2'],
  ['old_sci_walk_2', 'old_sci_walk_3'],
  ['old_sci_walk_3', 'old_sci_walk_4'],
  ['old_sci_walk_4', 'old_sci_walk_5'],
  ['old_sci_walk_5', 'old_sci_walk_6'],
  ['old_sci_walk_6', 'old_sci_block_junction'],
  ['old_sci_block_junction', 'clg_main_walk_1'],
  ['clg_main_walk_1', 'clg_main_walk_2'],
  ['clg_main_walk_2', 'clg_main_walk_3'],
  ['clg_main_walk_3', 'clg_main_walk_end'],
  ['rkhall_front_start', 'rkhall_front_mid'],
  ['rkhall_front_mid', 'rkhall_front_end'],

  // NOTE: these three walked roads are not yet connected to each other —
  // there's no recorded GPS path linking "Rk hall front" to the other two,
  // so no edge is drawn between them (no guessed straight-line bridges).

  // TODO: more edges as more roads are walked and sent over.
];

// ─────────────────────────────────────────────────────────────────────────
// ⚠️ ACCURACY NOTE
// ─────────────────────────────────────────────────────────────────────────
// The nodes above ARE traced from real GPS walks (live "Walk & Record"
// mode), so they should track the actual paved walkways closely — accuracy
// depends on the phone's GPS fix at the time of walking.
//
// For more roads: open https://geojson.io/?map=19/28.46660/77.02330, trace
// each real walkway with the Line tool (click at every bend/junction,
// comparing against the "Campus Layout Image" for the overall shape), then
// Save → Export → GeoJSON, and send that file back — it converts directly
// into NODES + EDGES here, no manual coordinate typing needed. Or walk it
// live with the road tracer's GPS mode and send the backup JSON.
// ─────────────────────────────────────────────────────────────────────────