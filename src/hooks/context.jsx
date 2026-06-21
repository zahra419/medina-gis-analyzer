import { Accessibility } from "lucide-react";
import { createContext, useState } from "react";

export const SimulationContext = createContext();

export const SimulationProvider = ({ children }) => {
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [pathCoords, setPathCoords] = useState({ pathCoords: [] ,routeInfo: []});
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [stats, setStats] = useState({riskScore:0, accessibility: "Accessibility: Not available", dangerProximity: "Not available"});
  return (
    <SimulationContext.Provider value={{
      startPoint,
      setStartPoint,
      endPoint,
      setEndPoint,
      pathCoords,
      setPathCoords,
      loadingRoute,
      setLoadingRoute,
      stats,
      setStats
    }}>
      {children}
    </SimulationContext.Provider>
  );
};