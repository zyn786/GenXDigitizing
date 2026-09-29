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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
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
        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-transparent transition-all ${
          hasSelection
            ? "text-[#A855F7]"
            : "text-[var(--txt3)] hover:bg-[var(--border)] hover:text-[var(--txt)]"
        }`}
        title={
          hasSelection ? `Order: ${activeConversation?.linkedOrder?.orderNumber}` : "Link an order"
        }
      >
        <Package size={18} />
        {hasSelection && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#A855F7]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full left-0 z-50 mb-2 max-h-[320px] w-72 overflow-hidden overflow-y-auto rounded-xl border border-[var(--border2)] bg-[var(--surface)] shadow-xl"
          >
            <div className="border-b border-[var(--border)] px-3 py-2">
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
                className="flex w-full cursor-pointer items-center gap-2 border-x-0 border-b border-t-0 border-[var(--border)] bg-transparent px-3 py-2.5 text-left transition-colors hover:bg-[var(--border)]"
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
                  className={`flex w-full cursor-pointer items-center gap-3 border-x-0 border-b border-t-0 border-[var(--border)] bg-transparent px-3 py-2.5 text-left transition-colors last:border-b-0 ${isSelected ? "bg-[#A855F7]/5" : "hover:bg-[var(--border)]"}`}
                >
                  <div
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[order.status] ?? "bg-[var(--txt3)]"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12px] font-semibold text-[var(--txt)]">
                        {order.orderNumber}
                      </span>
                      <span className="flex-shrink-0 rounded-full bg-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium capitalize text-[var(--txt3)]">
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-[var(--txt3)]">
                      {order.service}
                      {order.designName ? ` · ${order.designName}` : ""}
                    </p>
                  </div>
                  {isSelected && <Check size={14} className="flex-shrink-0 text-[#A855F7]" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
