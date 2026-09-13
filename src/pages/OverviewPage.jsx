import { AlertCircle, ArrowDownRight, ArrowUpRight, CalendarDays, CircleGauge, Clock3, IndianRupee, Landmark, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import AssetBadge from "../components/AssetBadge";
import { EmptyState } from "../components/PageState";
import { formatDate } from "../lib/dates";
import { formatMoney, formatPercent, holdingInvested, holdingValue, portfolioEvents, portfolioSummary, typeDetails } from "../lib/investments";

export default function OverviewPage({ holdings, today, onAdd, onEdit }) {
  const summary = useMemo(() => portfolioSummary(holdings, today), [holdings, today]);
  const events = useMemo(() => portfolioEvents(holdings, today), [holdings, today]);
  const allocated = summary.byType.filter((group) => group.currentValue > 0);
  const visibleEvents = events.filter((event) => event.days >= -30).slice(0, 5);
  const recent = [...holdings].sort((left, right) => (right.valuedOn || "").localeCompare(left.valuedOn || "")).slice(0, 5);
  const GainIcon = summary.gain < 0 ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="page-stack overview-page">
      <header className="page-heading">
        <div><span className="eyebrow">Portfolio overview</span><h1>Your invested money, clearly accounted for.</h1><p>Every amount comes from a value you entered—never an assumed market price.</p></div>
        {summary.latestValuation && <span className="as-of"><Clock3 size={15} />Latest valuation {formatDate(summary.latestValuation, { day: "numeric", month: "short" })}</span>}
      </header>

      <section className="portfolio-hero">
        <div className="portfolio-total">
          <span>Tracked portfolio value</span>
          <strong>{formatMoney(summary.currentValue)}</strong>
          <p>{holdings.length ? `${holdings.length} holding${holdings.length === 1 ? "" : "s"} across ${allocated.length} asset group${allocated.length === 1 ? "" : "s"}` : "Add the investments you already own"}</p>
        </div>
        <div className={`return-block ${summary.gain < 0 ? "is-negative" : "is-positive"}`}>
          <span><GainIcon size={17} />Unrealised P&amp;L</span>
          <strong>{summary.gain > 0 ? "+" : ""}{formatMoney(summary.gain)}</strong>
          <small>{formatPercent(summary.gainPercent, true)} from entered cost</small>
        </div>
        <div className="hero-watermark" aria-hidden="true"><CircleGauge /></div>
      </section>

      <section className="metric-grid" aria-label="Portfolio summary">
        <Metric icon={IndianRupee} label="Invested amount" value={formatMoney(summary.invested, { compact: true })} detail="Quantity × average cost" />
        <Metric icon={Landmark} label="Estimated yearly income" value={formatMoney(summary.annualIncome, { compact: true })} detail="From entered rates only" />
        <Metric icon={RefreshCw} label="Monthly SIP recorded" value={formatMoney(summary.monthlyRecurring, { compact: true })} detail="Mutual fund entries" />
        <Metric icon={Clock3} label="Older valuations" value={summary.stale.length} detail="More than 30 days old" tone={summary.stale.length ? "warning" : "neutral"} />
      </section>

      {!holdings.length ? <EmptyState title="Start with one holding" description="Add a stock, mutual fund, bond, fixed deposit, or cash balance you already own." onAction={() => onAdd("STOCK")} /> : <>
        <section className="overview-grid">
          <article className="panel allocation-card">
            <CardHeader eyebrow="Allocation" title="Where the value sits" meta={`${allocated.length} active groups`} />
            <div className="allocation-content">
              <div className="allocation-bar" role="img" aria-label={allocationLabel(allocated)}>{allocated.map((group) => <i key={group.value} style={{ "--asset-color": group.token, "--share": `${group.share}%` }} />)}</div>
              <div className="allocation-list">{summary.byType.map((group) => <div key={group.value} className={!group.items.length ? "is-empty" : ""}><span><i style={{ "--asset-color": group.token }} />{group.plural}</span><strong>{formatMoney(group.currentValue, { compact: true })}</strong><small>{group.share.toFixed(1)}%</small></div>)}</div>
            </div>
            <details className="data-table"><summary>View allocation data</summary><table><thead><tr><th>Asset group</th><th>Value</th><th>Share</th><th>Holdings</th></tr></thead><tbody>{summary.byType.map((group) => <tr key={group.value}><td>{group.plural}</td><td>{formatMoney(group.currentValue)}</td><td>{group.share.toFixed(1)}%</td><td>{group.items.length}</td></tr>)}</tbody></table></details>
          </article>

          <article className="panel exposure-card">
            <CardHeader eyebrow="Exposure" title="By institution" meta={`${summary.institutions.length} recorded`} />
            <div className="exposure-list">{summary.institutions.slice(0, 6).map((institution, index) => <div key={institution.name}><span><i>{index + 1}</i><b>{institution.name}</b></span><strong>{formatMoney(institution.value, { compact: true })}</strong><em><i style={{ "--share": `${institution.share}%` }} /></em><small>{institution.share.toFixed(1)}%</small></div>)}</div>
            {summary.largestHolding && <div className="concentration-note"><CircleGauge size={17} /><span><strong>{summary.largestHolding.name}</strong> is the largest recorded holding at {summary.largestHoldingShare.toFixed(1)}% of tracked value.</span></div>}
          </article>
        </section>

        <section className="overview-grid overview-grid--lower">
          <article className="panel recent-card">
            <CardHeader eyebrow="Holdings" title="Recently valued" meta="User-entered dates" />
            <div className="compact-holdings">{recent.map((holding) => {
              const gain = Number(holding.gainAmount ?? holdingValue(holding) - holdingInvested(holding));
              return <button type="button" key={holding.id} onClick={() => onEdit(holding)}><AssetBadge type={holding.assetType} compact /><span><strong>{holding.symbol || holding.name}</strong><small>{holding.symbol ? holding.name : typeDetails(holding.assetType).label}</small></span><span className="compact-value"><strong>{formatMoney(holdingValue(holding), { compact: true })}</strong><small className={gain < 0 ? "negative" : "positive"}>{gain > 0 ? "+" : ""}{formatMoney(gain, { compact: true })}</small></span><time dateTime={holding.valuedOn}>{formatDate(holding.valuedOn, { day: "numeric", month: "short" })}</time></button>;
            })}</div>
          </article>

          <article className="panel events-card">
            <CardHeader eyebrow="Schedule" title="Maturities & payouts" meta={visibleEvents.length ? "Next recorded dates" : "Nothing scheduled"} />
            {visibleEvents.length ? <div className="event-list">{visibleEvents.map((event) => <button type="button" key={event.id} onClick={() => onEdit(event.holding)}><time dateTime={event.date}><strong>{formatDate(event.date, { day: "2-digit" })}</strong><span>{formatDate(event.date, { month: "short" })}</span></time><span><strong>{event.holding.name}</strong><small>{event.kind} · {event.days < 0 ? `${Math.abs(event.days)}d overdue` : event.days === 0 ? "Today" : `in ${event.days}d`}</small></span><CalendarDays size={18} /></button>)}</div> : <div className="small-empty"><CalendarDays size={21} /><span>No maturity or payout dates are recorded.</span></div>}
          </article>
        </section>

        {summary.stale.length > 0 && <section className="stale-banner"><AlertCircle size={19} /><div><strong>{summary.stale.length} valuation{summary.stale.length === 1 ? " is" : "s are"} more than 30 days old</strong><span>Review dates before relying on the portfolio total.</span></div><button type="button" onClick={() => onEdit(summary.stale[0])}>Review oldest</button></section>}
      </>}

      <p className="investment-disclaimer">Portfolio tracking only. Mira does not provide investment advice, verify prices, or predict returns.</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, tone = "neutral" }) {
  return <article className={`metric metric--${tone}`}><span className="metric-icon"><Icon size={18} /></span><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function CardHeader({ eyebrow, title, meta }) {
  return <header className="card-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><span>{meta}</span></header>;
}

function allocationLabel(groups) {
  if (!groups.length) return "No allocation data.";
  return groups.map((group) => `${group.plural} ${group.share.toFixed(1)} percent`).join(", ");
}
