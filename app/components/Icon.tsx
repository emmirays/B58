import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export function Icon({
  icon,
  size = 14,
  strokeWidth = 1.5,
  className,
  ...rest
}: {
  icon: IconSvgElement;
  size?: number;
  strokeWidth?: number;
  className?: string;
} & Omit<
  React.ComponentProps<typeof HugeiconsIcon>,
  "icon" | "size" | "strokeWidth"
>) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={`shrink-0${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}
