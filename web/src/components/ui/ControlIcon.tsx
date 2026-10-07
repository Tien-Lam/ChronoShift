const paths = {
  chevron: "m6 9 6 6 6-6",
  down: "M12 5v14m-6-6 6 6 6-6",
  check: "m5 12 4 4L19 6",
};

/** Decorative control icons share a font-independent outline and footprint. */
export function ControlIcon({
  name,
  className,
  size = 16,
}: {
  name: keyof typeof paths;
  className?: string;
  size?: number | string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
