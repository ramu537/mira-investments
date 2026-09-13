import { ArrowDownRight, ArrowUpRight, Edit3, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import AssetBadge from "../components/AssetBadge";
import { EmptyState } from "../components/PageState";
import { daysBetween, formatDate } from "../lib/dates";
import { assetTypes, formatMoney, formatPercent, holdingFacts, holdingInvested, holdingValue, portfolioSummary } from "../lib/investments";

const sortOptions = [
  { value: "value-desc", label: "Highest value" },
  { value: "gain-desc", label: "Highest return" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "valuation-asc", label: "Oldest valuation" },
];

export default function HoldingsPage({ holdings, today, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [sort, setSort] = useState("value-desc");
  const visible = useMemo(() => filterAndSort(holdings, search, type, sort), [holdings, search, type, sort]);
  const summary = useMemo(() => portfolioSummary(visible, today), [visible, today]);

  return (
    <div className="page-stack holdings-page">
      <header className="page-heading holdings-heading">
        <div><span className="eyebrow">Investment register</span><h1>Holdings</h1><p>Search, compare, and update the latest values you recorded.</p></div>
        <button className="button button--secondary" type="button" onClick={() => onAdd(type === "ALL" ? "STOCK" : type)}><Plus size={17} />Add holding</button>
      </header>

      <section className="holding-toolbar panel">
        <label className="search-field"><Search size={18} /><span className="sr-only">Search holdings</span><input type="search" value={search} placeholder="Search name, ticker, institution…" onChange={(event) => setSearch(event.target.value)} /></label>
        <div className="type-filters" aria-label="Filter by asset type"><button type="button" className={type === "ALL" ? "is-selected" : ""} aria-pressed={type === "ALL"} onClick={() => setType("ALL")}>All <span>{holdings.length}</span></button>{assetTypes.map((asset) => { const count = holdings.filter((holding) => holding.assetType === asset.value).length; return <button type="button" key={asset.value} className={type === asset.value ? "is-selected" : ""} aria-pressed={type === asset.value} onClick={() => setType(asset.value)}>{asset.short} <span>{count}</span></button>; })}</div>
        <label className="sort-field"><SlidersHorizontal size={17} /><span className="sr-only">Sort holdings</span><select value={sort} onChange={(event) => setSort(event.target.value)}>{sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      </section>

      <section className="result-summary" aria-live="polite"><span><strong>{visible.length}</strong> of {holdings.length} holdings</span><span>Tracked value <strong>{formatMoney(summary.currentValue)}</strong></span><span>Unrealised P&amp;L <strong className={summary.gain < 0 ? "negative" : "positive"}>{summary.gain > 0 ? "+" : ""}{formatMoney(summary.gain)}</strong></span></section>

      {visible.length ? <>
        <section className="holdings-table-wrap panel">
          <table className="holdings-table">
            <thead><tr><th>Holding</th><th>Type / institution</th><th>Invested</th><th>Current value</th><th>Unrealised P&amp;L</th><th>Valued on</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{visible.map((holding) => <HoldingRow key={holding.id} holding={holding} today={today} onEdit={onEdit} onDelete={onDelete} />)}</tbody>
          </table>
        </section>
        <section className="holding-card-list">{visible.map((holding) => <HoldingCard key={holding.id} holding={holding} today={today} onEdit={onEdit} onDelete={onDelete} />)}</section>
      </> : <EmptyState title={holdings.length ? "No matching holdings" : "No holdings yet"} description={holdings.length ? "Try a different search or asset type." : "Add only investments and balances you already own."} actionLabel={holdings.length ? undefined : "Add first holding"} onAction={holdings.length ? undefined : () => onAdd("STOCK")} />}

      <p className="investment-disclaimer">Current snapshots only. Gains are calculated from the cost and latest value you entered.</p>
    </div>
  );
}

function HoldingRow({ holding, today, onEdit, onDelete }) {
  const invested = holdingInvested(holding);
  const value = holdingValue(holding);
  const gain = Number(holding.gainAmount ?? value - invested);
  const gainPercent = Number(holding.gainPercent ?? (invested > 0 ? gain / invested * 100 : 0));
  const age = daysBetween(holding.valuedOn, today);
  const GainIcon = gain < 0 ? ArrowDownRight : ArrowUpRight;
  return <tr><td><button className="holding-identity" type="button" onClick={() => onEdit(holding)}><strong>{holding.symbol || holding.name}</strong>{holding.symbol && <span>{holding.name}</span>}<small>{holdingFacts(holding).join(" · ")}</small></button></td><td><AssetBadge type={holding.assetType} /><small className="institution-name">{holding.institution || "Not specified"}</small></td><td className="numeric-cell">{formatMoney(invested)}</td><td className="numeric-cell"><strong>{formatMoney(value)}</strong></td><td className={`gain-cell ${gain < 0 ? "negative" : "positive"}`}><span><GainIcon size={15} />{gain > 0 ? "+" : ""}{formatMoney(gain)}</span><small>{formatPercent(gainPercent, true)}</small></td><td><time dateTime={holding.valuedOn}>{formatDate(holding.valuedOn, { day: "numeric", month: "short", year: "2-digit" })}</time>{age < -30 && <small className="stale-label">{Math.abs(age)}d old</small>}</td><td><div className="row-actions"><button type="button" onClick={() => onEdit(holding)} aria-label={`Edit ${holding.name}`}><Edit3 size={16} /></button><button type="button" onClick={() => onDelete(holding)} aria-label={`Delete ${holding.name}`}><Trash2 size={16} /></button></div></td></tr>;
}

function HoldingCard({ holding, today, onEdit, onDelete }) {
  const invested = holdingInvested(holding);
  const value = holdingValue(holding);
  const gain = Number(holding.gainAmount ?? value - invested);
  const gainPercent = Number(holding.gainPercent ?? (invested > 0 ? gain / invested * 100 : 0));
  const age = daysBetween(holding.valuedOn, today);
  return <article className="holding-card panel"><header><AssetBadge type={holding.assetType} /><div className="row-actions"><button type="button" onClick={() => onEdit(holding)} aria-label={`Edit ${holding.name}`}><Edit3 size={16} /></button><button type="button" onClick={() => onDelete(holding)} aria-label={`Delete ${holding.name}`}><Trash2 size={16} /></button></div></header><button className="holding-card-main" type="button" onClick={() => onEdit(holding)}><span><strong>{holding.symbol || holding.name}</strong>{holding.symbol && <small>{holding.name}</small>}<em>{holding.institution || "Institution not specified"}</em></span><span><small>Current value</small><strong>{formatMoney(value)}</strong></span></button><div className="holding-card-values"><span><small>Invested</small><strong>{formatMoney(invested)}</strong></span><span><small>Unrealised P&amp;L</small><strong className={gain < 0 ? "negative" : "positive"}>{gain > 0 ? "+" : ""}{formatMoney(gain)} · {formatPercent(gainPercent, true)}</strong></span></div><footer><span>{holdingFacts(holding).join(" · ")}</span><time className={age < -30 ? "is-stale" : ""} dateTime={holding.valuedOn}>{age < -30 ? `${Math.abs(age)}d old` : formatDate(holding.valuedOn, { day: "numeric", month: "short" })}</time></footer></article>;
}

function filterAndSort(holdings, search, type, sort) {
  const query = search.trim().toLocaleLowerCase();
  const filtered = holdings.filter((holding) => {
    if (type !== "ALL" && holding.assetType !== type) return false;
    if (!query) return true;
    return [holding.name, holding.symbol, holding.institution, holding.category, holding.notes].join(" ").toLocaleLowerCase().includes(query);
  });
  return filtered.sort((left, right) => {
    if (sort === "name-asc") return left.name.localeCompare(right.name);
    if (sort === "valuation-asc") return (left.valuedOn || "").localeCompare(right.valuedOn || "");
    if (sort === "gain-desc") return Number(right.gainPercent || 0) - Number(left.gainPercent || 0);
    return holdingValue(right) - holdingValue(left);
  });
}

