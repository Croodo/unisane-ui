import React from 'react';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Typography } from '../ui/Typography';
import { Icon } from '../ui/Icon';
import { cn } from '../../lib/utils';

export const HeroSection = () => {
  return (
    <section className="w-full">
      {/* Container: M3 Extra Large Shape (28px -> rounded-[28px]) */}
      <div className="relative overflow-hidden rounded-[28px] bg-surface-container-low min-h-[560px] flex flex-col md:flex-row items-center transition-colors duration-500 border border-outline-variant/20 group isolate">
        
        {/* Animated Background Shapes */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[80px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-secondary/10 blur-[60px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        
        {/* Content Side */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center gap-8 relative z-10">
           <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-on-primary shadow-2">
                   <Icon symbol="deployed_code" />
               </div>
               <Chip label="v1.0.0" variant="filter" selected className="bg-surface/50 border-none backdrop-blur-md shadow-sm pointer-events-none" />
           </div>

           <div className="space-y-4">
                <Typography 
                  variant="displayLarge" 
                  className="text-on-surface font-normal tracking-tight text-[44px] leading-[52px] md:text-[64px] md:leading-[72px] lg:text-[80px] lg:leading-[88px] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100"
                >
                  Expressive<br/>
                  <span className="text-primary italic font-serif">Material 3.</span>
                </Typography>
                
                <Typography 
                  variant="headlineSmall" 
                  className="text-on-surface-variant font-light max-w-lg text-xl md:text-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200"
                >
                   A design system blueprint featuring adaptive layouts, fluid motion, and dynamic color tokens.
                </Typography>
           </div>

           <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <Button size="lg" className="rounded-full px-8 bg-primary text-on-primary shadow-2 hover:shadow-4 active:scale-95 transition-all">
                Get Started
                <Icon symbol="arrow_forward" className="ml-2" />
              </Button>
              <Button size="lg" variant="outlined" className="rounded-full px-8 border-outline hover:bg-surface-variant/20 hover:border-on-surface">
                Components
              </Button>
           </div>
        </div>

        {/* Visual Side (Mock UI) */}
        <div className="flex-1 w-full h-full relative min-h-[300px] md:min-h-auto overflow-hidden">
             {/* Abstract UI Cards floating */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] flex items-center justify-center rotate-[-12deg] opacity-90">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="w-48 h-64 bg-surface-container-high rounded-[24px] shadow-3 animate-[slide-up_10s_infinite_alternate] border border-outline-variant/10 p-4">
                         <div className="w-12 h-12 rounded-full bg-tertiary-container mb-4" />
                         <div className="h-4 w-24 bg-surface-variant/50 rounded mb-2" />
                         <div className="h-3 w-16 bg-surface-variant/30 rounded" />
                     </div>
                     <div className="w-48 h-64 bg-primary-container rounded-[24px] shadow-4 mt-12 animate-[slide-up_12s_infinite_alternate-reverse] p-4 flex flex-col justify-between">
                          <div className="text-on-primary-container text-4xl font-medium">Aa</div>
                          <div className="h-2 w-full bg-on-primary-container/20 rounded-full" />
                     </div>
                     <div className="w-48 h-64 bg-secondary-container rounded-[24px] shadow-2 animate-[slide-up_14s_infinite_alternate] p-4">
                          <div className="flex justify-end"><div className="w-8 h-8 rounded-full bg-surface/30" /></div>
                     </div>
                     <div className="w-48 h-64 bg-surface rounded-[24px] shadow-3 mt-8 animate-[slide-up_9s_infinite_alternate-reverse] border border-outline-variant/10 p-4">
                          <div className="w-full h-32 bg-surface-variant/20 rounded-xl mb-4" />
                          <div className="h-4 w-full bg-surface-variant/40 rounded" />
                     </div>
                 </div>
             </div>
             
             {/* Gradient Overlay for bottom fade on mobile */}
             <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent md:hidden" />
        </div>

      </div>
    </section>
  );
};
