"use client";

import { createContext, useContext, useEffect, useState } from "react";

type WindowSizeClass = "compact" | "medium" | "expanded" | "large" | "extra-large";

interface WindowSizeContextType {
  sizeClass: WindowSizeClass;
  width: number;
}

const WindowSizeContext = createContext<WindowSizeContextType | undefined>(
  undefined
);

export function useWindowSize() {
  const context = useContext(WindowSizeContext);
  if (!context) {
    throw new Error("useWindowSize must be used within a WindowSizeProvider");
  }
  return context;
}

function getWindowSizeClass(width: number): WindowSizeClass {
  if (width < 600) return "compact";
  if (width < 840) return "medium";
  if (width < 1200) return "expanded";
  if (width < 1600) return "large";
  return "extra-large";
}

interface WindowSizeProviderProps {
  children: React.ReactNode;
}

export function WindowSizeProvider({ children }: WindowSizeProviderProps) {
  const [sizeClass, setSizeClass] = useState<WindowSizeClass>("compact");
  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    function handleResize() {
      const newWidth = window.innerWidth;
      setWidth(newWidth);
      const sc = getWindowSizeClass(newWidth);
      setSizeClass(sc);
      const isCompact = sc === "compact";
      
      const spaceScale = isCompact ? "0.85" : "1";
      const typeScale = isCompact ? "0.9" : "1";
      const radiusScale = isCompact ? "0.9" : "1";

      // Set data attributes and CSS variables on html element for CSS to use
      document.documentElement.setAttribute("data-wsc", sc);
      document.documentElement.style.setProperty("--scale-space", spaceScale);
      document.documentElement.style.setProperty("--scale-type", typeScale);
      document.documentElement.style.setProperty("--scale-radius", radiusScale);
    }

    // Initial setup
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <WindowSizeContext.Provider value={{ sizeClass, width }}>
      {children}
    </WindowSizeContext.Provider>
  );
}
