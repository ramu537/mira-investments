import { AlertCircle, Inbox, LoaderCircle, Plus, RefreshCw } from "lucide-react";

export function LoadingState() {
  return (
    <div className="page-state" role="status">
      <LoaderCircle className="spin" size={30} />
      <strong>Opening your portfolio</strong>
      <span>Gathering the values you recorded.</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="page-state" role="alert">
      <span className="state-icon state-icon--error"><AlertCircle size={24} /></span>
      <strong>We couldn’t open your investments</strong>
      <span>{message}</span>
      <button className="button button--secondary" type="button" onClick={onRetry}><RefreshCw size={17} />Try again</button>
    </div>
  );
}

export function EmptyState({ title, description, actionLabel = "Add holding", onAction }) {
  return (
    <div className="empty-state">
      <span className="state-icon"><Inbox size={24} /></span>
      <strong>{title}</strong>
      <span>{description}</span>
      {onAction && <button className="button button--secondary" type="button" onClick={onAction}><Plus size={17} />{actionLabel}</button>}
    </div>
  );
}

