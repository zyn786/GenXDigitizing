"use client";

import { useActionState } from "react";
import { Lock, Mail } from "lucide-react";
import { updateProfileAction, type UpdateProfileState } from "@/app/(client)/actions";

type DefaultValues = {
  name: string;
  phone: string;
  companyName: string;
  whatsapp: string;
  address: string;
};

const initialState: UpdateProfileState = {};

export function ProfileEditForm({
  defaultValues,
  email,
  isGoogle,
}: {
  defaultValues: DefaultValues;
  email: string;
  isGoogle: boolean;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      {state.success && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">
          Profile updated successfully.
        </div>
      )}
      {state.error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <Field
        label="Full name"
        name="name"
        defaultValue={defaultValues.name}
        placeholder="Your full name"
        required
        errors={state.fieldErrors?.name}
      />

      {/* Email — read-only */}
      <div className="grid gap-1.5">
        <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Email address
        </label>
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/40 px-4 py-2.5 text-sm text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          {email}
          <span className="ml-auto text-[10px] text-muted-foreground/60">
            Cannot be changed
          </span>
        </div>
      </div>

      <Field
        label="Phone"
        name="phone"
        type="tel"
        defaultValue={defaultValues.phone}
        placeholder="+1 555 000 0000"
        errors={state.fieldErrors?.phone}
      />

      <Field
        label="Company name"
        name="companyName"
        defaultValue={defaultValues.companyName}
        placeholder="Your business name (optional)"
        errors={state.fieldErrors?.companyName}
      />

      <Field
        label="WhatsApp number"
        name="whatsapp"
        type="tel"
        defaultValue={defaultValues.whatsapp}
        placeholder="+1 555 000 0000 (optional)"
        errors={state.fieldErrors?.whatsapp}
      />

      <Field
        label="Address"
        name="address"
        defaultValue={defaultValues.address}
        placeholder="Street, city, state / province, postal code, country"
        multiline
        errors={state.fieldErrors?.address}
      />

      {!isGoogle && (
        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-secondary/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Password</div>
              <div className="text-xs text-muted-foreground">
                Use the link below to change your password
              </div>
            </div>
          </div>
          <a
            href="/forgot-password"
            className="rounded-full border border-border/80 bg-background px-4 py-2 text-xs font-medium transition hover:bg-secondary/60"
          >
            Change
          </a>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  multiline,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  errors?: string[];
}) {
  const base =
    "w-full rounded-2xl border border-border/60 bg-secondary/40 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30";

  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={name}
        className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
      >
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className={base}
        />
      )}
      {errors?.map((e) => (
        <p key={e} className="text-xs text-red-400">
          {e}
        </p>
      ))}
    </div>
  );
}
