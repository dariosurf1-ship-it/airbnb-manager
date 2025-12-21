import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { ensureDefaultProperties, fetchProperties } from "./lib/cloud";
import { getSelectedPropertyId, setSelectedPropertyId } from "./lib/propertySelection";

const CloudCtx = createContext(null);

export function CloudProvider({ children }) {
  const [session, setSession] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState(getSelectedPropertyId());

  // session live
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s || null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // reload properties when session changes
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        if (!session) {
          if (mounted) {
            setProperties([]);
            setLoading(false);
          }
          return;
        }

        // crea defaults se owner nuovo
        const props = await ensureDefaultProperties();

        // se non ho selezione, imposta il primo
        const currentSelected = getSelectedPropertyId();
        const fallback = props?.[0]?.id;

        if (!currentSelected && fallback) {
          setSelectedPropertyId(fallback);
          setSelectedId(fallback);
        } else {
          setSelectedId(currentSelected || fallback || "");
        }

        if (mounted) setProperties(props || []);
      } catch (e) {
        console.error(e);
        // fallback: prova almeno a leggere senza creare
        try {
          const props = await fetchProperties();
          if (mounted) setProperties(props || []);
        } catch (e2) {
          console.error(e2);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, [session]);

  // ascolta cambi selezione (altri componenti)
  useEffect(() => {
    function onChange() {
      setSelectedId(getSelectedPropertyId());
    }
    window.addEventListener("property_selected_changed", onChange);
    return () => window.removeEventListener("property_selected_changed", onChange);
  }, []);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedId) || properties[0] || null,
    [properties, selectedId]
  );

  const value = useMemo(
    () => ({
      session,
      loading,
      properties,
      selectedId,
      selectedProperty,
      selectProperty: (id) => setSelectedPropertyId(id),
      setProperties,
    }),
    [session, loading, properties, selectedId, selectedProperty]
  );

  return <CloudCtx.Provider value={value}>{children}</CloudCtx.Provider>;
}

export function useCloud() {
  const ctx = useContext(CloudCtx);
  if (!ctx) throw new Error("useCloud must be used inside CloudProvider");
  return ctx;
}
