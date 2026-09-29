"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  ArrowRight,
  Upload,
  Ruler,
  Clock,
  Layers,
  Sparkles,
  ChevronDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

/* ═══════════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════════ */

interface ServiceTier {
  id: string;
  category: string;
  label: string;
  size_desc: string;
  price: number;
  est_hours: string;
  is_big_design: boolean;
  is_active: boolean;
  sort_order: number;
}

interface EstimateResult {
  area: number;
  sizeLabel: string;
  basePrice: number;
  complexityMultiplier: number;
  estimatedPrice: number;
  estimatedStitches: number;
  turnaround: string;
  serviceName: string;
}

type ServiceType = "digitizing" | "vector" | "patches";
type Complexity = "simple" | "medium" | "complex";

const COMPLEXITY_OPTIONS: { value: Complexity; label: string; desc: string; multiplier: number }[] =
  [
    { value: "simple", label: "Simple", desc: "Basic text or simple logo", multiplier: 1 },
    { value: "medium", label: "Medium", desc: "Moderate detail, 2-4 colors", multiplier: 1.5 },
    {
      value: "complex",
      label: "Complex",
      desc: "High detail, gradients, 5+ colors",
      multiplier: 2.2,
    },
  ];

const SERVICE_OPTIONS: { value: ServiceType; label: string; emoji: string }[] = [
  { value: "digitizing", label: "Embroidery Digitizing", emoji: "🧵" },
  { value: "vector", label: "Vector Art Conversion", emoji: "✏️" },
  { value: "patches", label: "Custom Patch Design", emoji: "🏷️" },
];

const DEFAULT_SIZES: Record<ServiceType, { w: number; h: number }> = {
  digitizing: { w: 4, h: 4 },
  vector: { w: 8, h: 8 },
  patches: { w: 3, h: 3 },
};

function getSizeCategory(
  area: number,
  category: string,
  tiers: ServiceTier[]
): { label: string; price: number } {
  const catTiers = tiers
    .filter((t) => t.category === category)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (catTiers.length === 0) return { label: "Custom", price: 0 };

  // Parse size ranges: "4″–8″" → [4,8], "8″–12″" → [8,12], "12″+" → [12, Infinity]
  for (const tier of catTiers) {
    const nums = tier.size_desc.match(/(\d+(?:\.\d+)?)/g);
    if (!nums) continue;
    const low = parseFloat(nums[0]);
    const high = nums[1] ? parseFloat(nums[1]) : Infinity;
    const testDim = Math.sqrt(area); // use square root to compare linear dimension
    if (testDim >= low && testDim <= high) {
      return { label: tier.size_desc, price: tier.price };
    }
  }

  // Fallback to largest tier
  const last = catTiers[catTiers.length - 1];
  return { label: last?.size_desc || "Custom", price: last?.price || 0 };
}

function estimateStitches(area: number, complexity: Complexity): number {
  const baseStitchesPerSqIn = 1200;
  const multiplier = complexity === "simple" ? 1 : complexity === "medium" ? 1.6 : 2.5;
  return Math.round(area * baseStitchesPerSqIn * multiplier);
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon: any;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--txt2)]">
          <Icon size={13} className="text-[var(--txt3)]" />
          {label}
        </span>
        <span className="text-sm font-bold tabular-nums text-[var(--txt)]">
          {value}
          <span className="ml-0.5 text-[10px] text-[var(--txt3)]">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[#2563EB] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2563EB] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(37,99,235,0.4)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-110"
      />
      <div className="flex justify-between text-[10px] text-[var(--txt3)]">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

function SelectPill<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; emoji?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
            value === opt.value
              ? "border-transparent bg-[#2563EB] text-white shadow-[0_2px_12px_rgba(37,99,235,0.3)]"
              : "border-[var(--border2)] bg-[var(--surface)] text-[var(--txt2)] hover:border-[var(--border3)]"
          }`}
        >
          {opt.emoji && <span className="text-sm">{opt.emoji}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ComplexityCard({
  opt,
  selected,
  onClick,
}: {
  opt: (typeof COMPLEXITY_OPTIONS)[0];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-[100px] flex-1 cursor-pointer flex-col items-center rounded-xl border p-3 text-center transition-all duration-200 ${
        selected
          ? "border-[#2563EB]/30 bg-[#2563EB]/10 shadow-[0_0_16px_rgba(37,99,235,0.1)]"
          : "border-[var(--border2)] bg-[var(--surface)] hover:border-[var(--border3)]"
      }`}
    >
      <span className="mb-0.5 text-xs font-bold text-[var(--txt)]">{opt.label}</span>
      <span className="text-[10px] leading-tight text-[var(--txt3)]">{opt.desc}</span>
      <span className="mt-1 text-[10px] font-semibold text-[#2563EB]">{opt.multiplier}×</span>
    </button>
  );
}

function ResultCard({ result }: { result: EstimateResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 text-center sm:p-6"
    >
      <div className="mb-1 flex items-center justify-center gap-1.5">
        <Sparkles size={15} className="text-[#2563EB]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
          Estimated Price
        </span>
      </div>

      <div className="mb-3 font-syne text-4xl font-bold text-[var(--txt)] sm:text-5xl">
        ${result.estimatedPrice}
        <span className="ml-1 text-sm font-normal text-[var(--txt3)]">USD</span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { icon: Ruler, label: "Size", value: `${result.area} in²` },
          {
            icon: Layers,
            label: "Est. Stitches",
            value: `${(result.estimatedStitches / 1000).toFixed(1)}k`,
          },
          { icon: Clock, label: "Turnaround", value: result.turnaround },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5"
            >
              <Icon size={13} className="mx-auto mb-1 text-[var(--txt3)]" />
              <p className="text-[10px] text-[var(--txt3)]">{item.label}</p>
              <p className="text-[11px] font-semibold text-[var(--txt)]">{item.value}</p>
            </div>
          );
        })}
      </div>

      <Link href="/contact">
        <Button
          variant="grad"
          size="lg"
          className="w-full !py-3.5 !text-sm"
          rightIcon={<Upload size={15} />}
        >
          Get Your Exact Quote — Reply in 1 Hour
        </Button>
      </Link>

      <p className="mt-2 text-[10px] text-[var(--txt3)]">
        Free revisions · All formats · Pay when satisfied
      </p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

interface PriceEstimatorProps {
  tiers: ServiceTier[];
}

export function PriceEstimator({ tiers }: PriceEstimatorProps) {
  const [service, setService] = useState<ServiceType>("digitizing");
  const [width, setWidth] = useState(DEFAULT_SIZES.digitizing.w);
  const [height, setHeight] = useState(DEFAULT_SIZES.digitizing.h);
  const [complexity, setComplexity] = useState<Complexity>("simple");
  const [showResult, setShowResult] = useState(false);

  // Reset dimensions when service changes
  const handleServiceChange = useCallback((s: ServiceType) => {
    setService(s);
    setWidth(DEFAULT_SIZES[s].w);
    setHeight(DEFAULT_SIZES[s].h);
    setShowResult(false);
  }, []);

  const result: EstimateResult | null = (() => {
    const area = Math.round(width * height * 10) / 10;
    const { label: sizeLabel, price: basePrice } = getSizeCategory(area, service, tiers);
    const complexityData = COMPLEXITY_OPTIONS.find((c) => c.value === complexity)!;
    const estimatedPrice = Math.max(1, Math.round(basePrice * complexityData.multiplier));
    const estimatedStitches = estimateStitches(area, complexity);
    const serviceData = SERVICE_OPTIONS.find((s) => s.value === service)!;

    let turnaround = "12–24h";
    if (complexity === "complex") turnaround = "18–24h";
    else if (area > 80) turnaround = "18–24h";
    else turnaround = "6–12h";

    return {
      area,
      sizeLabel,
      basePrice,
      complexityMultiplier: complexityData.multiplier,
      estimatedPrice,
      estimatedStitches,
      turnaround,
      serviceName: serviceData.label,
    };
  })();

  return (
    <div className="mx-auto w-full max-w-[960px]">
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
        {/* ── Left: Inputs ──────────────────────────────── */}
        <div className="space-y-5">
          {/* Service Type */}
          <div>
            <label className="mb-2 block flex items-center gap-1.5 text-xs font-semibold text-[var(--txt2)]">
              <Info size={13} className="text-[var(--txt3)]" />
              Service Type
            </label>
            <SelectPill options={SERVICE_OPTIONS} value={service} onChange={handleServiceChange} />
          </div>

          {/* Dimensions */}
          <div className="space-y-4">
            <SliderInput
              label="Width"
              value={width}
              onChange={(v) => {
                setWidth(v);
                setShowResult(false);
              }}
              min={1}
              max={24}
              step={0.5}
              unit={'"'}
              icon={Ruler}
            />
            <SliderInput
              label="Height"
              value={height}
              onChange={(v) => {
                setHeight(v);
                setShowResult(false);
              }}
              min={1}
              max={24}
              step={0.5}
              unit={'"'}
              icon={Ruler}
            />
          </div>

          {/* Complexity */}
          <div>
            <label className="mb-2 block flex items-center gap-1.5 text-xs font-semibold text-[var(--txt2)]">
              <Layers size={13} className="text-[var(--txt3)]" />
              Design Complexity
            </label>
            <div className="flex gap-2">
              {COMPLEXITY_OPTIONS.map((opt) => (
                <ComplexityCard
                  key={opt.value}
                  opt={opt}
                  selected={complexity === opt.value}
                  onClick={() => {
                    setComplexity(opt.value);
                    setShowResult(false);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={() => setShowResult(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#1D4ED8] hover:to-[#1E40AF] hover:shadow-[0_6px_24px_rgba(37,99,235,0.45)]"
          >
            <Calculator size={16} />
            Calculate Price
          </button>
        </div>

        {/* ── Right: Result ─────────────────────────────── */}
        <div className="lg:sticky lg:top-[120px]">
          <AnimatePresence mode="wait">
            {showResult ? (
              <ResultCard result={result} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center"
              >
                <Calculator size={40} className="mb-4 text-[var(--txt3)] opacity-30" />
                <p className="max-w-[200px] text-sm text-[var(--txt3)]">
                  Adjust the options and click <strong>Calculate Price</strong> to see your estimate
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
