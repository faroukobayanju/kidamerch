import logoSrc from "@/assets/kida-logo.png";

export { logoSrc };

/**
 * Brand mark. Primary identity element — sized generously per brand guidelines.
 * `alt` carries the brand name so the mark stays readable to screen readers.
 *
 * The drop-shadow keeps the mark legible on both the frost light theme and the
 * deep navy dark theme without needing two separate assets.
 */
export function Logo({
  className = "h-14 w-auto",
  alt = "KIDA",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={logoSrc}
      alt={alt}
      width={1024}
      height={1024}
      className={`shrink-0 object-contain [filter:drop-shadow(0_1px_2px_rgb(2_34_74_/_0.28))] dark:[filter:drop-shadow(0_0_10px_rgb(200_220_245_/_0.35))] ${className}`}
    />
  );
}
