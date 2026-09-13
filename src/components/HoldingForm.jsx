import { CalendarClock, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { assetTypes, blankHolding, holdingPayload, holdingToForm, validateHolding } from "../lib/investments";

export default function HoldingForm({ open, holding, initialType, saving, onClose, onSave }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(() => blankHolding(initialType));
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      setForm(holding ? holdingToForm(holding) : blankHolding(initialType));
      setError("");
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [holding, initialType, open]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };
  const marketAsset = ["STOCK", "MUTUAL_FUND", "BOND"].includes(form.assetType);
  const fixedDeposit = form.assetType === "FIXED_DEPOSIT";
  const cashAsset = form.assetType === "CASH";
  const mutualFund = form.assetType === "MUTUAL_FUND";
  const bond = form.assetType === "BOND";

  async function submit(event) {
    event.preventDefault();
    const validation = validateHolding(form);
    if (validation) { setError(validation); return; }
    try {
      await onSave(holdingPayload(form));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function changeType(assetType) {
    setForm(blankHolding(assetType));
    setError("");
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog holding-dialog"
      onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}
      onClick={(event) => { if (event.target === dialogRef.current && !saving) onClose(); }}
    >
      <div className="dialog-card holding-form-card">
        <header className="form-header">
          <div><span className="eyebrow">Values entered by you</span><h2>{holding ? "Edit holding" : "Add a holding"}</h2><p>Record a current snapshot without connecting a broker.</p></div>
          <button className="icon-button" type="button" disabled={saving} onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>
        <form onSubmit={submit} noValidate>
          <fieldset className="asset-type-picker">
            <legend>Asset type</legend>
            <div>{assetTypes.map((type) => <button key={type.value} type="button" style={{ "--asset-color": type.token }} className={form.assetType === type.value ? "is-selected" : ""} aria-pressed={form.assetType === type.value} onClick={() => changeType(type.value)}><i>{type.short}</i><span>{type.label}</span></button>)}</div>
          </fieldset>

          <section className="form-section">
            <header><span>Identity</span><small>What this holding is and where it sits</small></header>
            <div className="form-grid">
              <label className="field field--wide"><span>{nameLabel(form.assetType)}</span><input autoFocus required maxLength="120" placeholder={namePlaceholder(form.assetType)} value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
              {form.assetType === "STOCK" && <label className="field"><span>Ticker</span><input required maxLength="30" placeholder="e.g. RELIANCE" value={form.symbol} onChange={(event) => update("symbol", event.target.value.toLocaleUpperCase())} /></label>}
              <label className="field"><span>Institution <small>optional</small></span><input maxLength="100" placeholder={institutionPlaceholder(form.assetType)} value={form.institution} onChange={(event) => update("institution", event.target.value)} /></label>
              {!fixedDeposit && !cashAsset && <label className="field"><span>Category <small>optional</small></span><input maxLength="60" placeholder="e.g. Large cap" value={form.category} onChange={(event) => update("category", event.target.value)} /></label>}
            </div>
          </section>

          <section className="form-section">
            <header><span>Valuation</span><small>Use values from a source you trust</small></header>
            <div className="form-grid form-grid--numbers">
              {marketAsset && <label className="field"><span>{mutualFund ? "Units" : "Quantity"}</span><input required type="number" min="0.000001" step="0.000001" inputMode="decimal" value={form.quantity} onChange={(event) => update("quantity", event.target.value)} /></label>}
              {!cashAsset && <label className="field"><span>{marketAsset ? (mutualFund ? "Average NAV" : "Average cost") : "Principal"}</span><span className="money-input"><i>₹</i><input required type="number" min="0" step="0.0001" inputMode="decimal" value={form.averageCost} onChange={(event) => update("averageCost", event.target.value)} /></span></label>}
              <label className="field"><span>{marketAsset ? (mutualFund ? "Latest NAV" : "Current price") : cashAsset ? "Current balance" : "Value today"}</span><span className="money-input"><i>₹</i><input required type="number" min="0" step="0.0001" inputMode="decimal" value={form.currentPrice} onChange={(event) => update("currentPrice", event.target.value)} /></span></label>
              <label className="field"><span>Valuation date</span><input required type="date" value={form.valuedOn} onChange={(event) => update("valuedOn", event.target.value)} /></label>
            </div>
          </section>

          {(bond || fixedDeposit || cashAsset || mutualFund) && <section className="form-section">
            <header><span>Income & dates</span><small>Optional unless marked</small></header>
            <div className="form-grid">
              {(bond || fixedDeposit || cashAsset) && <label className="field"><span>{bond ? "Coupon rate" : "Interest rate"} <small>% yearly</small></span><input type="number" min="0" max="100" step="0.0001" inputMode="decimal" value={form.annualRate} onChange={(event) => update("annualRate", event.target.value)} /></label>}
              {bond && <label className="field"><span>Yield to maturity <small>% optional</small></span><input type="number" min="0" max="100" step="0.0001" inputMode="decimal" value={form.secondaryRate} onChange={(event) => update("secondaryRate", event.target.value)} /></label>}
              {mutualFund && <label className="field"><span>Monthly SIP <small>optional</small></span><span className="money-input"><i>₹</i><input type="number" min="0" step="0.01" inputMode="decimal" value={form.recurringAmount} onChange={(event) => update("recurringAmount", event.target.value)} /></span></label>}
              {(bond || fixedDeposit) && <label className="field"><span>Maturity date {bond && <small>optional</small>}</span><input required={fixedDeposit} type="date" value={form.maturityDate} onChange={(event) => update("maturityDate", event.target.value)} /></label>}
              {bond && <label className="field"><span>Next payout <small>optional</small></span><input type="date" value={form.nextPayoutDate} onChange={(event) => update("nextPayoutDate", event.target.value)} /></label>}
            </div>
          </section>}

          <section className="form-section">
            <label className="field"><span>Notes <small>optional</small></span><textarea rows="3" maxLength="500" placeholder="Non-sensitive context only—never credentials or account numbers" value={form.notes} onChange={(event) => update("notes", event.target.value)} /></label>
          </section>

          <div className="form-provenance"><Info size={16} /><span>Mira does not fetch or verify prices. Keep the valuation date accurate.</span></div>
          {error && <div className="form-error" role="alert"><CalendarClock size={16} /><span>{error}</span></div>}
          <footer className="form-actions"><button className="button button--ghost" type="button" disabled={saving} onClick={onClose}>Cancel</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? "Saving…" : holding ? "Save changes" : "Add holding"}</button></footer>
        </form>
      </div>
    </dialog>
  );
}

function nameLabel(type) {
  if (type === "MUTUAL_FUND") return "Scheme name";
  if (type === "FIXED_DEPOSIT") return "Deposit name";
  if (type === "CASH") return "Account name";
  if (type === "BOND") return "Instrument name";
  return "Company name";
}

function namePlaceholder(type) {
  if (type === "MUTUAL_FUND") return "e.g. Nifty 50 Index Fund";
  if (type === "FIXED_DEPOSIT") return "e.g. 18-month fixed deposit";
  if (type === "CASH") return "e.g. Emergency fund";
  if (type === "BOND") return "e.g. Government bond 2033";
  return "e.g. Reliance Industries";
}

function institutionPlaceholder(type) {
  return type === "STOCK" ? "e.g. Your broker" : type === "MUTUAL_FUND" ? "e.g. Fund house" : "e.g. Bank or institution";
}

