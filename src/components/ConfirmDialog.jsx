import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function ConfirmDialog({ holding, busy, onCancel, onConfirm }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (holding && !dialog.open) dialog.showModal();
    if (!holding && dialog.open) dialog.close();
  }, [holding]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}
      onClick={(event) => { if (event.target === dialogRef.current && !busy) onCancel(); }}
    >
      <div className="dialog-card confirm-card">
        <button className="icon-button dialog-close" type="button" disabled={busy} onClick={onCancel} aria-label="Close"><X size={19} /></button>
        <span className="confirm-icon"><AlertTriangle size={22} /></span>
        <h2>Delete this holding?</h2>
        <p><strong>{holding?.name || "This holding"}</strong> will be removed from the portfolio. This cannot be recovered.</p>
        <div className="dialog-actions">
          <button className="button button--ghost" type="button" disabled={busy} onClick={onCancel}>Keep it</button>
          <button className="button button--danger" type="button" disabled={busy} onClick={onConfirm}>{busy ? "Deleting…" : "Delete holding"}</button>
        </div>
      </div>
    </dialog>
  );
}

