import { BriefcaseBusiness, LayoutDashboard, ListFilter, LogOut, Plus, RefreshCw, ShieldCheck, Sparkles, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/holdings", label: "Holdings", icon: ListFilter },
];

function Brand() {
  return (
    <div className="brand" aria-label="Mira Investment Manager">
      <span className="brand-mark"><BriefcaseBusiness size={21} strokeWidth={2.1} /></span>
      <span className="brand-copy"><strong>Mira</strong><small>Investments</small></span>
    </div>
  );
}

function Navigation({ mobile = false }) {
  return (
    <nav className={mobile ? "mobile-navigation" : "side-navigation"} aria-label="Investment manager">
      {navigation.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end}>
          <Icon size={mobile ? 20 : 18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppShell({ user, onSignOut, loading, onAdd, onRefresh, onOpenIntelligence, children }) {
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Brand />
        <Navigation />

        <div className="sidebar-bottom">
          {user && (
            <div className="sidebar-user">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder"><User size={16} /></div>
              )}
              <div className="user-info">
                <span className="user-name">{user.displayName || "Account"}</span>
                <span className="user-email">{user.email || ""}</span>
              </div>
              <button
                type="button"
                className="user-signout-btn"
                onClick={onSignOut}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          <div className="sidebar-note">
            <span><ShieldCheck size={17} /></span>
            <div><strong>Entered by you</strong><small>No live-price claims</small></div>
          </div>
        </div>
      </aside>

      <div className="app-column">
        <header className="topbar">
          <div className="topbar-brand"><Brand /></div>
          <div className="topbar-context"><strong>Portfolio ledger</strong><span>Values reflect your latest entries</span></div>

          <div className="topbar-actions">
            <button className="icon-button topbar-intelligence" type="button" onClick={onOpenIntelligence} aria-label="Open investment intelligence" title="Investment intelligence"><Sparkles size={18} /></button>
            <button className="icon-button refresh-button" type="button" onClick={onRefresh} disabled={loading} aria-label="Refresh holdings"><RefreshCw size={18} /></button>
            <button className="button button--primary topbar-action" type="button" onClick={onAdd}><Plus size={18} /><span>Add holding</span></button>

            {user && (
              <div className="topbar-user">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="user-avatar topbar-user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder topbar-user-avatar"><User size={14} /></div>
                )}
                <button
                  type="button"
                  className="user-signout-btn topbar-signout-btn"
                  onClick={onSignOut}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>

          {loading && <span className="route-progress" aria-label="Refreshing investments" />}
        </header>

        <main className="main-content">{children}</main>
        <Navigation mobile />
      </div>
    </div>
  );
}
