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
      className={`absolute mix-blend-normal will-change-[filter] rounded-[100%] ${
        small ? "blur-[32px]" : "blur-[75px]"
      } ${
        conic
          ? "bg-gradient-to-r from-error via-tertiary to-primary from-10% via-30% to-100%"
          : ""
      } ${className ?? ""}`}
    />
  );
}
