import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

const ROLE_GRADIENTS: Record<string, string> = {
  admin:    "linear-gradient(135deg,#F43F5E,#F97316)",
  crm:      "linear-gradient(135deg,#06B6D4,#10B981)",
  client:   "linear-gradient(135deg,#7C3AED,#A855F7)",
  designer: "linear-gradient(135deg,#F59E0B,#EAB308)",
  default:  "linear-gradient(135deg,#7C3AED,#06B6D4)",
};

interface AvatarProps {
  name:       string;
  src?:       string | null;
  role?:      string;
  size?:      number;
  className?: string;
  gradient?:  string;
}

export function Avatar({
  name,
  src,
  role,
  size = 32,
  className,
  gradient,
}: AvatarProps) {
  const grad = gradient ?? ROLE_GRADIENTS[role ?? "default"] ?? ROLE_GRADIENTS.default;
  const initials = getInitials(name || "?");
  const fontSize = Math.max(10, Math.round(size * 0.35));

  if (src) {
    return (
      <div
        className={cn("relative flex-shrink-0 rounded-full overflow-hidden", className)}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex-shrink-0 rounded-full flex items-center justify-center",
        "font-bold text-white font-syne select-none",
        className
      )}
      style={{
        width:      size,
        height:     size,
        background: grad,
        fontSize,
      }}
    >
      {initials}
    </div>
  );
}

// Stacked group of avatars
export function AvatarGroup({
  users,
  max = 3,
  size = 28,
}: {
  users: { name: string; avatar_url?: string | null; role?: string }[];
  max?: number;
  size?: number;
}) {
  const visible = users.slice(0, max);
  const rest    = users.length - max;

  return (
    <div className="flex items-center">
      {visible.map((u, i) => (
        <div
          key={i}
          className="rounded-full ring-2 ring-[var(--surface)]"
          style={{ marginLeft: i === 0 ? 0 : -(size * 0.35) }}
        >
          <Avatar name={u.name} src={u.avatar_url} role={u.role} size={size} />
        </div>
      ))}
      {rest > 0 && (
        <div
          className={[
            "rounded-full ring-2 ring-[var(--surface)]",
            "flex items-center justify-center",
            "bg-[var(--border2)] text-[var(--txt2)] font-medium text-[10px]",
          ].join(" ")}
          style={{
            width:       size,
            height:      size,
            marginLeft:  -(size * 0.35),
          }}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}
