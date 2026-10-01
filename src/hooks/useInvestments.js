import { useCallback, useEffect, useRef, useState } from "react";
import { investmentApi } from "../api/investments";

export function useInvestments(user = null) {
  const requestSequence = useRef(0);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const result = await investmentApi.list();
      if (requestId !== requestSequence.current) return;
      setHoldings(Array.isArray(result) ? result : []);
      setLoaded(true);
    } catch (error) {
      if (requestId === requestSequence.current) setLoadError(error.message);
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setHoldings([]);
      setLoaded(false);
      setLoading(false);
      setLoadError("");
      return;
    }
    load();
    return () => { requestSequence.current += 1; };
  }, [load, user]);

  useEffect(() => {
    if (!user) return undefined;
    const sync = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [user, load]);

  const save = useCallback(async (holding, payload) => {
    setSaving(true);
    try {
      const saved = holding
        ? await investmentApi.update(holding.id, payload)
        : await investmentApi.create(payload);
      setHoldings((current) => holding
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved]);
      return saved;
    } finally {
      setSaving(false);
    }
  }, []);

  const remove = useCallback(async (holding) => {
    setDeleting(true);
    try {
      await investmentApi.remove(holding.id);
      setHoldings((current) => current.filter((item) => item.id !== holding.id));
    } finally {
      setDeleting(false);
    }
  }, []);

  return { holdings, loading, loaded, loadError, saving, deleting, actions: { load, save, remove } };
}
