import React from 'react';
import { NavCategory } from '../types';
import Header from './header';
import HomePage from './pages/home-page';
import ButtonPage from './docs/button-page';
import CardPage from './docs/card-page';
import ComponentsOverviewPage from './pages/components-overview-page';
import { DocLayout } from './pages/doc-layout';

interface MainContentProps {
  isPushed: boolean;
  activeCategory?: NavCategory;
  activeSubItemId: string;
  onNavigateSubItem: (id: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({ 
    isPushed, 
    activeCategory, 
    activeSubItemId, 
    onNavigateSubItem 
}) => {
  
  // --- ROUTER LOGIC ---
  const renderContent = () => {
    if (!activeCategory) return <HomePage />;
    const id = activeCategory.id;

    // 1. Home
    if (id === 'home') return <HomePage />;

    // 2. Components
    if (id === 'components') {
        // Router for Components Sub-section
        switch (activeSubItemId) {
            case 'button':
                return <ButtonPage />;
            case 'card':
                return <CardPage />;
            case 'components-overview':
            case '':
                return <ComponentsOverviewPage onNavigate={onNavigateSubItem} />;
            default:
                // Construction Fallback for known component IDs
                return (
                    <DocLayout 
                        title={activeCategory.items?.find(i => i.id === activeSubItemId)?.label || "Component"} 
                        description="Documentation is being written."
                    >
                        <div className="p-12 bg-surface-container-low rounded-3xl border border-outline-variant text-center">
                            <span className="material-symbols-outlined !text-[48px] text-on-surface-variant mb-4">construction</span>
                            <p className="text-on-surface-variant text-lg">
                                This component documentation is currently under construction.
                            </p>
                        </div>
                    </DocLayout>
                );
        }
    }

    // 3. Fallback for other categories (Foundations, Patterns, etc.)
    return (
        <DocLayout 
            title={activeCategory.label} 
            description={`Documentation and guidelines for ${activeCategory.label}.`}
        >
             <div className="p-12 bg-surface-container-low rounded-3xl border border-outline-variant text-center">
                <span className="material-symbols-outlined !text-[48px] text-on-surface-variant mb-4">construction</span>
                <p className="text-on-surface-variant text-lg">
                    The <strong>{activeCategory.label}</strong> section is coming soon. <br/>
                    We are working hard to bring you comprehensive documentation.
                </p>
            </div>
        </DocLayout>
    );
  };

  return (
    <main 
      className={`
        flex-1 min-h-screen bg-surface 
        transition-[margin] duration-500 ease-emphasized
        mt-16 md:mt-0
        ml-0 md:ml-[var(--nav-offset)]
        flex flex-col
      `}
      style={{
        '--nav-offset': isPushed ? '300px' : '80px', 
      } as React.CSSProperties}
    >
      {/* Desktop Header: Edge to Edge */}
      <Header />

      {/* Content Container */}
      <div className="px-6u py-4u md:px-12u md:py-6u container mx-auto max-w-[1600px] @container">
         {renderContent()}
      </div>
    </main>
  );
};

export default MainContent;