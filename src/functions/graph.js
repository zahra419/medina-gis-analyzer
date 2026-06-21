import * as turf from "@turf/turf";


export async function fetchStreets(lat, lng, radius = 1000) {
  const query = `
    [out:json];
    way["highway"](around:${radius},${lat},${lng});
    out geom;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain"
    },
    body: query
  });

  const text = await res.text();

  // debug if API fails
  if (text.startsWith("<")) {
    throw new Error("Overpass returned XML instead of JSON");
  }

  return JSON.parse(text);
}
export function extractStreets(osmData) {
  return osmData.elements
    .filter(el => el.type === "way" && el.geometry && el.nodes)
    .map(el => ({
      nodes: el.nodes,
      coords: el.geometry.map(p => [p.lon, p.lat]),
      tags: el.tags || {}
    }));
}

/* ===========================
   WIDTH ESTIMATION
=========================== */
function estimateWidth(tags) {
  if (tags.width) return Number(tags.width);

  const type = tags.highway;

  if (type === "primary") return 6;
  if (type === "secondary") return 5;
  if (type === "residential") return 3;
  if (type === "service") return 2.5;
  if (type === "footway") return 1.2;
  if (type === "path") return 1;
  if (type === "steps") return 1;

  return 2;
}

/* ===========================
   STREET TYPE
=========================== */
function getStreetType(tags) {
  return tags.highway || "unknown";
}

/* ===========================
   EMERGENCY ACCESS
=========================== */
function getEmergencyAccess(tags, width) {
  if (tags.highway === "steps") return "No access";

  if (width >= 3.5) return "Fire truck accessible";
  if (width >= 2.5) return "Ambulance accessible";
  if (width >= 1.5) return "Motorbike accessible";

  return "Pedestrian only";
}

/* ===========================
   RISK MODEL
=========================== */
function calculateRisk(tags, touchesDanger, width) {
  let risk = 10;

  if (tags.highway === "footway") risk += 20;
  if (tags.highway === "path") risk += 25;
  if (tags.highway === "steps") risk += 50;

  if (width < 1.5) risk += 40;
  else if (width < 2.5) risk += 20;

  if (tags.access === "private") risk += 15;

  if (touchesDanger) risk += 50;

  return Math.min(100, risk);
}

/* ===========================
   BUILD GRAPH (FIXED)
=========================== */
export function buildGraph(streets,incidentPoint) {
  const graph = {};
  const nodeCoords = {};
  const edgeMap = new Map();
  
  const dangerZone = turf.circle(incidentPoint, 300, {
    units: "meters"
  });

  streets.forEach(street => {
    const { nodes, coords, tags } = street;

    const len = Math.min(nodes.length, coords.length);

    for (let i = 0; i < len - 1; i++) {
      const a = String(nodes[i]);
      const b = String(nodes[i + 1]);

      const p1 = coords[i];
      const p2 = coords[i + 1];

      if (!p1 || !p2) continue;

      nodeCoords[a] = p1;
      nodeCoords[b] = p2;

      const distance = turf.distance(
        turf.point(p1),
        turf.point(p2),
        { units: "meters" }
      );

      const segment = turf.lineString([p1, p2]);
      const touchesDanger = turf.booleanIntersects(segment, dangerZone);

      const width = estimateWidth(tags);

      const metadata = {
        streetType: getStreetType(tags),
        width,
        emergencyAccess: getEmergencyAccess(tags, width),
        nearDanger: touchesDanger,
        riskScore: calculateRisk(tags, touchesDanger, width)
      };

      const weight = distance + metadata.riskScore;

      if (!graph[a]) graph[a] = [];
      if (!graph[b]) graph[b] = [];

      graph[a].push({ node: b, weight });
      graph[b].push({ node: a, weight });

      edgeMap.set(`${a}-${b}`, metadata);
      edgeMap.set(`${b}-${a}`, metadata);
    }
  });
  
  return { graph, nodeCoords, edgeMap };
}

/* ===========================
   NEAREST NODE
=========================== */
export function findNearestNode(point, nodeCoords) {
  let bestNode = null;
  let bestDist = Infinity;

  for (const node in nodeCoords) {
    const dist = turf.distance(
      turf.point(point),
      turf.point(nodeCoords[node]),
      { units: "meters" }
    );

    if (dist < bestDist) {
      bestDist = dist;
      bestNode = node;
    }
  }

  return bestNode;
}

/* ===========================
   DIJKSTRA
=========================== */
export function dijkstra(graph, start, end) {
  const dist = {};
  const prev = {};
  const visited = new Set();

  for (const node in graph) dist[node] = Infinity;
  dist[start] = 0;

  while (true) {
    let closest = null;

    for (const node in dist) {
      if (!visited.has(node)) {
        if (closest === null || dist[node] < dist[closest]) {
          closest = node;
        }
      }
    }

    if (closest === null || closest === end) break;

    visited.add(closest);

    for (const neighbor of graph[closest] || []) {
      const alt = dist[closest] + neighbor.weight;

      if (alt < dist[neighbor.node]) {
        dist[neighbor.node] = alt;
        prev[neighbor.node] = closest;
      }
    }
  }

  return { dist, prev };
}

/* ===========================
   PATH RECONSTRUCTION
=========================== */
export function reconstructPath(prev, start, end) {
  const path = [];
  let current = end;

  while (current) {
    path.push(current);
    current = prev[current];
  }

  path.reverse();

  if (path[0] !== start) return [];

  return path;
}

/* ===========================
   ROUTE ANALYTICS (FIXED)
=========================== */
function buildRouteInfo(pathNodes, edgeMap) {
  let totalRisk = 0;
  let segmentCount = 0;
  let minWidth = Infinity;

  const streetTypes = new Set();
  const accessTypes = new Set();
  let dangerCount = 0;

  for (let i = 0; i < pathNodes.length - 1; i++) {
    const a = String(pathNodes[i]);
    const b = String(pathNodes[i + 1]);

    const meta = edgeMap.get(`${a}-${b}`);
    if (!meta) continue;

    totalRisk += meta.riskScore;
    segmentCount++;

    streetTypes.add(meta.streetType);
    accessTypes.add(meta.emergencyAccess);

    if (meta.width < minWidth) {
      minWidth = meta.width;
    }

    if (meta.nearDanger) {
      dangerCount++;
    }
  }

  const avgRisk =
    segmentCount > 0 ? totalRisk / segmentCount : 0;

  return {
    riskScore: Math.round(avgRisk),
    streetTypes: [...streetTypes],
    accessibility: [...accessTypes],
    minWidth: minWidth === Infinity ? "Unknown" : `${minWidth} m`,
    dangerProximity: `${dangerCount} risky segments`
  };
}

/* ===========================
   MAIN FUNCTION
=========================== */
export async function findShortestPath(
  startPoint,
  endPoint
) {
  try {
    console.log(startPoint , endPoint)
    const data = await fetchStreets(
      31.6258,
      -7.9892
    );

    const streets = extractStreets(data);

    // build graph first
    const {
      graph,
      nodeCoords,
      edgeMap,
    } = buildGraph(streets,startPoint);

    // now nodeCoords exists
    const startNode =
      findNearestNode(
        startPoint,
        nodeCoords
      );

    const endNode =
      findNearestNode(
        endPoint,
        nodeCoords
      );

    const { dist, prev } =
      dijkstra(
        graph,
        startNode,
        endNode
      );

    if (dist[endNode] === Infinity) {
      return {
        pathCoords: [],
        routeInfo: {},
      };
    }

    const pathNodes =
      reconstructPath(
        prev,
        startNode,
        endNode
      );

    const pathCoords = pathNodes
      .map((id) => nodeCoords[id])
      .filter(Boolean);

    const routeInfo =
      buildRouteInfo(
        pathNodes,
        edgeMap
      );

    return {
      pathCoords,
      routeInfo,
    };
  } catch (err) {
    console.error(err);

    return {
      pathCoords: [],
      routeInfo: {},
    };
  }
}