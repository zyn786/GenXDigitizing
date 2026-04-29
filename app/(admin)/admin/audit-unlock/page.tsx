export default function AuditUnlockPage() {
  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Super admin only
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Unlock billing audit visibility.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Audit logs are not visible to normal admins. SUPER_ADMIN access requires
          an authenticator code.
        </p>
      </section>

      <form className="max-w-xl rounded-[1.75rem] border border-border/80 bg-card/70 p-6">
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">Authenticator code</span>
          <input
            className="h-12 rounded-2xl border border-border/80 bg-background px-4"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
          />
        </label>

        <button
          type="submit"
          className="mt-4 rounded-full bg-primary px-5 py-3 text-primary-foreground"
        >
          Unlock audit access
        </button>
      </form>
    </div>
  );
}
