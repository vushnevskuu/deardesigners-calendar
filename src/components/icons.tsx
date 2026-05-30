type IconProps = {
  size?: number;
  rotate?: number;
  className?: string;
  responsive?: boolean;
};

export function ArrowRight({
  size = 16,
  rotate = 0,
  className,
  responsive,
}: IconProps) {
  const sizeProps = responsive ? {} : { width: size, height: size };
  return (
    <svg
      {...sizeProps}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ transform: `rotate(${rotate}deg)` }}
      className={className}
    >
      <path d="M3 8h10" />
      <path d="M9 4l4 4-4 4" />
    </svg>
  );
}

export function PlusIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <path d="M7 2v10" />
      <path d="M2 7h10" />
    </svg>
  );
}

export function CloseIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <path d="M3 3l8 8" />
      <path d="M11 3l-8 8" />
    </svg>
  );
}

export function SparkleIcon({ size = 12, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M6 0l1.2 4.8L12 6l-4.8 1.2L6 12 4.8 7.2 0 6l4.8-1.2L6 0z" />
    </svg>
  );
}

export function DotIcon({ size = 8, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <circle cx="4" cy="4" r="4" />
    </svg>
  );
}
