import React from 'react';
import { Typography } from '../ui/Typography';
import { Grid, GridCol } from '../ui/Layout';
import { cn } from '../../lib/utils';

const ColorCard = ({ role, label, hex }: { role: string; label: string; hex?: string }) => (
  <div className="flex flex-col gap-2 group cursor-pointer">
    <div className={cn("h-20 md:h-24 w-full rounded-[16px] md:rounded-[20px] shadow-sm transition-transform duration-300 group-hover:scale-[1.02]", role)} />
    <div className="flex flex-col px-1">
        <span className="text-sm font-medium text-on-surface">{label}</span>
        {hex && <span className="text-xs text-on-surface-variant font-mono">{hex}</span>}
    </div>
  </div>
);

export const ColorTypographySection = () => {
  return (
    <section className="flex flex-col gap-6 md:gap-8">
       <div>
           <Typography variant="headlineMedium" className="mb-2 md:mb-6">Foundations</Typography>
       </div>

       <Grid className="px-0 max-w-none">
          {/* Typography Scale */}
          <GridCol span={12} spanLg={7} className="flex flex-col gap-8 p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container-low border border-outline-variant/20">
              <Typography variant="titleLarge" className="opacity-50 mb-2 md:mb-4">Typography Scale</Typography>
              <div className="space-y-6 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] items-baseline gap-2 md:gap-4">
                      <span className="text-xs text-on-surface-variant font-mono">Display Large</span>
                      <Typography variant="displayLarge" className="text-[32px] leading-tight md:text-[57px] md:leading-[64px] truncate">Human stories</Typography>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] items-baseline gap-2 md:gap-4">
                      <span className="text-xs text-on-surface-variant font-mono">Headline Med</span>
                      <Typography variant="headlineMedium" className="text-[24px] md:text-[28px] truncate">Building inclusive products</Typography>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] items-baseline gap-2 md:gap-4">
                      <span className="text-xs text-on-surface-variant font-mono">Title Medium</span>
                      <Typography variant="titleMedium">Refining the details</Typography>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] items-baseline gap-2 md:gap-4">
                      <span className="text-xs text-on-surface-variant font-mono">Body Large</span>
                      <Typography variant="bodyLarge">
                          Material is an adaptable system of guidelines, components, and tools that support the best practices of user interface design.
                      </Typography>
                  </div>
              </div>
          </GridCol>

          {/* Color System */}
          <GridCol span={12} spanLg={5} className="flex flex-col gap-8 p-5 md:p-8 rounded-[24px] md:rounded-[28px] bg-surface-container border border-outline-variant/20">
              <Typography variant="titleLarge" className="opacity-50 mb-2 md:mb-4">Color Roles</Typography>
              <div className="grid grid-cols-2 gap-4">
                  <ColorCard role="bg-primary" label="Primary" hex="--sys-primary" />
                  <ColorCard role="bg-secondary" label="Secondary" hex="--sys-secondary" />
                  <ColorCard role="bg-tertiary" label="Tertiary" hex="--sys-tertiary" />
                  <ColorCard role="bg-error" label="Error" hex="--sys-error" />
                  
                  <ColorCard role="bg-primary-container" label="Pri. Container" />
                  <ColorCard role="bg-surface-container-highest" label="Surface High" />
              </div>
          </GridCol>
       </Grid>
    </section>
  );
};