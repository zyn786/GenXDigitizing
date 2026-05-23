interface FeaturePillProps {
  children: React.ReactNode;
  className?: string;
}

export function FeaturePill({ children, className = "" }: FeaturePillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-[10px] font-bold tracking-[0.3px]
        bg-gradient-to-r from-[#16A34A]/10 to-[#2563EB]/10
        text-[#16A34A] border border-[#16A34A]/20 ${className}`}
    >
      {children}
    </span>
  );
}
