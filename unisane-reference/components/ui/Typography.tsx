import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const typographyVariants = cva(
  "text-on-surface transition-colors duration-standard ease-standard",
  {
    variants: {
      variant: {
        displayLarge: 'text-display-lg font-normal tracking-tighter leading-none',
        displayMedium: 'text-[45px] leading-[52px] font-normal tracking-tight',
        displaySmall: 'text-[36px] leading-[44px] font-normal tracking-tight',
        
        headlineLarge: 'text-[32px] leading-[40px] font-normal tracking-tight',
        headlineMedium: 'text-[28px] leading-[36px] font-normal tracking-tight',
        headlineSmall: 'text-headline-sm font-black uppercase tracking-tight leading-none',
        
        titleLarge: 'text-[22px] leading-[28px] font-black uppercase tracking-tight',
        titleMedium: 'text-title-md font-bold uppercase tracking-tight leading-none',
        titleSmall: 'text-[14px] leading-[20px] font-bold uppercase tracking-widest',
        
        bodyLarge: 'text-[16px] leading-[24px] font-medium tracking-[0.5px]',
        bodyMedium: 'text-body-md font-medium leading-normal tracking-[0.25px]',
        bodySmall: 'text-[12px] leading-[16px] font-bold uppercase tracking-[0.4px] opacity-70',
        
        labelLarge: 'text-[14px] leading-[20px] font-black uppercase tracking-[0.1em]',
        labelMedium: 'text-[12px] leading-[16px] font-black uppercase tracking-[0.15em]',
        labelSmall: 'text-label-sm font-black uppercase tracking-[0.2em] leading-none',
      },
    },
    defaultVariants: {
      variant: "bodyLarge",
    },
  }
);

type TypographyVariant = NonNullable<VariantProps<typeof typographyVariants>['variant']>;

export type TypographyProps = React.HTMLAttributes<HTMLElement> & VariantProps<typeof typographyVariants> & {
  component?: React.ElementType;
};

const defaultTags: Record<TypographyVariant, React.ElementType> = {
  displayLarge: 'h1', displayMedium: 'h1', displaySmall: 'h1',
  headlineLarge: 'h2', headlineMedium: 'h2', headlineSmall: 'h2',
  titleLarge: 'h3', titleMedium: 'h3', titleSmall: 'h3',
  bodyLarge: 'p', bodyMedium: 'p', bodySmall: 'p',
  labelLarge: 'span', labelMedium: 'span', labelSmall: 'span',
};

export const Typography: React.FC<TypographyProps> = ({ 
  variant = 'bodyLarge', 
  component, 
  className, 
  children,
  ...props 
}) => {
  const Component = component || defaultTags[variant as TypographyVariant] || 'p';
  return (
    <Component className={cn(typographyVariants({ variant, className }))} {...props}>
      {children}
    </Component>
  );
};