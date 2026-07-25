import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number | null | undefined;
  total?: number | null;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  className?: string;
}

const sizeMap = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };
const textMap = { sm: "text-xs", md: "text-sm", lg: "text-base" };

export function StarRating({
  value,
  total,
  size = "md",
  showNumber = true,
  className,
}: StarRatingProps) {
  const nota = value ?? 0;
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Star className={cn(sizeMap[size], "fill-[var(--star)] text-[var(--star)]")} />
      {showNumber && (
        <span className={cn(textMap[size], "font-medium text-foreground")}>
          {nota > 0 ? nota.toFixed(1) : "Novo"}
        </span>
      )}
      {typeof total === "number" && total > 0 && (
        <span className={cn(textMap[size], "text-muted-foreground")}>({total})</span>
      )}
    </div>
  );
}
