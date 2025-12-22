import { createContext, useContext, useState } from "react";

const PropertyContext = createContext();

export function PropertyProvider({ children }) {
  const [activeProperty, setActiveProperty] = useState(null);

  return (
    <PropertyContext.Provider
      value={{ activeProperty, setActiveProperty }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  return useContext(PropertyContext);
}
