"use client";

export type HeroTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "surface"
  | "error";

interface HeroBackgroundProps {
  tone?: HeroTone;
  children: React.ReactNode;
  className?: string;
  align?: "center" | "start" | "end";
  justify?: "center" | "start" | "end";
}

const toneClasses: Record<HeroTone, string> = {
  primary: "bg-primary-container/40",
  secondary: "bg-secondary-container/35",
  tertiary: "bg-tertiary-container/35",
  surface: "bg-surface-container/50",
  error: "bg-error-container/25",
};

const alignClasses: Record<string, string> = {
  center: "items-center",
  start: "items-start",
  end: "items-end",
};

const justifyClasses: Record<string, string> = {
  center: "justify-center",
  start: "justify-start",
  end: "justify-end",
};

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  tone = "primary",
  children,
  className = "",
  align = "center",
  justify = "center",
}) => {
  return (
    <div
      className={`relative w-full h-full flex p-6 ${toneClasses[tone]} ${alignClasses[align]} ${justifyClasses[justify]} ${className}`.trim()}
    >
      {children}
    </div>
  );
};
