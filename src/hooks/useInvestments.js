import { useCallback, useEffect, useRef, useState } from "react";
import { investmentApi } from "../api/investments";

export function useInvestments(user = null) {
  const uid = user?.uid || null;
  const activeUser = useRef(uid);
  activeUser.current = uid;
  const mutations = useRef(0);
  const requestSequence = useRef(0);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!uid || mutations.current > 0) return;
    const requestId = ++requestSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const result = await investmentApi.list();
      if (requestId !== requestSequence.current || activeUser.current !== uid) return;
      setHoldings(Array.isArray(result) ? result : []);
      setLoaded(true);
    } catch (error) {
      if (requestId === requestSequence.current && activeUser.current === uid) setLoadError(error.message);
    } finally {
      if (requestId === requestSequence.current && activeUser.current === uid) setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (!user) {
      setHoldings([]);
      setLoaded(false);
      setLoading(false);
      setLoadError("");
      return;
    }
    setHoldings([]);
    setLoaded(false);
    load();
    return () => { requestSequence.current += 1; };
  }, [load, uid]);

  useEffect(() => {
    if (!user) return undefined;
    const sync = () => { if (document.visibilityState === "visible" && mutations.current === 0) void load(); };
    const timer = window.setInterval(sync, 30000);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [uid, load]);

  const save = useCallback(async (holding, payload) => {
    const owner = uid;
    if (!owner || activeUser.current !== owner) throw new Error('Sign in again before saving.');
    requestSequence.current++; mutations.current++;
    setSaving(true);
    try {
      const saved = holding
        ? await investmentApi.update(holding.id, payload)
        : await investmentApi.create(payload);
      if (activeUser.current !== owner) return saved;
      setHoldings((current) => holding
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved]);
      return saved;
    } finally {
      mutations.current--; requestSequence.current++;
      if (activeUser.current === owner) { setSaving(false); setLoading(false); }
    }
  }, [uid]);

  const remove = useCallback(async (holding) => {
    const owner = uid;
    requestSequence.current++; mutations.current++;
    setDeleting(true);
    try {
      await investmentApi.remove(holding.id);
      if (activeUser.current !== owner) return;
      setHoldings((current) => current.filter((item) => item.id !== holding.id));
    } finally {
      mutations.current--; requestSequence.current++;
      if (activeUser.current === owner) { setDeleting(false); setLoading(false); }
    }
  }, [uid]);

  return { holdings, loading, loaded, loadError, saving, deleting, actions: { load, save, remove } };
}
