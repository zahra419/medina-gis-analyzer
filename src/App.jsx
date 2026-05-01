import { useRef, useEffect,useState ,useContext} from 'react';
import './App.css';
import ControlPanel from './components/controlPanel';
import InfoPanel from './components/InfoPanel';
import maplibregl from 'maplibre-gl';
import HeaderBar from './components/Headerbar';
import { SimulationContext } from './hooks/context';


function App() {

const mapContainer = useRef(null);
const map = useRef(null);
const incidentsMarkerRef = useRef(null);
const entryPointMarkerRef = useRef(null);
const modeRef=useRef('incident');
const [selection, setSelection] = useState({
  incident: null,
  entryPoint: null
});
const {
  pathCoords,
  setPathCoords,
  setStartPoint,
  setEndPoint,
  setStats,
  loadingRoute,
  setLoadingRoute
} = useContext(SimulationContext);

 useEffect(() => {
    if (map.current) return; 
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty", 
      center: [-7.9892, 31.6258], //marrakech coordinates
      zoom: 15,
    });
   
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current.on('load', () => {
    
       map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
       if(modeRef.current=='incident'){
        setSelection((prev) => ({...prev, incident: 'selected'}));
        if(incidentsMarkerRef.current){
          incidentsMarkerRef.current.remove();
        }
        incidentsMarkerRef.current = new maplibregl.Marker({
        color: 'red',
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(map.current);
      map.current.flyTo({ center: [lng, lat], zoom: 17 }); 
       setEndPoint([lng, lat]);
      }
       else if(modeRef.current=='entryPoint'){
        setSelection((prev) => ({...prev, entryPoint: 'selected'}));
        if(entryPointMarkerRef.current){
          entryPointMarkerRef.current.remove();
        }
        entryPointMarkerRef.current = new maplibregl.Marker({
        color: 'blue',
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(map.current);
      map.current.flyTo({ center: [lng, lat], zoom: 17 });
       setStartPoint([lng, lat]);
      }
    });
    });
    map.current.on('error', (e) => {
      console.error('Error loading map:', e.error);
    });
  }, []);

useEffect(() => {
  if (!map.current || pathCoords.length < 2) return;
 
    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: pathCoords
      }
    };

    if (map.current.getSource('route')) {
      map.current.getSource('route').setData(geojson);
    } else {
      map.current.addSource('route', {
        type: 'geojson',
        data: geojson
      });

      map.current.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#888',
          'line-width': 4
        }
      });
  
  };
   setLoadingRoute(false);
}, [pathCoords]);
function resetMap() {
  if (!map.current) return;

  // remove line
  const source = map.current.getSource('route');
  if (source) {
    source.setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: []
      }
    });
  }

  // remove markers
  if (incidentsMarkerRef.current) {
    incidentsMarkerRef.current.remove();
    incidentsMarkerRef.current = null;
  }

  if (entryPointMarkerRef.current) {
    entryPointMarkerRef.current.remove();
    entryPointMarkerRef.current = null;
  }

  // reset state
  setPathCoords([]);
  setStartPoint(null);
  setEndPoint(null);
  setStats({
    distance: 0,
    time: 0
  });
  setSelection({
  incident: null,
  entryPoint: null
});
}
  return (
    
    < div className="App">
        {loadingRoute   && (
      <div className="loading-overlay">
        <div className="loader-box">
          Calculating route...
        </div>
      </div>
    )}
    <HeaderBar />
     <div className='map-container'
     ref={mapContainer}/>
    <ControlPanel  modeRef={modeRef}    resetMap={resetMap} />
    <InfoPanel selection={selection}  />
    </div>
  
  )
}

export default App
