import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children?: React.ReactNode;
  container?: HTMLElement;
}

export const Portal = ({ children, container }: PortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, container || document.body);
};