import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "./supabaseClient";

import { ensureDefaultProperties, fetchProperties } from "./lib/cloud";
import { getSelectedPropertyId, setSelectedPropertyId } from "./lib/propertySelection";

const CloudCtx = createContext(null);

function normalizeRole(r) {
  return String(r || "").toLowerCase().trim();
}

function canManageFromRole(role) {
  const r = normalizeRole(role);
  return r === "admin" || r === "owner";
}

export function CloudProvider({ children }) {
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState("viewer");
  const [roleLoading, setRoleLoading] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlPropertyId = searchParams.get("property");

  const [selectedId, setSelectedId] = useState(getSelectedPropertyId());

  const user = session?.user || null;

  // 1) session live + sessionReady
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session || null);
      setSessionReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s || null);
      setSessionReady(true);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // 2) reset su logout
  useEffect(() => {
    if (!sessionReady) return;

    if (!session) {
      setProperties([]);
      setSelectedId(null);
      setSelectedPropertyId("");
      setRole("viewer");
      setRoleLoading(false);
      setLoading(false);
    }
  }, [session, sessionReady]);

  // 3) load properties SOLO quando user è loggato
  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!sessionReady) return;

      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        await ensureDefaultProperties();
        const list = await fetchProperties();

        if (!mounted) return;

        const props = list || [];
        setProperties(props);

        const fromUrl =
          urlPropertyId && props.some((p) => String(p.id) === String(urlPropertyId))
            ? urlPropertyId
            : null;

        const fromStorage = getSelectedPropertyId();
        const storageOk =
          fromStorage && props.some((p) => String(p.id) === String(fromStorage))
            ? fromStorage
            : null;

        const firstId = props?.[0]?.id || null;

        const next = fromUrl || storageOk || firstId;

        if (next) {
          setSelectedId(next);
          setSelectedPropertyId(next);

          const cur = searchParams.get("property");
          if (cur !== next) {
            const sp = new URLSearchParams(searchParams);
            sp.set("property", next);
            setSearchParams(sp, { replace: true });
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, user?.id]);

  // 4) URL -> selectedId
  useEffect(() => {
    if (!urlPropertyId) return;
    if (String(urlPropertyId) !== String(selectedId)) {
      setSelectedId(urlPropertyId);
      setSelectedPropertyId(urlPropertyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPropertyId]);

  // 5) selectedId -> URL + storage
  useEffect(() => {
    if (!selectedId) return;

    setSelectedPropertyId(selectedId);

    const cur = searchParams.get("property");
    if (cur !== selectedId) {
      const sp = new URLSearchParams(searchParams);
      sp.set("property", selectedId);
      setSearchParams(sp, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selectedProperty = useMemo(() => {
    return (properties || []).find((p) => String(p.id) === String(selectedId)) || null;
  }, [properties, selectedId]);

  // 6) role/canManage: prima prova a leggerlo dalla property, altrimenti query su property_members
  useEffect(() => {
    let mounted = true;

    async function loadRole() {
      if (!user?.id || !selectedId) {
        setRole("viewer");
        return;
      }

      // tentativo A: il ruolo è già nel record della property (es. view v_user_properties)
      const fromProp =
        selectedProperty?.member_role ??
        selectedProperty?.role ??
        selectedProperty?.user_role ??
        null;

      if (fromProp) {
        setRole(normalizeRole(fromProp) || "viewer");
        return;
      }

      // tentativo B: tabella property_members (adatta se il nome differisce)
      setRoleLoading(true);
      try {
        const { data, error } = await supabase
          .from("property_members")
          .select("role")
          .eq("property_id", selectedId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.warn("Role load error:", error.message);
          setRole("viewer");
          return;
        }

        setRole(normalizeRole(data?.role) || "viewer");
      } finally {
        if (mounted) setRoleLoading(false);
      }
    }

    loadRole();
    return () => {
      mounted = false;
    };
  }, [user?.id, selectedId, selectedProperty?.member_role, selectedProperty?.role]);

  function switchProperty(nextId) {
    if (!nextId || String(nextId) === String(selectedId)) return;

    setSelectedId(nextId);
    setSelectedPropertyId(nextId);

    const sp = new URLSearchParams(searchParams);
    sp.set("property", nextId);
    setSearchParams(sp);
  }

  const canManage = canManageFromRole(role);

  const value = useMemo(
    () => ({
      session,
      sessionReady,
      user,
      properties,
      loading,

      selectedId,
      selectedProperty,
      switchProperty,

      role,
      roleLoading,
      canManage,
    }),
    [
      session,
      sessionReady,
      user,
      properties,
      loading,
      selectedId,
      selectedProperty,
      role,
      roleLoading,
      canManage,
    ]
  );

  return <CloudCtx.Provider value={value}>{children}</CloudCtx.Provider>;
}

export function useCloud() {
  return useContext(CloudCtx);
}
