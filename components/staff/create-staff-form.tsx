"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  { value: "DESIGNER", label: "Designer" },
  { value: "CHAT_SUPPORT", label: "Chat Support" },
  { value: "MARKETING", label: "Marketing" },
  { value: "MANAGER", label: "Admin / Manager" },
];

const DEPARTMENTS = [
  "Digitizing",
  "Quality Control",
  "Client Support",
  "Marketing",
  "Operations",
  "Management",
];

export function CreateStaffForm({ currentRole }: { currentRole: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableRoles =
    currentRole === "SUPER_ADMIN"
      ? ROLES
      : ROLES.filter((r) => r.value !== "MANAGER");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      emailPrefix: fd.get("emailPrefix") as string,
      role: fd.get("role") as string,
      department: (fd.get("department") as string) || undefined,
      password: fd.get("password") as string,
    };

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { ok: boolean; message?: string; user?: { email: string } };
      if (!json.ok) {
        setError(json.message ?? "Something went wrong.");
      } else {
        setSuccess(`Account created: ${json.user?.email}`);
        (e.target as HTMLFormElement).reset();
        setTimeout(() => router.push("/admin/staff" as never), 1500);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-[1.75rem] border border-border/80 bg-card/70 p-6"
    >
      <Field label="Full name" name="name" placeholder="Jane Smith" required />

      {/* Email prefix */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">
          Email address <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center overflow-hidden rounded-2xl border border-border/80 bg-background focus-within:ring-2 focus-within:ring-primary/40">
          <input
            name="emailPrefix"
            required
            pattern="[a-zA-Z0-9._-]+"
            title="Only letters, numbers, dots, hyphens, and underscores"
            placeholder="jane.smith"
            className="h-12 flex-1 bg-transparent px-4 text-sm outline-none"
          />
          <span className="select-none border-l border-border/80 bg-secondary/60 px-3 text-xs text-muted-foreground">
            @genxdigitizing.com
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          For designers, use the designer&apos;s name (e.g. <code>john@genxdigitizing.com</code>).
        </p>
      </div>

      {/* Role */}
      <div className="grid gap-2">
        <label htmlFor="role" className="text-sm font-medium">
          Role <span className="text-red-400">*</span>
        </label>
        <select
          id="role"
          name="role"
          required
          className="h-12 rounded-2xl border border-border/80 bg-background px-4 text-sm"
        >
          <option value="">Select a role…</option>
          {availableRoles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Department */}
      <div className="grid gap-2">
        <label htmlFor="department" className="text-sm font-medium">
          Department <span className="text-muted-foreground">(optional)</span>
        </label>
        <select
          id="department"
          name="department"
          className="h-12 rounded-2xl border border-border/80 bg-background px-4 text-sm text-muted-foreground"
        >
          <option value="">Select department…</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <Field
        label="Temporary password"
        name="password"
        type="password"
        placeholder="Min. 8 characters"
        required
        hint="The staff member should change this on first login."
      />

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-full bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create staff account"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="h-12 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
