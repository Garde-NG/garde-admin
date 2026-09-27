type Tone = "neutral" | "brand" | "success" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-subtle text-muted",
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
};

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
