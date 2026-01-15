"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ZoomContext = createContext();

export function ZoomProvider({ children }) {
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    const savedZoom = localStorage.getItem("app_zoom_level");
    if (savedZoom) {
      setZoomLevel(parseInt(savedZoom, 10));
    }
  }, []);

  const updateZoom = (newZoom) => {
    // Clamp zoom level between 50% and 150%
    const clampedZoom = Math.max(50, Math.min(150, newZoom));
    setZoomLevel(clampedZoom);
    localStorage.setItem("app_zoom_level", clampedZoom.toString());
  };

  const zoomIn = () => updateZoom(zoomLevel + 10);
  const zoomOut = () => updateZoom(zoomLevel - 10);
  const resetZoom = () => updateZoom(100);

  return (
    <ZoomContext.Provider value={{ zoomLevel, zoomIn, zoomOut, resetZoom }}>
      {children}
    </ZoomContext.Provider>
  );
}

export function useZoom() {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error("useZoom must be used within a ZoomProvider");
  }
  return context;
}
