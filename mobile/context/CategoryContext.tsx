import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type CategoryContextValue = {
  category: string | null;
  setCategory: (category: string | null) => void;
};

const CategoryContext = createContext<CategoryContextValue | null>(null);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [category, setCategory] = useState<string | null>(null);

  const value = useMemo(
    () => ({ category, setCategory }),
    [category],
  );

  return (
    <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>
  );
}

export function useCategory() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error("useCategory must be used within CategoryProvider");
  return ctx;
}
