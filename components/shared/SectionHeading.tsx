import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  label?: string;
  title: string;
  gradientTitle?: string;
  description?: string;
  className?: string;
  labelColor?: "blue" | "orange" | "green";
}

const labelStyles = {
  blue:   "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
  orange: "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20",
  green:  "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
};

export function SectionHeading({
  label,
  title,
  gradientTitle,
  description,
  className,
  labelColor = "blue",
}: SectionHeadingProps) {
  return (
    <div className={cn("text-center mb-14", className)}>
      {label && (
        <span
          className={cn(
            "inline-flex px-3.5 py-1 rounded-full text-xs font-semibold",
            "uppercase tracking-wider border mb-4",
            labelStyles[labelColor]
          )}
        >
          {label}
        </span>
      )}
      <h2 className="font-syne font-extrabold text-3xl md:text-5xl text-[var(--txt)] mb-4 leading-[1.15]">
        {title}{" "}
        {gradientTitle && (
          <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
            {gradientTitle}
          </span>
        )}
      </h2>
      {description && (
        <p className="text-[var(--txt2)] text-base max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
