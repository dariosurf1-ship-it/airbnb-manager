import { supabase } from "../supabaseClient";

/**
 * Session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Roles / Memberships
 */
export async function fetchMyRoleForProperty(propertyId) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId || !propertyId) return null;

  const { data, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("property_id", propertyId)
    .eq("user_id", userId)
    .maybeSingle();

  // Se non c'è membership, potrebbe essere owner (owner_id sulle properties). In quel caso è admin.
  if (error) {
    console.warn("fetchMyRoleForProperty error:", error);
    return null;
  }
  return data?.role || null;
}

/**
 * Properties
 */
export async function fetchProperties() {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function ensureDefaultProperties() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not logged in");

  const existing = await fetchProperties();
  if (existing.length >= 3) return existing;

  const missingCount = 3 - existing.length;
  const names = ["Appartamento 1", "Appartamento 2", "Appartamento 3"];

  const toCreate = [];
  for (let i = 0; i < 3; i++) {
    if (!existing[i]) {
      toCreate.push({
        owner_id: userId,
        name: names[i] || `Appartamento ${i + 1}`,
        address: "",
        wifi_name: "",
        wifi_password: "",
        check_in_time: "15:00",
        check_out_time: "10:00",
        house_manual_url: "",
        notes: "",
      });
    }
  }
  while (toCreate.length > missingCount) toCreate.pop();

  if (toCreate.length > 0) {
    const { data: inserted, error } = await supabase
      .from("properties")
      .insert(toCreate)
      .select("*");

    if (error) throw error;

    const memberships = (inserted || []).map((p) => ({
      property_id: p.id,
      user_id: userId,
      role: "admin",
    }));

    if (memberships.length) {
      const { error: mErr } = await supabase.from("memberships").insert(memberships);
      if (mErr && !String(mErr.message || "").toLowerCase().includes("duplicate")) {
        console.warn("Membership insert warning:", mErr);
      }
    }
  }

  return await fetchProperties();
}

export async function updateProperty(propertyId, patch) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("properties")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", propertyId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/**
 * BOOKINGS (Prenotazioni) CRUD
 */
export async function fetchBookings(propertyId) {
  if (!propertyId) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("property_id", propertyId)
    .order("check_in", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createBooking(propertyId, payload) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not logged in");
  if (!propertyId) throw new Error("Missing propertyId");

  const row = {
    owner_id: userId,
    property_id: propertyId,
    guest: payload.guest,
    channel: payload.channel || "Airbnb",
    status: payload.status || "Confermata",
    check_in: payload.check_in,
    check_out: payload.check_out,
    people: Number(payload.people || 1),
    nationality: payload.nationality || "EN",
    phone: payload.phone || null,
    email: payload.email || null,
    preferred_contact: payload.preferred_contact || "WhatsApp",
    notes: payload.notes || null,
  };

  const { data, error } = await supabase.from("bookings").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateBooking(bookingId, patch) {
  if (!bookingId) throw new Error("Missing bookingId");

  const { data, error } = await supabase
    .from("bookings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBooking(bookingId) {
  if (!bookingId) throw new Error("Missing bookingId");
  const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
  if (error) throw error;
  return true;
}
/**
 * MEMBERSHIPS management
 * - list members for a property
 * - add/remove members
 */

export async function fetchMembers(propertyId) {
  if (!propertyId) return [];
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, role, created_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addMember(propertyId, userId, role) {
  if (!propertyId) throw new Error("Missing propertyId");
  if (!userId) throw new Error("Missing userId");

  const { error } = await supabase
    .from("memberships")
    .insert([{ property_id: propertyId, user_id: userId, role }]);

  if (error) throw error;
  return true;
}

export async function removeMember(propertyId, userId) {
  if (!propertyId) throw new Error("Missing propertyId");
  if (!userId) throw new Error("Missing userId");

  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  if (error) throw error;
  return true;
}
