import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export function Icon({
  icon,
  size = 14,
  strokeWidth = 1.5,
  fill = "none",
  className,
  ...rest
}: {
  icon: IconSvgElement;
  size?: number;
  strokeWidth?: number;
  fill?: string;
  className?: string;
} & Omit<
  React.ComponentProps<typeof HugeiconsIcon>,
  "icon" | "size" | "strokeWidth" | "fill"
>) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      fill={fill}
      className={`shrink-0${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}
