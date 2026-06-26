# Medina GIS Analyzer

## Overview

Medina GIS Analyzer is a geospatial decision-support application designed to assist emergency responders in navigating complex urban environments, particularly historic medinas characterized by narrow streets, irregular road layouts, and limited accessibility.

Unlike conventional navigation systems that primarily optimize routes based on distance or travel time, Medina GIS Analyzer integrates accessibility analysis, road characteristics, and hazard proximity into the routing process to generate safer and more suitable intervention routes.

---

## Features

- Interactive map interface using MapLibre GL.
- Selection of incident location and one or more entry points.
- Dynamic extraction of road network data from OpenStreetMap using the Overpass API.
- Road network graph construction.
- Optimal route computation using Dijkstra's algorithm.
- Accessibility analysis based on road width and road type.
- Hazard proximity analysis through geospatial buffer generation.
- Risk score calculation for each road segment.
- Visualization of:
  - Optimal route
  - Accessibility level
  - Risk score
  - Hazard proximity indicators

---

## Technologies Used

- JavaScript
- MapLibre GL JS
- Turf.js
- OpenStreetMap (OSM)
- Overpass API

---

## Project Structure

```
Medina-GIS-Analyzer/
│
├── src/                 # Source code
├── public/              # Static resources
├── package.json
├── package-lock.json
├── README.md
└── ...
```

---

## How the System Works

The application follows a geospatial processing pipeline composed of the following steps:

1. The user selects an incident location and one or more entry points.
2. Road network data is retrieved from OpenStreetMap using the Overpass API.
3. The road network is modeled as a weighted graph:
   - Nodes represent intersections.
   - Edges represent road segments.
4. Each road segment is analyzed according to:
   - Geographic distance
   - Road type
   - Estimated road width
   - Accessibility conditions
   - Proximity to hazardous areas
5. A risk score is assigned to every segment.
6. Dijkstra's algorithm computes the optimal route by minimizing the weighted cost.
7. The system displays the resulting route together with accessibility and safety indicators.

---

## Route Analysis

For each computed route, the application generates:

- Overall route risk score
- Accessibility level for emergency vehicles
- Number of road segments located within hazardous areas


---

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project directory:

```bash
cd Medina-GIS-Analyzer
```

Install dependencies:

```bash
npm install
```

---

## Running the Application

Start the development server:

```bash
npm start
```

or

```bash
npm run dev
```

(depending on the project configuration)

Open the application in your browser at:

```
http://localhost:3000
```

or the address displayed in the terminal.

---

## Example Workflow

1. Select the incident location.
2. Select one or more entry points.
3. Click **Run Simulation**.
4. The system:
   - retrieves road data,
   - constructs the road graph,
   - computes the safest route,
   - evaluates accessibility,
   - calculates risk indicators,
   - displays the results on the interactive map.
5. Click **Reset** to start a new simulation.

---

## Current Limitations

- The quality of the analysis depends on the completeness and accuracy of OpenStreetMap data.
- Hazard zones are currently simulated using a fixed-radius buffer.
- Real-time road conditions and live incident information are not integrated.
- The system has been designed as a research prototype and has not yet been validated in operational emergency scenarios.

---

## Future Improvements

- Integration of real-time disaster and traffic data.
- Dynamic hazard modeling.
- Support for multiple simultaneous incidents.
- Alternative routing algorithms (A*, multi-objective optimization).
- Integration with emergency management systems.
- Mobile version for field responders.

---

## Authors

Developed as part of an academic research project on geospatial analysis and emergency routing.

---

## License

This project is intended for educational and research purposes.