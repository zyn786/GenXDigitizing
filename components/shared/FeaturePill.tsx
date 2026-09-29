interface FeaturePillProps {
  children: React.ReactNode;
  className?: string;
}

export function FeaturePill({ children, className = "" }: FeaturePillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#16A34A]/20 bg-gradient-to-r from-[#16A34A]/10 to-[#2563EB]/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.3px] text-[#16A34A] ${className}`}
    >
      {children}
    </span>
  );
}
