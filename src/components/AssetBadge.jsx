import { typeDetails } from "../lib/investments";

export default function AssetBadge({ type, compact = false }) {
  const details = typeDetails(type);
  return (
    <span className={`asset-badge${compact ? " asset-badge--compact" : ""}`} style={{ "--asset-color": details.token }}>
      <i>{details.short}</i>
      {!compact && <span>{details.label}</span>}
    </span>
  );
}

