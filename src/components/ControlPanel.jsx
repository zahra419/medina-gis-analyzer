import { findShortestPath} from '../functions/graph';
import { useContext } from 'react';
import { SimulationContext } from '../hooks/context';
import { AlertTriangle, MapPin ,Play,RotateCw} from "lucide-react";

export default function ControlPanel({modeRef, resetMap }) {
    const {endPoint,startPoint,setPathCoords,setLoadingRoute}=useContext(SimulationContext);
    const runSimulation = async() => {
            if(!startPoint || !endPoint){
                alert('Please select both incident location and entry point before running the simulation.');
                return;
            }
            setLoadingRoute(true);
            const path = await findShortestPath(startPoint, endPoint)
            setPathCoords(path); 
    }
    const resetSimulation = () => {
        resetMap();
    }

    return (
      <div className="control-panel">
        <div className="tool-title">Tools</div>
        <button
            className={`tool-btn .incident-btn `}
            onClick={() => modeRef.current = "incident"}>
                <AlertTriangle size={16} />Select Incident Location
        </button>

        <button
            className={`tool-btn .entry-btn `}
            onClick={() => modeRef.current = "entryPoint"}>
                <MapPin size={16} />Select Entry Point
        </button>

        <button className="action-btn" onClick={runSimulation}><Play size={16}/>Run Simulation</button>
        <button className="reset-btn" onClick={resetSimulation}><RotateCw size={16} /> Reset</button>
      </div>
    );
}