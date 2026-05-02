import {  useEffect,useContext } from 'react';
import { lineString, length } from '@turf/turf';
import { SimulationContext } from '../hooks/context';

export default function InfoPanel({ selection }) {
   const {pathCoords, stats, setStats}=useContext(SimulationContext);
    
    useEffect(() => {
        if (pathCoords.length > 0 ) {
            
            const line = lineString(pathCoords);
            const distanceKm = length(line, { units: "kilometers" });
            const distanceM = distanceKm * 1000;
            const speedMps = 1.2; // walking speed in medina in meters per second
            const timeMinutes = distanceM / speedMps/60;
            setStats({
                distance: distanceM,
                time: timeMinutes
            });
            
        }
    }, [pathCoords, selection]);
    return (
        <div className="info-panel">
            <div className="tool-title">Information</div>
            <p>Incident location ({selection.incident === 'selected' ? 'Selected' : 'Not selected'})</p>
            <p>Entry Point  ({selection.entryPoint === 'selected' ? 'Selected' : 'Not selected'})</p>
            <p>Distance  ({ stats.distance.toFixed(2)} meters)</p>
            <p>Estimated Time ({ stats.time.toFixed(2)} minutes)</p>
           
        </div>
    );
}