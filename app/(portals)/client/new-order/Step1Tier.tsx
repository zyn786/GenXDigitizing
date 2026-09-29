// @ts-nocheck
import { CheckCircle, ArrowRight } from "lucide-react";

const txt = "var(--txt)",
  txt2 = "var(--txt2)",
  txt3 = "var(--txt3)";
const GREEN = { bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", text: "#047857" };
const PURPLE = { bg: "#8B5CF6", icon: "#7C3AED" };

const FMTS = [
  "DST",
  "PES",
  "EMB",
  "JEF",
  "XXX",
  "VIP",
  "HUS",
  "EXP",
  "VP3",
  "SEW",
  "AI",
  "SVG",
  "EPS",
  "PDF",
];
const CATS = {
  digitizing: {
    emoji: "🧵",
    label: "Embroidery Digitizing",
    color: "#7C3AED",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    text: "#6D28D9",
  },
  vector: {
    emoji: "✏️",
    label: "Vector Redraw",
    color: "#0891B2",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
    text: "#0E7490",
  },
  sewout: {
    emoji: "🪡",
    label: "Patch Design",
    color: "#059669",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    text: "#047857",
  },
};
const inp = {
  width: "100%",
  background: "var(--elevated)",
  border: "1px solid var(--border2)",
  borderRadius: 10,
  padding: "12px 14px",
  color: txt,
  fontSize: 16,
  outline: "none",
  fontFamily: "Inter,sans-serif",
  boxSizing: "border-box",
};

export function Step1Tier({
  grouped,
  sel,
  serviceName,
  setSel,
  designName,
  setDesignName,
  fmt,
  setFmt,
  extras,
  setExtras,
  qty,
  totalPrice,
  setStep,
}: any) {
  return (
    <div
      className="rounded-2xl p-3.5 sm:p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="mb-4">
        <label
          className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider sm:text-[11px]"
          style={{ color: txt3 }}
        >
          Design name *
        </label>
        <input
          value={designName}
          onChange={(e) => setDesignName(e.target.value)}
          placeholder="e.g. School Logo, Team Jersey…"
          style={inp}
        />
      </div>
      <div className="mb-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <h3 className="mb-1 font-syne text-[15px] font-bold sm:text-sm" style={{ color: txt }}>
          Choose service & tier
        </h3>
        <p className="mb-3 text-[12px] sm:text-[11px]" style={{ color: txt3 }}>
          Select a category and tier to continue
        </p>
        <div className="flex flex-col gap-2.5">
          {Object.entries(grouped).map(([cat, catTiers]: any) => {
            const m = CATS[cat] || {
              emoji: "📋",
              label: cat,
              color: "#7C3AED",
              bg: "rgba(139,92,246,0.08)",
              border: "rgba(139,92,246,0.25)",
              text: "#6D28D9",
            };
            return (
              <div key={cat}>
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  <span className="text-sm">{m.emoji}</span>
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: m.text }}
                  >
                    {m.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {catTiers.map((t: any) => {
                    const s = sel?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSel(t)}
                        className="relative cursor-pointer rounded-lg p-2.5 transition-all active:scale-[0.97] sm:p-3"
                        style={{
                          background: s ? m.bg : "var(--elevated)",
                          border: "1.5px solid " + (s ? m.color : "var(--border2)"),
                          boxShadow: s ? "0 0 0 1px " + m.color + "22" : "",
                        }}
                      >
                        {s && (
                          <div
                            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                            style={{ background: m.color }}
                          >
                            <CheckCircle size={11} className="text-white" />
                          </div>
                        )}
                        <div
                          className="mb-0.5 pr-4 text-[11px] font-semibold leading-tight sm:text-[13px]"
                          style={{ color: s ? m.text : txt }}
                        >
                          {t.label}
                        </div>
                        <div className="mb-1 text-[9px] sm:text-[10px]" style={{ color: txt3 }}>
                          {t.size_desc}
                        </div>
                        <div
                          className="font-syne text-base font-bold sm:text-lg"
                          style={{ color: m.text }}
                        >
                          ${Number(t.price).toFixed(0)}
                        </div>
                        <div
                          className="mt-0.5 flex items-center gap-1 text-[9px] sm:text-[10px]"
                          style={{ color: txt3 }}
                        >
                          <span>{t.est_hours}</span>
                          {t.is_big_design && (
                            <span className="font-medium" style={{ color: "#C2410C" }}>
                              ⚠️~12h
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider sm:text-[11px]"
              style={{ color: txt3 }}
            >
              Primary Format
            </label>
            <select
              value={fmt}
              onChange={(e) => setFmt(e.target.value)}
              style={{ ...inp, cursor: "pointer" }}
            >
              {FMTS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider sm:text-[11px]"
              style={{ color: txt3 }}
            >
              Extra Formats <span style={{ color: GREEN.text }}>FREE</span>
            </label>
            <select
              onChange={(e) => {
                const v = e.target.value;
                if (v && !extras.includes(v)) setExtras((p: any) => [...p, v]);
                e.target.value = "";
              }}
              style={{ ...inp, cursor: "pointer" }}
            >
              <option value="">+ Add format</option>
              {FMTS.filter((f) => f !== fmt && !extras.includes(f)).map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
            {extras.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {extras.map((f: any) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px]"
                    style={{
                      background: GREEN.bgSoft,
                      color: GREEN.text,
                      borderColor: GREEN.border,
                    }}
                  >
                    {f}
                    <span
                      onClick={() => setExtras((p: any) => p.filter((x: any) => x !== f))}
                      className="ml-0.5 cursor-pointer opacity-70"
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {sel && (
        <div
          className="mt-3 flex items-center justify-between rounded-xl p-3"
          style={{ background: GREEN.bgSoft, border: "1px solid " + GREEN.border }}
        >
          <span className="text-[13px] font-semibold" style={{ color: txt }}>
            {serviceName || sel.label}
            {qty > 1 ? " × " + qty : ""}
          </span>
          <span className="font-syne text-xl font-bold" style={{ color: GREEN.text }}>
            ${totalPrice.toFixed(0)}
          </span>
        </div>
      )}
      {(!designName.trim() || !sel) && (
        <p className="mt-3 text-center text-[11px]" style={{ color: "#C2410C" }}>
          {!designName.trim() ? "Enter a design name" : !sel ? "Select a service tier" : ""}
        </p>
      )}
      <button
        disabled={!sel || !designName.trim()}
        onClick={() => setStep(2)}
        className="mt-1.5 w-full cursor-pointer rounded-xl border-none py-3.5 text-[14px] font-semibold text-white transition-all active:scale-[0.98] sm:text-[13px]"
        style={{
          background:
            sel && designName.trim()
              ? "linear-gradient(135deg," + PURPLE.bg + "," + PURPLE.icon + ")"
              : "var(--border2)",
          cursor: sel && designName.trim() ? "pointer" : "not-allowed",
        }}
      >
        Continue {sel && designName.trim() ? "— $" + totalPrice.toFixed(0) : ""}{" "}
        <ArrowRight size={15} className="ml-1 inline" />
      </button>
    </div>
  );
}
