import FloatingAssistant from "./components/FloatingAssistant";
import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { configureAccessTokenProvider } from "./api/client";
import AppShell from "./components/AppShell";
import DomainIntelligenceDialog from "./components/DomainIntelligenceDialog";
import ConfirmDialog from "./components/ConfirmDialog";
import HoldingForm from "./components/HoldingForm";
import AiInvestmentCaptureModal from "./components/AiInvestmentCaptureModal";
import AiMemorySearchDialog from "./components/AiMemorySearchDialog";
import LoginScreen from "./components/LoginScreen";
import { ErrorState, LoadingState } from "./components/PageState";
import Toast from "./components/Toast";
import { auth, googleProvider, signInWithPopup, signOut } from "./config/firebase";
import { useInvestments } from "./hooks/useInvestments";
import { investmentApi } from "./api/investments";
import { localDateKey } from "./lib/dates";
import HoldingsPage from "./pages/HoldingsPage";
import OverviewPage from "./pages/OverviewPage";

function loginMessage(error) {
  const code = error?.code || "";
  if (code === "auth/popup-closed-by-user") return "Sign-in was closed before it finished. Try again when you are ready.";
  if (code === "auth/popup-blocked") return "Your browser blocked the sign-in window. Allow pop-ups for Mira and try again.";
  if (code === "auth/network-request-failed") return "Could not reach Google authentication. Check your connection and try again.";
  return "Could not sign you in right now. Please try again.";
}

export default function App() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        configureAccessTokenProvider(async () => currentUser.getIdToken());
      } else {
        configureAccessTokenProvider(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function handleLogin() {
    setAuthError("");
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(loginMessage(err));
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  }

  const manager = useInvestments(user);
  const [form, setForm] = useState({ open: false, holding: null, initialType: "STOCK" });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const [aiCaptureOpen, setAiCaptureOpen] = useState(false);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setAiSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (manager.loaded && manager.loadError) {
      setToast({ tone: "error", message: manager.loadError });
    }
  }, [manager.loadError, manager.loaded]);

  const openAdd = (initialType = "STOCK") => setForm({ open: true, holding: null, initialType });
  const openEdit = (holding) => setForm({ open: true, holding, initialType: holding.assetType });
  const closeForm = () => setForm((current) => ({ ...current, open: false, holding: null }));

  async function saveHolding(payload) {
    const editing = Boolean(form.holding);
    await manager.actions.save(form.holding, payload);
    closeForm();
    setToast({ tone: "success", message: editing ? "Holding updated." : "Holding added." });
  }

  async function deleteHolding() {
    if (!pendingDelete) return;
    try {
      await manager.actions.remove(pendingDelete);
      setPendingDelete(null);
      setToast({ tone: "success", message: "Holding deleted." });
    } catch (error) {
      setToast({ tone: "error", message: error.message });
    }
  }

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("holding");
    const target = manager.holdings.find(holding => String(holding.id) === id);
    if (target && manager.loaded) setForm({ open: true, holding: target, initialType: target.assetType });
  }, [location.search, manager.loaded]);

  if (authLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={authError} loading={signingIn} />;
  }

  let content;
  if (!manager.loaded && manager.loading) content = <LoadingState />;
  else if (!manager.loaded && manager.loadError) content = <ErrorState message={manager.loadError} onRetry={manager.actions.load} />;
  else content = <Routes><Route path="/" element={<OverviewPage holdings={manager.holdings} today={localDateKey()} onAdd={openAdd} onEdit={openEdit} />} /><Route path="/holdings" element={<HoldingsPage holdings={manager.holdings} today={localDateKey()} onAdd={openAdd} onEdit={openEdit} onDelete={setPendingDelete} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>;

  return <>
    <AppShell
      user={user}
      onSignOut={handleSignOut}
      loading={manager.loading}
      onAdd={() => openAdd("STOCK")}
      onRefresh={manager.actions.load}
      onOpenIntelligence={() => setIntelligenceOpen(true)}
      onOpenAiCapture={() => setAiCaptureOpen(true)}
      onOpenAiSearch={() => setAiSearchOpen(true)}
    >
      {content}
    </AppShell>
    <DomainIntelligenceDialog domain="investments" userId={user.uid} revision={manager.holdings} open={intelligenceOpen} title="Investment intelligence" description="Review concentration, stale valuations and upcoming dates using only the values you entered—not live market data or trading advice." date={localDateKey()} load={investmentApi.analyze} refresh={investmentApi.refreshAnalysis} onClose={() => setIntelligenceOpen(false)} />
    <HoldingForm open={form.open} holding={form.holding} initialType={form.initialType} saving={manager.saving} onClose={closeForm} onSave={saveHolding} />
    <ConfirmDialog holding={pendingDelete} busy={manager.deleting} onCancel={() => setPendingDelete(null)} onConfirm={deleteHolding} />
    <AiInvestmentCaptureModal
      open={aiCaptureOpen}
      onClose={() => setAiCaptureOpen(false)}
      onSuccess={(msg) => {
        manager.actions.load();
        setToast({ tone: "success", message: msg || "Investment captured and processed by AI." });
      }}
    />
    <AiMemorySearchDialog
      open={aiSearchOpen}
      onClose={() => setAiSearchOpen(false)}
    />
      <FloatingAssistant domain={"investments"} userId={user.uid} date={localDateKey()} />
    <Toast toast={toast} onClose={closeToast} />
  </>;
}
