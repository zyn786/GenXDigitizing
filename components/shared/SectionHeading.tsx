import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  label?: string;
  title: string;
  gradientTitle?: string;
  description?: string;
  className?: string;
  labelColor?: "blue" | "orange" | "green";
  id?: string;
}

const labelStyles = {
  blue: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
  orange: "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20",
  green: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
};

export function SectionHeading({
  label,
  title,
  gradientTitle,
  description,
  className,
  labelColor = "blue",
  id,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-14 text-center", className)}>
      {label && (
        <span
          className={cn(
            "inline-flex rounded-full px-3.5 py-1 text-xs font-semibold",
            "mb-4 border uppercase tracking-wider",
            labelStyles[labelColor]
          )}
        >
          {label}
        </span>
      )}
      <h2 className="mb-4 font-syne text-3xl font-bold leading-[1.15] text-[var(--txt)] md:text-5xl">
        {title}{" "}
        {gradientTitle && (
          <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
            {gradientTitle}
          </span>
        )}
      </h2>
      {description && (
        <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--txt2)]">
          {description}
        </p>
      )}
    </div>
  );
}
