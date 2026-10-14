import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export interface HugeIconProps {
  icon: IconSvgElement;
  size?: number | string;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function HugeIcon({
  icon,
  size = 20,
  className = "",
  strokeWidth = 1.8,
  color = "currentColor",
}: HugeIconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      className={className}
      strokeWidth={strokeWidth}
      color={color}
    />
  );
}
