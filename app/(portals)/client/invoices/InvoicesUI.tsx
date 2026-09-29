// @ts-nocheck
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Download,
  ExternalLink,
  CreditCard,
  CheckCircle,
  X,
  Clock,
  DollarSign,
  Receipt,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

const txt = "var(--txt)",
  txt2 = "var(--txt2)",
  txt3 = "var(--txt3)";

function getStatusStyle(status) {
  if (status === "paid")
    return { bg: "rgba(16,185,129,0.08)", color: "#047857", border: "rgba(16,185,129,0.25)" };
  if (status === "pending")
    return { bg: "rgba(249,115,22,0.08)", color: "#C2410C", border: "rgba(249,115,22,0.25)" };
  if (status === "failed")
    return { bg: "rgba(244,63,94,0.12)", color: "#FB7185", border: "rgba(244,63,94,0.25)" };
  return { bg: "rgba(148,163,184,0.12)", color: "var(--txt2)", border: "rgba(148,163,184,0.25)" };
}

export function ClientInvoicesUI({ invoices, paymentStatus, demoInvoiceId }) {
  const router = useRouter();
  const [, startTx] = useTransition();
  const [loading, setLoading] = useState(null);
  const [banner, setBanner] = useState(paymentStatus);

  useEffect(
    function () {
      if (paymentStatus === "success") toast.success("Payment received!", { duration: 6000 });
      else if (paymentStatus === "cancelled") toast.error("Payment cancelled. Link still active.");
      if (paymentStatus) {
        var url = new URL(window.location.href);
        url.searchParams.delete("payment");
        url.searchParams.delete("invoice");
        url.searchParams.delete("checkout");
        url.searchParams.delete("amount");
        window.history.replaceState({}, "", url.toString());
      }
    },
    [paymentStatus]
  );

  async function getCheckoutLink(invoiceId: string) {
    setLoading(invoiceId);
    try {
      // Client-facing: only works if admin already set a checkout_url on the invoice.
      // The admin-only POST endpoint is not available to clients.
      const inv = invoices.find((i: any) => i.id === invoiceId);
      if (inv?.payoneer_checkout_url) {
        window.open(inv.payoneer_checkout_url, "_blank");
      } else {
        toast.error("Payment link not ready yet. Admin will provide it shortly.");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(null);
    }
  }

  function downloadPDF(invoiceId) {
    const a = document.createElement("a");
    a.href = "/api/invoices/" + invoiceId + "/pdf";
    a.download = "invoice-" + invoiceId + ".pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  var totalPaid = invoices
    .filter(function (i) {
      return i.status === "paid";
    })
    .reduce(function (s, i) {
      return s + Number(i.amount);
    }, 0);
  var totalPending = invoices
    .filter(function (i) {
      return i.status === "pending";
    })
    .reduce(function (s, i) {
      return s + Number(i.amount);
    }, 0);

  var green = {
    bgSoft: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    icon: "#059669",
    text: "#047857",
  };
  var orange = {
    bgSoft: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
    icon: "#EA580C",
    text: "#C2410C",
  };
  var purple = {
    bgSoft: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    icon: "#7C3AED",
    text: "#6D28D9",
  };
  var cyan = {
    bgSoft: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
    icon: "#0891B2",
    text: "#0E7490",
  };

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      <div className="mb-4 sm:mb-5">
        <h2
          className="font-syne text-xl font-bold sm:text-2xl"
          style={{
            background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Invoices
        </h2>
        <p className="mt-1 text-[12px] sm:text-xs" style={{ color: txt3 }}>
          {invoices.length} invoices · {formatCurrency(totalPaid, "USD", true)} paid ·{" "}
          {formatCurrency(totalPending, "USD", true)} pending
        </p>
      </div>

      {banner === "success" && (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border p-3 sm:p-4"
          style={{ background: green.bgSoft, borderColor: green.border }}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle size={18} style={{ color: green.icon }} />
            <div>
              <div className="text-[13px] font-semibold" style={{ color: green.text }}>
                Payment confirmed!
              </div>
              <div className="mt-0.5 text-[11px]" style={{ color: txt2 }}>
                Your order is active — team notified.
              </div>
            </div>
          </div>
          <button
            onClick={function () {
              setBanner(null);
            }}
            className="cursor-pointer border-none bg-transparent"
            style={{ color: txt3 }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {banner === "cancelled" && (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border p-3 sm:p-4"
          style={{ background: orange.bgSoft, borderColor: orange.border }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⚠️</span>
            <span className="text-[13px] font-medium" style={{ color: orange.text }}>
              Payment not completed. Link still valid.
            </span>
          </div>
          <button
            onClick={function () {
              setBanner(null);
            }}
            className="cursor-pointer border-none bg-transparent"
            style={{ color: txt3 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="scrollbar-none mb-5 flex flex-nowrap gap-2 overflow-x-auto sm:grid sm:grid-cols-3 sm:gap-3">
        {[
          {
            label: "Total Paid",
            val: formatCurrency(totalPaid),
            icon: <DollarSign size={16} />,
            c: green,
          },
          {
            label: "Pending",
            val: formatCurrency(totalPending),
            icon: <Clock size={16} />,
            c: orange,
          },
          { label: "Invoices", val: invoices.length, icon: <Receipt size={16} />, c: purple },
        ].map(function (s) {
          return (
            <div
              key={s.label}
              className="flex-1 rounded-2xl p-3 transition-all duration-200 hover:translate-y-[-2px] sm:flex-shrink sm:p-3.5"
              style={{ background: s.c.bgSoft, border: "1px solid " + s.c.border }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: s.c.bgSoft, color: s.c.icon }}
                >
                  {s.icon}
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-wider sm:text-[10px]"
                  style={{ color: txt2 }}
                >
                  {s.label}
                </div>
              </div>
              <div className="font-syne text-lg font-bold sm:text-xl" style={{ color: s.c.text }}>
                {s.val}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mb-4 flex flex-wrap gap-3 rounded-xl border p-3 text-[11px] font-semibold sm:text-xs"
        style={{ background: green.bgSoft, color: green.text, borderColor: green.border }}
      >
        <span>♾️ Unlimited revisions — FREE</span>
        <span>·</span>
        <span>🔄 All format conversions — FREE</span>
        <span>·</span>
        <span>⚡ Rush & urgent turnaround — FREE</span>
      </div>

      {invoices.length === 0 ? (
        <div
          className="rounded-2xl border py-16 text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: purple.bgSoft }}
          >
            <Receipt size={22} style={{ color: purple.icon }} />
          </div>
          <p className="mb-1 font-syne text-base font-bold" style={{ color: txt }}>
            No invoices yet
          </p>
          <p className="text-sm" style={{ color: txt3 }}>
            Invoices are created when you place an order
          </p>
        </div>
      ) : (
        <div>
          <div className="flex flex-col gap-2 sm:hidden">
            {invoices.map(function (inv) {
              var s = getStatusStyle(inv.status);
              return (
                <div
                  key={inv.id}
                  className="rounded-xl border p-3.5"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold" style={{ color: cyan.text }}>
                      {inv.invoice_number}
                    </span>
                    <span
                      className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: s.bg, color: s.color, borderColor: s.border }}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="mb-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                    <span className="font-medium" style={{ color: txt }}>
                      {inv.orders?.service_tiers?.label ||
                        (() => {
                          const n = inv.notes || "";
                          if (n.toLowerCase().includes("subscription"))
                            return n.split("—")[0]?.replace("Subscription:", "").trim() || "Plan";
                          if (n.toLowerCase().includes("extra credits")) {
                            const m = n.match(/Extra credits:\s*(\d+)\s*design/i);
                            return m ? `+${m[1]} Credits` : "Credits";
                          }
                          return "—";
                        })()}
                    </span>
                    <span className="text-right font-syne font-bold" style={{ color: green.text }}>
                      {formatCurrency(inv.amount)}
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: purple.text }}>
                      {inv.orders?.order_number ||
                        ((inv.notes || "").toLowerCase().includes("subscription")
                          ? "Subscription"
                          : (inv.notes || "").toLowerCase().includes("extra credits")
                            ? "Credits"
                            : "—")}
                    </span>
                    <span className="text-right" style={{ color: txt3 }}>
                      {formatDate(inv.created_at)}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                    {inv.status === "pending" &&
                      (inv.payoneer_checkout_url ? (
                        <a
                          href={inv.payoneer_checkout_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1"
                        >
                          <button
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none px-3 py-2 text-[12px] font-semibold text-white"
                            style={{
                              background:
                                "linear-gradient(135deg," + purple.icon + "," + "#DB2777)",
                            }}
                          >
                            <ExternalLink size={12} /> Pay Now
                          </button>
                        </a>
                      ) : (
                        <button
                          onClick={function () {
                            getCheckoutLink(inv.id);
                          }}
                          disabled={loading === inv.id}
                          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none px-3 py-2 text-[12px] font-semibold text-white"
                          style={{
                            background: "linear-gradient(135deg," + purple.icon + "," + "#DB2777)",
                          }}
                        >
                          <CreditCard size={12} />{" "}
                          {loading === inv.id ? "Loading…" : "Pay via Payoneer"}
                        </button>
                      ))}
                    <button
                      onClick={function () {
                        downloadPDF(inv.id);
                      }}
                      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-medium"
                      style={{
                        background: "var(--elevated)",
                        color: txt2,
                        borderColor: "var(--border2)",
                      }}
                    >
                      <Download size={12} /> PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="hidden overflow-hidden rounded-2xl sm:block"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "var(--elevated)" }}>
                  {["Invoice", "Order", "Service", "Amount", "Status", "Date", "Actions"].map(
                    function (h) {
                      return (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: txt3, borderBottom: "1px solid var(--border)" }}
                        >
                          {h}
                        </th>
                      );
                    }
                  )}
                </tr>
              </thead>
              <tbody>
                {invoices.map(function (inv) {
                  var s = getStatusStyle(inv.status);
                  var isLoading = loading === inv.id;
                  return (
                    <tr
                      key={inv.id}
                      className="transition-colors"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                      onMouseEnter={function (e) {
                        e.currentTarget.style.background = "var(--elevated)";
                      }}
                      onMouseLeave={function (e) {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td className="p-3 font-mono text-xs font-bold" style={{ color: cyan.text }}>
                        {inv.invoice_number}
                      </td>
                      <td
                        className="p-3 font-mono text-[11px] font-bold"
                        style={{ color: purple.text }}
                      >
                        {inv.orders?.order_number ||
                          ((inv.notes || "").toLowerCase().includes("subscription")
                            ? "Subscription"
                            : (inv.notes || "").toLowerCase().includes("extra credits")
                              ? "Credits"
                              : "—")}
                      </td>
                      <td className="p-3 text-xs" style={{ color: txt2 }}>
                        {inv.orders?.service_tiers?.label ||
                          (() => {
                            const n = inv.notes || "";
                            if (n.toLowerCase().includes("subscription"))
                              return n.split("—")[0]?.replace("Subscription:", "").trim() || "Plan";
                            if (n.toLowerCase().includes("extra credits")) {
                              const m = n.match(/Extra credits:\s*(\d+)\s*design/i);
                              return m ? `+${m[1]} Credits` : "Credits";
                            }
                            return "—";
                          })()}
                      </td>
                      <td className="p-3 font-syne text-sm font-bold" style={{ color: green.text }}>
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="p-3">
                        <span
                          className="rounded-full border px-2.5 py-1 text-[10px] font-semibold"
                          style={{ background: s.bg, color: s.color, borderColor: s.border }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-[11px]" style={{ color: txt3 }}>
                        {formatDate(inv.created_at)}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1.5">
                          {inv.status === "pending" &&
                            (inv.payoneer_checkout_url ? (
                              <a href={inv.payoneer_checkout_url} target="_blank" rel="noreferrer">
                                <button
                                  className="inline-flex cursor-pointer items-center gap-1 rounded-xl border-none px-2.5 py-1.5 text-[11px] font-semibold text-white"
                                  style={{
                                    background:
                                      "linear-gradient(135deg," + purple.icon + "," + "#DB2777)",
                                  }}
                                >
                                  <ExternalLink size={11} /> Pay Now
                                </button>
                              </a>
                            ) : (
                              <button
                                onClick={function () {
                                  getCheckoutLink(inv.id);
                                }}
                                disabled={isLoading}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border-none px-2.5 py-1.5 text-[11px] font-semibold text-white"
                                style={{
                                  background:
                                    "linear-gradient(135deg," + purple.icon + "," + "#DB2777)",
                                }}
                              >
                                <CreditCard size={11} /> {isLoading ? "Loading…" : "Pay"}
                              </button>
                            ))}
                          <button
                            onClick={function () {
                              downloadPDF(inv.id);
                            }}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium"
                            style={{
                              background: "var(--elevated)",
                              color: txt2,
                              borderColor: "var(--border2)",
                            }}
                          >
                            <Download size={11} /> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
