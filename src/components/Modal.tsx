"use client";

import React, { useEffect, useState, ReactNode } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Unmounting on close would cut the exit transition off at the first frame,
  // so the node stays in the tree until it has finished leaving.
  const [present, setPresent] = useState(isOpen);
  useEffect(() => {
    if (isOpen) {
      setPresent(true);
      return;
    }
    const timer = window.setTimeout(() => setPresent(false), 180);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!present) return null;

  return (
    <div
      className={clsx("overlay", isOpen && "open")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={clsx("modal relative", className)}>
        <button
          type="button"
          onClick={onClose}
          className="close"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
        {title && (
          <div className="modal-head">
            <h2 className="section-title text-xl font-normal">{title}</h2>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
