import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({
  width = 96,
  height = 96,
  className = "w-24 h-24 drop-shadow-md object-contain",
  priority = true,
}: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="POT - Presensi & Operasional"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
