import {  useEffect,useContext } from 'react';
import { lineString, length } from '@turf/turf';
import { SimulationContext } from '../hooks/context';

export default function InfoPanel({ selection }) {
   const {pathCoords, stats, setStats}=useContext(SimulationContext);
    
    useEffect(() => {
        if (pathCoords.pathCoords.length > 0 ) {
            
            setStats({
                accessibility: pathCoords.routeInfo.accessibility,
                riskScore: pathCoords.routeInfo.riskScore,
                dangerProximity: pathCoords.routeInfo.dangerProximity,
            });
            
        }
    }, [pathCoords.pathCoords, selection]);
    return (
        <div className="info-panel">
            <div className="tool-title">Information</div>
            <p>Incident location ({selection.incident === 'selected' ? 'Selected' : 'Not selected'})</p>
            <p>Entry Point  ({selection.entryPoint === 'selected' ? 'Selected' : 'Not selected'})</p>
            <p>Risk Score ({ stats.riskScore }/100)</p>
            <p>Danger Proximity ({stats.dangerProximity})</p>
            <p>{Array.isArray(stats.accessibility) ? stats.accessibility.join(', ') : stats.accessibility}</p>
           
        </div>
    );
}