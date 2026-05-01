import { createContext, useState } from "react";

export const SimulationContext = createContext();

export const SimulationProvider = ({ children }) => {
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [pathCoords, setPathCoords] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [stats, setStats] = useState({
    distance: 0,
    time: 0
    });
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