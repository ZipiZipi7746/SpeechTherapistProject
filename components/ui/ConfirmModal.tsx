"use client";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Spec: destructive actions use a Modal with explicit confirm — primary on the right, cancel to its left (RTL DOM order). */
export function ConfirmModal({ open, title, message, confirmLabel, cancelLabel = "בטלי", danger, busy, onConfirm, onClose }: Props) {
  return (
    <Modal
      open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={onConfirm} disabled={busy} data-autofocus>{confirmLabel}</button>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>{cancelLabel}</button>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-ink-soft">{message}</p>
    </Modal>
  );
}
