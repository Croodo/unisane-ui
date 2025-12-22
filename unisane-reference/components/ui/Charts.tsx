import React, { useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { Typography } from './Typography';

// --- Types ---
interface ChartDataPoint {
  label: string;
  value: number;
}

interface BaseChartProps {
  data: ChartDataPoint[];
  className?: string;
  height?: number;
  color?: string; // Tailwind color class e.g. "text-primary"
}

// --- Helper: Tooltip Overlay ---
const ChartTooltip = ({ active, payload, label, x, y }: any) => {
  if (!active || !payload) return null;
  return (
    <div 
        className="absolute pointer-events-none bg-inverse-surface text-inverse-on-surface text-xs rounded-md py-1u px-2u shadow-2 z-10 whitespace-nowrap"
        style={{ left: x, top: y, transform: 'translate(-50%, -120%)' }}
    >
       <div className="font-bold">{payload.value}</div>
       <div className="opacity-80 text-[10px]">{label}</div>
    </div>
  );
};

// --- Line Chart ---
export const LineChart: React.FC<BaseChartProps> = ({ 
  data, 
  className, 
  height = 200, 
  color = "text-primary" 
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const padding = 20;
  const width = 100; // Normalized SVG width
  const chartHeight = 50; // Normalized SVG height
  
  const values = data.map(d => d.value);
  const max = Math.max(...values) || 1;
  const min = 0; // Baseline 0 for simplicity

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = chartHeight - ((d.value - min) / (max - min)) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const fillD = `${pathD} L ${width},${chartHeight} L 0,${chartHeight} Z`;

  return (
    <div className={cn("relative w-full select-none", className)} style={{ height }}>
      <svg 
        viewBox={`0 -10 ${width} ${chartHeight + 20}`} 
        preserveAspectRatio="none" 
        className="w-full h-full overflow-visible"
      >
        {/* Grid lines (optional) */}
        <line x1="0" y1={chartHeight} x2={width} y2={chartHeight} stroke="currentColor" strokeWidth="0.5" className="text-outline-variant" />
        
        {/* Gradient Fill */}
        <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" className={color} />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" className={color} />
            </linearGradient>
        </defs>
        <path d={fillD} fill={`url(#gradient-${color})`} className={color} />

        {/* Line Stroke */}
        <path 
            d={pathD} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            vectorEffect="non-scaling-stroke"
            className={color}
        />

        {/* Interactive Points */}
        {points.map((p, i) => (
           <g key={i}>
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="0" // Invisible trigger area logic handled by overlay usually, but here we use visible dots on hover
                className="fill-transparent stroke-none"
              />
              {/* Visible dot on hover or active */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={hoveredIndex === i ? 2 : 0} 
                stroke="currentColor"
                strokeWidth="1"
                fill="var(--uni-sys-color-surface)"
                className={cn("transition-all duration-200", color)}
                vectorEffect="non-scaling-stroke"
              />
           </g>
        ))}
      </svg>
      
      {/* Overlay for hover detection */}
      <div className="absolute inset-0 flex items-end">
          {points.map((p, i) => (
              <div 
                key={i} 
                className="flex-1 h-full hover:bg-on-surface/5 transition-colors cursor-crosshair group relative"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                  {hoveredIndex === i && (
                      <ChartTooltip 
                        active={true} 
                        payload={p} 
                        label={p.label} 
                        x="50%" 
                        y={`${(p.y / chartHeight) * 100}%`} // Rough approximation for tooltip Y
                      />
                  )}
              </div>
          ))}
      </div>
      
      {/* X Axis Labels */}
      <div className="flex justify-between mt-2u px-2u">
         {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0).map((d, i) => (
             <span key={i} className="text-xs text-on-surface-variant font-medium">{d.label}</span>
         ))}
      </div>
    </div>
  );
};

// --- Bar Chart ---
export const BarChart: React.FC<BaseChartProps> = ({
    data,
    className,
    height = 200,
    color = "bg-primary"
}) => {
    const values = data.map(d => d.value);
    const max = Math.max(...values) || 1;

    return (
        <div className={cn("w-full flex flex-col gap-2u select-none", className)} style={{ height }}>
            <div className="flex-1 flex items-end gap-1 md:gap-2">
                {data.map((d, i) => {
                    const barHeight = (d.value / max) * 100;
                    return (
                        <div key={i} className="flex-1 h-full flex items-end justify-center group relative">
                            <div 
                                className={cn(
                                    "w-full max-w-[32px] rounded-t-sm transition-all duration-500 ease-out group-hover:opacity-80 relative min-h-[4px]",
                                    color
                                )}
                                style={{ height: `${barHeight}%` }}
                            >
                                {/* Tooltip */}
                                <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                     <div className="bg-inverse-surface text-inverse-on-surface text-xs rounded px-2u py-1u whitespace-nowrap shadow-sm">
                                         {d.value}
                                     </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* X Axis Labels */}
            <div className="flex justify-between px-1u border-t border-outline-variant/40 pt-2u">
                 {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((d, i) => (
                     <span key={i} className="text-[10px] sm:text-xs text-on-surface-variant text-center w-full">{d.label}</span>
                 ))}
            </div>
        </div>
    );
};

// --- Donut Chart ---
export const DonutChart: React.FC<BaseChartProps & { label?: string }> = ({
    data,
    className,
    height = 200,
    label
}) => {
    // Simple SVG Donut implementation
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    const size = 100;
    const strokeWidth = 12; // Thickness
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    let cumulativeOffset = 0;
    
    // Assign standard colors if not provided in a complex object, cycling through M3 roles
    const colors = ["text-primary", "text-secondary", "text-tertiary", "text-error", "text-outline"];

    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ height, width: height }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
                {data.map((d, i) => {
                    const percentage = (d.value / total);
                    const dashArray = percentage * circumference;
                    const offset = cumulativeOffset;
                    cumulativeOffset += dashArray;
                    
                    return (
                        <circle
                            key={i}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                            strokeDashoffset={-offset}
                            className={cn(
                                "transition-all duration-500 ease-out hover:opacity-80 hover:stroke-[14]", 
                                colors[i % colors.length]
                            )}
                        >
                            <title>{d.label}: {d.value}</title>
                        </circle>
                    );
                })}
            </svg>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-bold text-on-surface">{total}</span>
                 {label && <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">{label}</span>}
            </div>
        </div>
    );
};

// --- Legend Helper ---
export const ChartLegend: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
    const colors = ["bg-primary", "bg-secondary", "bg-tertiary", "bg-error", "bg-outline"];
    return (
        <div className="flex flex-wrap gap-4u justify-center mt-4u">
            {data.map((d, i) => (
                <div key={i} className="flex items-center gap-2u">
                    <div className={cn("w-3u h-3u rounded-full", colors[i % colors.length])} />
                    <span className="text-sm text-on-surface-variant">{d.label}</span>
                </div>
            ))}
        </div>
    );
};