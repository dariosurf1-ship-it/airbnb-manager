const BOOKING_KEY = "airbnb_manager_bookings_v2";
const CODES_KEY = "airbnb_manager_codes_v2";
const TASKS_KEY = "airbnb_manager_tasks_v2";
const PROPERTIES_KEY = "airbnb_manager_properties_v1";
const SELECTED_PROPERTY_KEY = "airbnb_manager_selected_property_v1";

/** ---------- Properties ---------- */
export function loadProperties() {
  try {
    const raw = localStorage.getItem(PROPERTIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  // 3 appartamenti default
  const defaults = [
    {
      id: "apt-1",
      name: "Appartamento 1",
      address: "",
      wifiName: "",
      wifiPassword: "",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      houseManualUrl: "",
      notes: "",
    },
    {
      id: "apt-2",
      name: "Appartamento 2",
      address: "",
      wifiName: "",
      wifiPassword: "",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      houseManualUrl: "",
      notes: "",
    },
    {
      id: "apt-3",
      name: "Appartamento 3",
      address: "",
      wifiName: "",
      wifiPassword: "",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      houseManualUrl: "",
      notes: "",
    },
  ];

  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(defaults));
  return defaults;
}

export function saveProperties(properties) {
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties));
  window.dispatchEvent(new Event("propertiesChanged"));
}

export function loadSelectedPropertyId() {
  try {
    const raw = localStorage.getItem(SELECTED_PROPERTY_KEY);
    if (raw) return raw;
  } catch {}
  return "apt-1";
}

export function saveSelectedPropertyId(propertyId) {
  localStorage.setItem(SELECTED_PROPERTY_KEY, propertyId);
  window.dispatchEvent(new Event("selectedPropertyChanged"));
}

export function getSelectedProperty() {
  const props = loadProperties();
  const id = loadSelectedPropertyId();
  return props.find((p) => p.id === id) || props[0];
}

/** ---------- Helpers ---------- */
function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeWithPropertyId(items, propertyId) {
  if (!Array.isArray(items)) return [];
  return items.map((x) => (x && !x.propertyId ? { ...x, propertyId } : x));
}

/** ---------- Bookings ---------- */
export function loadBookings() {
  const selected = loadSelectedPropertyId();
  const items = safeParse(BOOKING_KEY, []);
  return normalizeWithPropertyId(items, selected);
}

export function saveBookings(bookings) {
  localStorage.setItem(BOOKING_KEY, JSON.stringify(bookings));
}

/** ---------- Codes ---------- */
export function loadCodes() {
  const selected = loadSelectedPropertyId();
  const items = safeParse(CODES_KEY, []);
  return normalizeWithPropertyId(items, selected);
}

export function saveCodes(codes) {
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));
}

/** ---------- Tasks ---------- */
export function loadTasks() {
  const selected = loadSelectedPropertyId();
  const items = safeParse(TASKS_KEY, []);
  return normalizeWithPropertyId(items, selected);
}

export function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
