import React from 'react';

export interface TocItem {
  id: string;
  label: string;
}

interface DocLayoutProps {
  title: string;
  description: string;
  heroContent?: React.ReactNode;
  toc?: TocItem[];
  children: React.ReactNode;
}

export const DocLayout: React.FC<DocLayoutProps> = ({ 
  title, 
  description, 
  heroContent, 
  toc, 
  children 
}) => {
  return (
    // Switch from flex-col -> row based on container width (@4xl is roughly 56rem/896px)
    <div className="animate-slide-up flex flex-col @4xl:flex-row gap-16 w-full pb-32">
      
      {/* Main Content Column */}
      <div className="flex-1 min-w-0">
        
        {/* Header Section */}
        <header className="mb-20 flex flex-col @5xl:flex-row gap-12 items-start">
            {/* Text Content */}
            <div className="flex-1 pt-4">
                <h1 className="text-[3rem] md:text-[4.5rem] leading-[1.1] font-normal text-[#1D192B] mb-8 tracking-tight break-words">
                    {title}
                </h1>
                <p className="text-xl md:text-2xl text-[#49454F] font-normal leading-relaxed max-w-2xl">
                    {description}
                </p>
            </div>
            
            {/* Hero Visual */}
            {heroContent && (
                <div className="w-full @5xl:w-[600px] @5xl:h-[400px] h-[300px] rounded-[2rem] overflow-hidden shrink-0 bg-[#F3F3F1] border border-stone-100">
                    {heroContent}
                </div>
            )}
        </header>

        {/* Page Content */}
        <div className="flex flex-col gap-24">
            {children}
        </div>
      </div>

      {/* Right Sidebar (Table of Contents) - Sticky
          Hidden on smaller containers, visible on larger ones
      */}
      {toc && toc.length > 0 && (
        <aside className="hidden @4xl:block w-64 shrink-0">
            <div className="sticky top-8 pl-8 border-l border-stone-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <h4 className="text-sm font-semibold text-[#1D192B] mb-4 uppercase tracking-wider">On this page</h4>
                <nav className="flex flex-col gap-3">
                    {toc.map((item) => (
                        <a 
                            key={item.id} 
                            href={`#${item.id}`}
                            className="text-sm text-[#49454F] hover:text-[#6750A4] transition-colors text-left py-0.5 block"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>
            </div>
        </aside>
      )}
    </div>
  );
};

interface SectionProps {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const DocSection: React.FC<SectionProps> = ({ id, title, description, children }) => (
  <section id={id} className="scroll-mt-24">
    <h2 className="text-[2rem] md:text-[2.5rem] leading-tight font-normal text-[#1D192B] mb-6">
        {title}
    </h2>
    {description && (
        <p className="text-lg text-[#49454F] mb-8 max-w-4xl leading-relaxed">
            {description}
        </p>
    )}
    <div className="mt-8">
        {children}
    </div>
  </section>
);