import { useState, useRef, useCallback, useEffect } from 'react';
import { NAV_DATA } from '../constants';

export const useNavigation = () => {
  // PERSISTENT STATE (User Clicked)
  const [activeCategoryId, setActiveCategoryId] = useState<string>('home');
  const [activeSubItemId, setActiveSubItemId] = useState<string>('');
  const [isDrawerLocked, setIsDrawerLocked] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false); // New Mobile State

  // TRANSIENT STATE (User Hover/Focus)
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  
  // VISUAL STATE (Content Persistence)
  const [lastContentCategoryId, setLastContentCategoryId] = useState<string>('home');

  // TIMEOUT REFS
  const entryTimeoutRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);

  // --- ACTIONS ---

  const handleCategoryClick = useCallback((id: string) => {
    // 1. CLEAR TIMERS
    if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);

    const category = NAV_DATA.find((c) => c.id === id);
    const categoryHasItems = category?.items && category.items.length > 0;

    if (activeCategoryId === id) {
      if (categoryHasItems) {
        setIsDrawerLocked(prev => !prev);
      } else {
        setIsDrawerLocked(false);
      }
    } else {
      setActiveCategoryId(id);
      
      // Default sub-navigation logic
      if (id === 'components') {
        setActiveSubItemId('c-0'); // Default to Overview
      } else {
        setActiveSubItemId('');
      }
      
      // Auto-lock drawer if items exist, otherwise close
      setIsDrawerLocked(!!categoryHasItems);
    }
    
    // Fix: Close mobile menu if category has no items (leaf node)
    if (!categoryHasItems) {
        setIsMobileMenuOpen(false);
    }
    
    setHoveredCategoryId(null);
  }, [activeCategoryId]);

  const handleSubItemClick = useCallback((id: string) => {
    // Clear hover state and timeouts to ensure clean transition to locked state
    if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    setHoveredCategoryId(null);

    setActiveSubItemId(id);
    setIsDrawerLocked(true); 
    setIsMobileMenuOpen(false); // Close mobile menu on selection
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const handleInteractionEnter = useCallback((id: string) => {
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);

    entryTimeoutRef.current = window.setTimeout(() => {
      setHoveredCategoryId(id);
    }, 150); 
  }, []);

  const handleInteractionLeave = useCallback(() => {
    if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
    exitTimeoutRef.current = window.setTimeout(() => {
      setHoveredCategoryId(null);
    }, 300); 
  }, []);

  const handleDrawerEnter = useCallback(() => {
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
  }, []);

  const handleDrawerLeave = useCallback(() => {
    exitTimeoutRef.current = window.setTimeout(() => {
      setHoveredCategoryId(null);
    }, 300);
  }, []);

  // --- DERIVED STATE & EFFECTS ---

  const activeCategory = NAV_DATA.find(c => c.id === activeCategoryId);
  const hoveredCategory = hoveredCategoryId ? NAV_DATA.find(c => c.id === hoveredCategoryId) : null;

  const hoverHasItems = hoveredCategory?.items && hoveredCategory.items.length > 0;

  let targetCategory = activeCategory;
  if (hoveredCategory && hoverHasItems) {
    targetCategory = hoveredCategory;
  }

  useEffect(() => {
    const targetHasItems = targetCategory?.items && targetCategory.items.length > 0;
    if (targetHasItems && targetCategory) {
      setLastContentCategoryId(targetCategory.id);
    }
  }, [targetCategory]);

  const effectiveCategory = NAV_DATA.find(c => c.id === lastContentCategoryId);
  const isDrawerVisible = isDrawerLocked || (!!hoveredCategoryId && hoverHasItems);
  const isPushMode = isDrawerLocked;

  return {
    activeCategoryId,
    activeSubItemId,
    activeCategory,
    effectiveCategory,
    isDrawerVisible,
    isPushMode,
    isMobileMenuOpen,
    handleCategoryClick,
    handleSubItemClick,
    handleInteractionEnter,
    handleInteractionLeave,
    handleDrawerEnter,
    handleDrawerLeave,
    toggleMobileMenu
  };
};