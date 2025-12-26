import React from 'react';
import NavigationRail from './app-navigation-rail';
import NavigationDrawer from './app-navigation-drawer';
import TopAppBar from './app-top-app-bar';
import { NAV_DATA } from '../constants';
import { useNavigation } from '../hooks/useNavigation';

interface MaterialAppProps {
    navigation: ReturnType<typeof useNavigation>;
    children: React.ReactNode;
}

const MaterialApp: React.FC<MaterialAppProps> = ({ navigation, children }) => {
    const {
        activeCategoryId,
        activeSubItemId,
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
    } = navigation;

    // Determine the title for the Mobile Top App Bar
    // Default to "M3 Navigation" if home, otherwise the category label
    const title = activeCategoryId === 'home' 
        ? 'M3 Navigation' 
        : (NAV_DATA.find(c => c.id === activeCategoryId)?.label || 'M3 Navigation');

    // Calculate backdrop visibility logic
    // We want to keep the backdrop mounted if the drawer is visible, 
    // but fade it out if we are in Push Mode (Desktop locked).
    const shouldRenderBackdrop = isDrawerVisible || isMobileMenuOpen;
    const isBackdropVisible = (isDrawerVisible && !isPushMode) || isMobileMenuOpen;

    return (
        <div className="flex w-full min-h-screen bg-surface-container isolate flex-col md:flex-row">
            
            {/* Mobile Top Bar (z-50) */}
            <TopAppBar 
                title={title} 
                onMenuClick={toggleMobileMenu} 
            />

            {/* Navigation Rail (z-50 on Desktop) */}
            <NavigationRail 
                categories={NAV_DATA}
                activeCategoryId={activeCategoryId}
                onSelectCategory={handleCategoryClick}
                onHoverCategory={handleInteractionEnter}
                onLeaveRail={handleInteractionLeave}
                isDrawerOpen={isDrawerVisible} 
            />

            {/* Navigation Drawer (z-30 Desktop, z-60 Mobile) */}
            <NavigationDrawer 
                isOpen={isDrawerVisible || isMobileMenuOpen}
                activeCategory={effectiveCategory}
                activeSubItemId={activeSubItemId}
                isOverlay={!isPushMode || isMobileMenuOpen} 
                mobileMode={isMobileMenuOpen}
                onMouseEnter={handleDrawerEnter}
                onMouseLeave={handleDrawerLeave}
                onSelectSubItem={handleSubItemClick}
                onSelectCategory={handleCategoryClick}
            />

            {/* Main Content Injection */}
            {children}
            
            {/* Backdrop
                - Mobile: z-[59] to cover Header (z-50) but sit below Drawer (z-60).
                - Desktop: z-20 to sit below Drawer (z-30) and Rail (z-50).
                - Transition: Opacity allows smooth fade-out when locking the drawer (Push Mode).
            */}
            {shouldRenderBackdrop && (
                <div 
                    className={`
                        fixed inset-0 bg-black/30 transition-opacity duration-300 ease-standard
                        z-[59] md:z-20
                        ${isBackdropVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                    `}
                    onClick={() => {
                        if(isMobileMenuOpen) toggleMobileMenu();
                        handleInteractionLeave();
                    }}
                />
            )}
        </div>
    );
};

export default MaterialApp;