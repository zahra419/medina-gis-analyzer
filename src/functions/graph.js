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
      coords: el.geometry.map(p => [p.lon, p.lat])
    }));
}
export function buildGraph(streets) {
  const graph = {};
  const nodeCoords = {};

  streets.forEach(street => {
    const nodes = street.nodes;
    const coords = street.coords;
   
    if (!nodes || !coords) return;

    const len = Math.min(nodes.length, coords.length);

    for (let i = 0; i < len - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];

      const p1 = coords[i];
      const p2 = coords[i + 1];

      if (!p1 || !p2) continue;

      nodeCoords[a] = p1;
      nodeCoords[b] = p2;

      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!graph[a]) graph[a] = [];
      if (!graph[b]) graph[b] = [];

      graph[a].push({ node: b, weight: dist });
      graph[b].push({ node: a, weight: dist });
    }
  });

  return { graph, nodeCoords };
}
export function findNearestNode(point, nodeCoords) {
  let bestNode = null;
  let bestDist = Infinity;

  const px = point[0];
  const py = point[1];
   console.log( px,py)
  for (const node in nodeCoords) {
    const [lng, lat] = nodeCoords[node];

    const dx = px - lng;
    const dy = py - lat;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < bestDist) {
      bestDist = dist;
      bestNode = node;
    }
  }

  return bestNode;
}
export function dijkstra(graph, start, end) {
  const dist = {};
  const prev = {};
  const visited = new Set();

  for (const node in graph) {
    dist[node] = Infinity;
  }

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
export function reconstructPath(prev, start, end) {
  const path = [];
  let current = end;

  while (current) {
    path.push(current);
    current = prev[current];
  }

  path.reverse();

  
  if (path[0] !== start) {
    console.log("No valid path");
    return [];
  }

  return path;
}
export async function findShortestPath(startPoint, endPoint) {
  try {
    const data = await fetchStreets(31.6258, -7.9892);

    const extractedStreets = extractStreets(data);
    const { graph, nodeCoords } = buildGraph(extractedStreets);

    const startNode = findNearestNode(startPoint, nodeCoords);
    const endNode = findNearestNode(endPoint, nodeCoords);
    
    const { dist, prev } = dijkstra(graph, startNode, endNode);

    if (dist[endNode] === Infinity) {
      console.log("No path found");
      return [];
    }

    const pathNodes = reconstructPath(prev, startNode, endNode)
    const pathCoords = pathNodes
    .map(id => nodeCoords[id])
    .filter(Boolean)
    .map(([lon, lat]) => [lon, lat]);
    return pathCoords;

  } catch (err) {
    console.error("Error:", err);
    return [];
  }
}