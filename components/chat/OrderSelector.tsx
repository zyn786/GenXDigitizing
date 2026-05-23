"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Check } from "lucide-react";
import { useChat } from "./ChatProvider";
import type { LinkedOrder } from "./types";

interface OrderSelectorProps {
  orders: LinkedOrder[];
}

const STATUS_DOT: Record<string, string> = {
  pending: "bg-[#F59E0B]",
  assigned: "bg-[#22D3EE]",
  in_progress: "bg-[#A855F7]",
  review: "bg-[#FCD34D]",
  revision: "bg-[#FB7185]",
  approved: "bg-[#06B6D4]",
  delivered: "bg-[#34D399]",
};

export function OrderSelector({ orders }: OrderSelectorProps) {
  const { linkOrder, activeConversation } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOrderId = activeConversation?.linkedOrder?.id;
  const hasSelection = !!selectedOrderId;

  if (orders.length === 0) return null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((v) => !v)}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer
          bg-transparent border-none
          ${hasSelection
            ? "text-[#A855F7]"
            : "text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--border)]"
          }`}
        title={hasSelection ? `Order: ${activeConversation?.linkedOrder?.orderNumber}` : "Link an order"}
      >
        <Package size={18} />
        {hasSelection && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#A855F7]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 w-72 z-50
              bg-[var(--surface)] border border-[var(--border2)] rounded-xl shadow-xl
              overflow-hidden max-h-[320px] overflow-y-auto"
          >
            <div className="px-3 py-2 border-b border-[var(--border)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--txt3)]">
                Your Orders
              </p>
            </div>
            {/* Clear selection */}
            {hasSelection && (
              <button
                onClick={() => {
                  if (activeConversation) linkOrder(activeConversation.id, null);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left
                  hover:bg-[var(--border)] transition-colors cursor-pointer
                  border-b border-[var(--border)] bg-transparent border-x-0 border-t-0"
              >
                <span className="text-[12px] text-[var(--txt3)]">✕ No order</span>
              </button>
            )}
            {orders.map((order) => {
              const isSelected = order.id === selectedOrderId;
              return (
                <button
                  key={order.id}
                  onClick={() => {
                    if (activeConversation) {
                      linkOrder(activeConversation.id, order);
                    }
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left
                    transition-colors cursor-pointer border-b border-[var(--border)] last:border-b-0
                    bg-transparent border-x-0 border-t-0
                    ${isSelected ? "bg-[#A855F7]/5" : "hover:bg-[var(--border)]"}`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[order.status] ?? "bg-[var(--txt3)]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-[var(--txt)] truncate">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0
                        bg-[var(--border)] text-[var(--txt3)] capitalize">
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--txt3)] truncate">
                      {order.service}{order.designName ? ` · ${order.designName}` : ""}
                    </p>
                  </div>
                  {isSelected && <Check size={14} className="text-[#A855F7] flex-shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
