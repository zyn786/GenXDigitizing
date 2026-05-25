"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, Eye, Clock, CheckCircle2, AlertCircle,
  Loader2, FileImage, Search, Ruler,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═════════════════════════════════════════════════════════════ */
type ProjectStatus = "digitizing" | "qc" | "ready";

interface Project {
  id: string;
  name: string;
  thumbnail: string;
  status: ProjectStatus;
  stitches: number;
  formats: string[];
  submittedAt: string;
  eta: string;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  digitizing: {
    label: "Digitizing",
    icon: Loader2,
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  qc: {
    label: "In Quality Control",
    icon: AlertCircle,
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
  ready: {
    label: "Ready for Download",
    icon: CheckCircle2,
    color: "#10B981",
    bg: "#ECFDF5",
  },
};

const MOCK_PROJECTS: Project[] = [
  {
    id: "GX-2847",
    name: "Summer Caps Collection — Left Chest Logo",
    thumbnail: "https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/After-5_hod7v0.webp",
    status: "ready",
    stitches: 6400,
    formats: [".DST", ".PES", ".EMB", ".JEF"],
    submittedAt: "2026-05-23",
    eta: "2026-05-24",
  },
  {
    id: "GX-2846",
    name: "Corporate Polos — Full Back Design",
    thumbnail: "https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/Before-5_upqe91.webp",
    status: "qc",
    stitches: 18400,
    formats: [".DST", ".PES", ".EXP"],
    submittedAt: "2026-05-23",
    eta: "2026-05-24",
  },
  {
    id: "GX-2845",
    name: "Canvas Jacket — 3D Puff Logo",
    thumbnail: "https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/After-5_hod7v0.webp",
    status: "digitizing",
    stitches: 8200,
    formats: [".DST", ".PES", ".EMB", ".JEF", ".EXP"],
    submittedAt: "2026-05-24",
    eta: "2026-05-25",
  },
  {
    id: "GX-2844",
    name: "Work Shirts — Name Tags Batch",
    thumbnail: "https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/Before-5_upqe91.webp",
    status: "ready",
    stitches: 2800,
    formats: [".DST", ".PES"],
    submittedAt: "2026-05-22",
    eta: "2026-05-23",
  },
  {
    id: "GX-2843",
    name: "Hoodie Patch Set — 4 Designs",
    thumbnail: "https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/After-5_hod7v0.webp",
    status: "digitizing",
    stitches: 12400,
    formats: [".DST", ".PES", ".EMB"],
    submittedAt: "2026-05-24",
    eta: "2026-05-25",
  },
];

/* ═════════════════════════════════════════════════════════════
   STATUS BADGE
   ═════════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20` }}
    >
      <Icon size={12} className={status === "digitizing" ? "animate-spin" : ""} />
      {cfg.label}
    </span>
  );
}

/* ═════════════════════════════════════════════════════════════
   PROJECT TABLE ROW
   ═════════════════════════════════════════════════════════════ */
function ProjectRow({ project }: { project: Project }) {
  const [imgError, setImgError] = useState(false);

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--elevated)]/50 transition-colors group">
      {/* Project ID */}
      <td className="px-4 sm:px-6 py-4">
        <span className="text-xs font-mono font-bold text-[#2563EB]">{project.id}</span>
      </td>

      {/* Thumbnail + Name */}
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--elevated)] border border-[var(--border)] overflow-hidden flex-shrink-0">
            {!imgError ? (
              <img
                src={project.thumbnail}
                alt={project.name}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileImage size={16} className="text-[var(--txt3)]" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--txt)] truncate max-w-[200px] sm:max-w-[300px]">
              {project.name}
            </p>
            <p className="text-[11px] text-[var(--txt3)]">{project.submittedAt}</p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 sm:px-6 py-4">
        <StatusBadge status={project.status} />
      </td>

      {/* Stitch Count */}
      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
        <div className="flex items-center gap-1.5 text-sm font-mono font-semibold text-[var(--txt)]">
          <Ruler size={13} className="text-[var(--txt3)]" />
          {project.stitches.toLocaleString()}
        </div>
      </td>

      {/* Formats */}
      <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {project.formats.map((f) => (
            <span
              key={f}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--elevated)] text-[var(--txt2)]
                border border-[var(--border)] font-medium"
            >
              {f}
            </span>
          ))}
        </div>
      </td>

      {/* ETA */}
      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
        <div className="flex items-center gap-1.5 text-sm text-[var(--txt2)]">
          <Clock size={13} className="text-[var(--txt3)]" />
          {project.eta}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--elevated)] transition-all"
            title="Preview"
          >
            <Eye size={15} />
          </button>
          {project.status === "ready" && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold
                bg-[#10B981] text-white hover:bg-[#059669]
                shadow-[0_2px_8px_rgba(16,185,129,0.2)]
                active:scale-[0.97] transition-all"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ═════════════════════════════════════════════════════════════
   MOBILE PROJECT CARD
   ═════════════════════════════════════════════════════════════ */
function ProjectCard({ project }: { project: Project }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-bold text-[#2563EB]">{project.id}</span>
        <StatusBadge status={project.status} />
      </div>

      {/* Thumbnail + Name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-[var(--elevated)] border border-[var(--border)] overflow-hidden flex-shrink-0">
          {!imgError ? (
            <img
              src={project.thumbnail}
              alt={project.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileImage size={18} className="text-[var(--txt3)]" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--txt)] leading-snug">{project.name}</p>
          <p className="text-[11px] text-[var(--txt3)]">{project.submittedAt}</p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-3 text-xs text-[var(--txt2)]">
        <span className="flex items-center gap-1">
          <Ruler size={12} className="text-[var(--txt3)]" />
          {project.stitches.toLocaleString()} st
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} className="text-[var(--txt3)]" />
          {project.eta}
        </span>
      </div>

      {/* Format chips */}
      <div className="flex flex-wrap gap-1 mb-3">
        {project.formats.map((f) => (
          <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--elevated)] text-[var(--txt2)] border border-[var(--border)]">
            {f}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--txt2)] hover:bg-[var(--elevated)] active:scale-[0.98] transition-all">
          <Eye size={13} />
          Preview
        </button>
        {project.status === "ready" && (
          <button className="flex-[1.5] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-[#10B981] text-white hover:bg-[#059669] active:scale-[0.98] transition-all shadow-[0_2px_8px_rgba(16,185,129,0.2)]">
            <Download size={13} />
            Download Files
          </button>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════════ */
export function CustomerPipeline() {
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_PROJECTS.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: MOCK_PROJECTS.length,
    digitizing: MOCK_PROJECTS.filter((p) => p.status === "digitizing").length,
    qc: MOCK_PROJECTS.filter((p) => p.status === "qc").length,
    ready: MOCK_PROJECTS.filter((p) => p.status === "ready").length,
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-5">
        {/* Filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {([
            ["all", "All Projects"],
            ["digitizing", "Digitizing"],
            ["qc", "Quality Control"],
            ["ready", "Ready"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filter === key
                  ? "bg-[#2563EB] text-white"
                  : "bg-[var(--elevated)] text-[var(--txt2)] hover:text-[var(--txt)]"
              }`}
            >
              {label}
              <span className={`ml-1.5 text-[10px] ${filter === key ? "text-white/70" : "text-[var(--txt3)]"}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--txt3)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full sm:w-56 pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--txt)] placeholder:text-[var(--txt3)] focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/10 outline-none transition-all"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--elevated)]/50">
              {["Project ID", "Design", "Status", "Stitches", "Formats", "ETA", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 sm:px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[var(--txt3)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <motion.tr
                  key={project.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="contents"
                >
                  <ProjectRow project={project} />
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <FileImage size={32} className="text-[var(--txt3)] mx-auto mb-3 opacity-40" />
            <p className="text-sm text-[var(--txt3)]">No projects match your filter</p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <FileImage size={32} className="text-[var(--txt3)] mx-auto mb-3 opacity-40" />
            <p className="text-sm text-[var(--txt3)]">No projects match your filter</p>
          </div>
        )}
      </div>

      {/* Summary footer */}
      <div className="mt-5 flex items-center justify-between text-xs text-[var(--txt3)]">
        <span>
          Showing <strong className="text-[var(--txt)]">{filtered.length}</strong> of{" "}
          <strong className="text-[var(--txt)]">{MOCK_PROJECTS.length}</strong> projects
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" /> {counts.digitizing} active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> {counts.qc} in QC
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" /> {counts.ready} ready
          </span>
        </div>
      </div>
    </div>
  );
}
