import edzenIcon from "@/assets/edzen-icon.png";
import edzenLogoFull from "@/assets/edzen-logo-full.png";

interface EdZenLogoProps {
  /** Size of the icon container */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether to show the "EdZen AI" text beside the icon */
  showText?: boolean;
  /** Additional className for the wrapper */
  className?: string;
  /** Whether the background should be filled (primary) or subtle (primary/10) */
  variant?: "filled" | "subtle";
}

const sizeMap = {
  sm: { container: "w-8 h-8", icon: "h-5 w-5", text: "text-sm", full: "h-8" },
  md: { container: "w-10 h-10", icon: "h-6 w-6", text: "text-base", full: "h-10" },
  lg: { container: "w-12 h-12", icon: "h-7 w-7", text: "text-lg", full: "h-12" },
  xl: { container: "w-16 h-16", icon: "h-9 w-9", text: "text-2xl", full: "h-16" },
};

export function EdZenLogo({ size = "md", showText = true, className = "", variant = "subtle" }: EdZenLogoProps) {
  const s = sizeMap[size];

  if (showText) {
    return (
      <div className={`flex items-center ${className}`}>
        <img src={edzenLogoFull} alt="EdZen AI" className={`${s.full} object-contain`} />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${s.container} rounded-xl flex items-center justify-center shrink-0 ${variant === "filled" ? "bg-primary" : "bg-primary/10"}`}>
        <img src={edzenIcon} alt="EdZen AI" className={`${s.icon} object-contain`} />
      </div>
    </div>
  );
}
