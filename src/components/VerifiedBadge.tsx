import { BadgeCheck } from "lucide-react";

interface Props {
  verified: boolean;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function VerifiedBadge({ verified, size = "sm", showLabel = false }: Props) {
  if (!verified) return null;
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span
      className="inline-flex items-center gap-1 text-primary"
      title="موثّق من نقابة الأطباء"
    >
      <BadgeCheck className={iconSize} />
      {showLabel && <span className="text-xs font-medium">طبيب موثّق</span>}
    </span>
  );
}
