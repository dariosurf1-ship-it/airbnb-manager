import { useEffect, useState } from "react";
import { loadProperties, loadSelectedPropertyId } from "./storage";

export function useSelectedProperty() {
  const [selectedId, setSelectedId] = useState(loadSelectedPropertyId());
  const [properties, setProperties] = useState(loadProperties());

  useEffect(() => {
    function refresh() {
      setSelectedId(loadSelectedPropertyId());
      setProperties(loadProperties());
    }

    window.addEventListener("selectedPropertyChanged", refresh);
    window.addEventListener("propertiesChanged", refresh);

    return () => {
      window.removeEventListener("selectedPropertyChanged", refresh);
      window.removeEventListener("propertiesChanged", refresh);
    };
  }, []);

  const selectedProperty =
    properties.find((p) => p.id === selectedId) || properties[0];

  return { selectedId, properties, selectedProperty };
}
