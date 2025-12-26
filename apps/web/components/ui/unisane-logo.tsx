"use client";

import React, { forwardRef } from "react";

export interface UnisaneLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const UnisaneLogo = forwardRef<SVGSVGElement, UnisaneLogoProps>(
  ({ size = 32, className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className || ""}`}
        {...props}
      >
        {/* Left Stem (Blue) */}
        <path
          d="M8 6V18"
          stroke="#4285F4"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Bottom Bowl (Red) */}
        <path
          d="M8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18"
          stroke="#EA4335"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Right Stem - Short (Yellow) */}
        <path
          d="M24 18V14"
          stroke="#FBBC04"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Dot (Green) */}
        <circle cx="24" cy="7" r="3" fill="#34A853" />
      </svg>
    );
  }
);

UnisaneLogo.displayName = "UnisaneLogo";
