import React, { useState } from 'react';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import { Icon } from './ui/Icon';
import { CommandPalette } from './ui/CommandPalette';
import { cn } from '../lib/utils';

// Import Modular Showcases
import { ActionShowcase } from './showcase/ActionShowcase';
import { InputShowcase } from './showcase/InputShowcase';
import { DataDisplayShowcase } from './showcase/DataDisplayShowcase';
import { FeedbackShowcase } from './showcase/FeedbackShowcase';
import { NavigationShowcase } from './showcase/NavigationShowcase';

export const ShowcaseLanding = () => {
  const [activeTab, setActiveTab] = useState('actions');
  const [cmdOpen, setCmdOpen] = useState(false);

  const commands = [
    { id: 'home', label: 'Go Home', icon: 'home', action: () => {} },
    { id: 'docs', label: 'Documentation', icon: 'description', action: () => {} },
  ];

  return (
    <div className="h-full overflow-y-auto bg-white scroll-smooth no-scrollbar select-none @container">
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={commands} />

      {/* Hero Section */}
      <section className="px-8 md:px-16 py-20 border-b border-stone-100 bg-stone-900 text-white relative overflow-hidden shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col gap-8 relative z-10">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary rounded-xs flex items-center justify-center text-stone-900 shadow-lg shadow-primary/20">
                 <Icon symbol="deployed_code" size={32} />
              </div>
              <div className="flex flex-col">
                 <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Design System v1.0</Typography>
                 <Typography variant="titleLarge" className="font-black text-white uppercase tracking-widest mt-1">Unisane UI</Typography>
              </div>
           </div>
           
           <div className="max-w-3xl">
               <Typography variant="displayLarge" className="font-black text-white uppercase tracking-tighter leading-[0.9] text-5xl md:text-7xl lg:text-8xl">
                  Industrial <span className="text-stone-500">Precision.</span>
               </Typography>
               <Typography variant="headlineSmall" className="text-stone-400 font-bold uppercase tracking-tight mt-6 max-w-xl leading-relaxed text-sm md:text-base">
                  A comprehensive component library engineered for high-density ERP interfaces. Built with React, Tailwind, and strict geometric principles.
               </Typography>
           </div>

           <div className="flex gap-4 mt-4">
              <Button size="lg" className="px-8 h-12 tracking-widest bg-white text-stone-900 hover:bg-stone-200" onClick={() => setCmdOpen(true)}>EXPLORE</Button>
              <Button variant="outlined" size="lg" className="px-8 h-12 tracking-widest border-stone-700 text-stone-400 hover:text-white">DOCS</Button>
           </div>
        </div>
        
        {/* Abstract Background Decoration */}
        <Icon symbol="grid_4x4" size={400} className="absolute -right-20 -bottom-32 text-white opacity-[0.03] rotate-12 pointer-events-none" />
      </section>

      {/* Main Content Area */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-100 px-8 md:px-16">
        <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent border-none p-0 h-auto gap-8 justify-start overflow-x-auto no-scrollbar w-full">
                    {['actions', 'inputs', 'data', 'feedback', 'navigation'].map(tab => (
                        <TabsTrigger 
                            key={tab} 
                            value={tab} 
                            className="px-0 py-5 h-auto text-[10px] font-black uppercase tracking-[0.15em] rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-stone-400 hover:text-stone-600 transition-all shrink-0"
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
      </div>

      <main className="px-8 md:px-16 py-12 pb-32">
          <div className="max-w-6xl mx-auto min-h-[600px]">
            {activeTab === 'actions' && <ActionShowcase />}
            {activeTab === 'inputs' && <InputShowcase />}
            {activeTab === 'data' && <DataDisplayShowcase />}
            {activeTab === 'feedback' && <FeedbackShowcase />}
            {activeTab === 'navigation' && <NavigationShowcase />}
          </div>
      </main>

      <footer className="py-16 bg-stone-50 border-t border-stone-200 text-center">
         <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">End of Protocol</Typography>
         <div className="flex justify-center gap-4 mt-4 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <div className="h-2 w-2 rounded-full bg-secondary" />
            <div className="h-2 w-2 rounded-full bg-tertiary" />
         </div>
      </footer>
    </div>
  );
};
