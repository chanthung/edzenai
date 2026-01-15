import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface AmountDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
  labelClassName?: string;
}

export function AmountDisplay({ 
  amount, 
  size = 'md', 
  label, 
  className,
  labelClassName 
}: AmountDisplayProps) {
  const sizeClasses = {
    sm: "text-lg font-semibold",
    md: "text-xl font-semibold",
    lg: "text-2xl md:text-3xl font-bold",
    xl: "text-3xl md:text-4xl font-bold tracking-tight",
  };
  
  return (
    <div className={cn("flex flex-col", className)}>
      {label && (
        <span className={cn("text-sm text-muted-foreground mb-1", labelClassName)}>
          {label}
        </span>
      )}
      <span className={sizeClasses[size]}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}
