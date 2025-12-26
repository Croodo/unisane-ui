import React from 'react';
import { Button } from '../ui/button';

const HomePage: React.FC = () => {
  return (
    <div className="animate-slide-up">
        <header className="mb-12">
            <div className={`
              rounded-[2rem] p-12 md:p-16 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden transition-colors duration-500 ease-in-out
              bg-[#FDF0E5]
            `}>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-5xl md:text-7xl font-normal text-stone-900 mb-6 tracking-tight">
                        Unisane UI
                    </h1>
                    <p className="text-xl md:text-2xl text-stone-600 leading-relaxed mb-8 font-light">
                        A high-fidelity React UI library based on Material Design 3. Beautiful, accessible, and ready for production.
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                        <Button variant="filled" className="!py-3.5 !px-8 !text-lg !h-auto">Get started</Button>
                        <Button variant="outlined" className="!py-3.5 !px-8 !text-lg !h-auto bg-transparent">Github</Button>
                    </div>
                </div>
                
                <div className="absolute right-0 top-0 w-80 h-80 bg-white/40 rounded-full mix-blend-overlay filter blur-3xl opacity-60 animate-pulse"></div>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up-delay">
            <div className="bg-stone-100 p-8 rounded-3xl min-h-[200px] flex flex-col justify-end transition-transform hover:-translate-y-1 duration-300 ease-out group cursor-pointer">
            <h3 className="text-2xl mb-2 group-hover:text-primary transition-colors">Component Library</h3>
            <p className="text-stone-500">Over 30+ accessible components</p>
            </div>
            <div className="bg-stone-100 p-8 rounded-3xl min-h-[200px] flex flex-col justify-end transition-transform hover:-translate-y-1 duration-300 ease-out group cursor-pointer">
            <h3 className="text-2xl mb-2 group-hover:text-primary transition-colors">Theme Builder</h3>
            <p className="text-stone-500">Customizable design tokens</p>
            </div>
            <div className="bg-stone-100 p-8 rounded-3xl min-h-[200px] flex flex-col justify-end transition-transform hover:-translate-y-1 duration-300 ease-out group cursor-pointer">
            <h3 className="text-2xl mb-2 group-hover:text-primary transition-colors">Production Ready</h3>
            <p className="text-stone-500">TypeScript, Tailwind, and React 19</p>
            </div>
        </div>
    </div>
  );
};

export default HomePage;