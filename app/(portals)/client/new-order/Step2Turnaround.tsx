// @ts-nocheck
import { ArrowRight, ArrowLeft } from "lucide-react";

const txt = "var(--txt)",
  txt2 = "var(--txt2)",
  txt3 = "var(--txt3)";
const GREEN = { bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", text: "#047857" };
const PURPLE = { bg: "#8B5CF6", icon: "#7C3AED" };
const TURNS = [
  { id: "standard", label: "Standard", time: "12–24h", icon: "🕐", desc: "Default for all orders" },
  { id: "rush", label: "Rush", time: "6h", icon: "⚡", desc: "Most designs eligible" },
  { id: "urgent", label: "Urgent", time: "3h", icon: "🔥", desc: "Standard & vector only" },
];
const TURN_COLORS = [
  { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", text: "#047857" },
  { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", text: "#C2410C" },
  { bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", text: "#6D28D9" },
];

export function Step2Turnaround({ turn, setTurn, isBig, setStep }: any) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h3 className="mb-1 font-syne text-sm font-bold" style={{ color: txt }}>
        Choose turnaround speed
      </h3>
      <p className="mb-3 text-[13px]" style={{ color: txt2 }}>
        All speeds are <strong style={{ color: GREEN.text }}>100% free</strong> — no rush surcharges
        ever.
      </p>
      {TURNS.map((t, i) => {
        const c = TURN_COLORS[i];
        const s = turn === t.id;
        return (
          <div
            key={t.id}
            onClick={() => setTurn(t.id)}
            className="mb-2 cursor-pointer rounded-xl p-3.5 transition-all active:scale-[0.98] sm:p-4"
            style={{
              background: s ? c.bg : "var(--elevated)",
              border: "1.5px solid " + (s ? c.text : "var(--border2)"),
              boxShadow: s ? "0 0 0 1px " + c.text + "22" : "",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: s ? c.bg : "var(--elevated)" }}
                >
                  {t.icon}
                </div>
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: s ? c.text : txt }}>
                    {t.label}
                  </div>
                  <div className="mt-0.5 text-[11px]" style={{ color: txt3 }}>
                    {t.desc}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span
                  className="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: GREEN.bgSoft, color: GREEN.text, borderColor: GREEN.border }}
                >
                  FREE
                </span>
                <div className="font-syne text-sm font-bold" style={{ color: c.text }}>
                  {t.time}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {isBig && (
        <div
          className="rounded-xl border p-2.5 text-xs font-medium"
          style={{
            background: "rgba(249,115,22,0.08)",
            color: "#C2410C",
            borderColor: "rgba(249,115,22,0.25)",
          }}
        >
          ⚠️ Big design — actual turnaround ~12 hours.
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setStep(1)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border py-3 text-[14px] font-medium sm:text-[13px]"
          style={{ background: "var(--elevated)", color: txt2, borderColor: "var(--border2)" }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={() => setStep(3)}
          className="flex flex-[2] cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none py-3 text-[14px] font-semibold text-white sm:text-[13px]"
          style={{ background: "linear-gradient(135deg," + PURPLE.bg + "," + PURPLE.icon + ")" }}
        >
          Continue <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
