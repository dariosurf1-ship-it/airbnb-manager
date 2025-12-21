const KEY = "airbnb_selected_property_id_v1";

export function getSelectedPropertyId() {
  return localStorage.getItem(KEY) || "";
}

export function setSelectedPropertyId(id) {
  localStorage.setItem(KEY, id);
  window.dispatchEvent(new Event("property_selected_changed"));
}
