import { cn } from "@ui/lib/utils";

export function Gradient({
  conic,
  className,
  small,
}: {
  small?: boolean;
  conic?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "absolute mix-blend-normal will-change-[filter] rounded-[100%]",
        small ? "blur-[calc(var(--unit)*8)]" : "blur-[calc(var(--unit)*19)]",
        conic && "bg-gradient-to-r from-error via-tertiary to-primary from-10% via-30% to-100%",
        className
      )}
      aria-hidden="true"
    />
  );
}
