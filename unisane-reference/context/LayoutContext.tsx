import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface LayoutContextType {
  isNavOpen: boolean;
  setNavOpen: (open: boolean) => void;
  toggleNav: () => void;
  
  isPaneOpen: boolean; // Supporting Pane (Right side)
  setPaneOpen: (open: boolean) => void;
  togglePane: () => void;

  activeSection: string;
  setActiveSection: (id: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isNavOpen, setNavOpen] = useState(false);
  const [isPaneOpen, setPaneOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Intelligent initialization for large screens
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)'); // XL Breakpoint
    
    // Set initial state
    if (mediaQuery.matches) {
      setPaneOpen(true);
    }

    // Optional: Listen for resize to auto-open/close? 
    // Usually better to respect user choice after load, but we can auto-close on shrink.
    const handler = (e: MediaQueryListEvent) => {
      if (!e.matches) {
        setPaneOpen(false); // Auto close when shrinking below XL
      } else {
        setPaneOpen(true); // Auto open when expanding to XL
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleNav = () => setNavOpen(prev => !prev);
  const togglePane = () => setPaneOpen(prev => !prev);

  return (
    <LayoutContext.Provider value={{
      isNavOpen, setNavOpen, toggleNav,
      isPaneOpen, setPaneOpen, togglePane,
      activeSection, setActiveSection
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
