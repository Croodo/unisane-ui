import React from 'react';

export type Variant = 'filled' | 'outlined' | 'text' | 'tonal' | 'elevated';
export type Size = 'sm' | 'md' | 'lg';
export type ColorRole = 'primary' | 'secondary' | 'tertiary' | 'error';

export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}