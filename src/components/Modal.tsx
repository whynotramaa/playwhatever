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

/**
 * Ask before something that cannot be taken back. The platform's own
 * `window.confirm` is a system alert with a system font and system buttons on
 * top of a page that has spent a lot of effort not looking like that, and on
 * a phone it is the one piece of the product a host cannot recognise.
 *
 * The destructive answer is the primary button because it is the thing the
 * person came here to do; backing out is the quiet one next to it.
 */
export function ConfirmDialog({
  isOpen,
  title,
  body,
  confirmLabel,
  cancelLabel = "Never mind",
  isPending,
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="body text-[var(--color-text-secondary)]">{body}</p>
      <div className="confirm-actions">
        <button type="button" className="btn btn-primary" disabled={isPending} onClick={onConfirm}>
          <span className="btn-label">{confirmLabel}</span>
        </button>
        <button type="button" className="btn btn-outline" disabled={isPending} onClick={onClose}>
          <span className="btn-label">{cancelLabel}</span>
        </button>
      </div>
    </Modal>
  );
}
