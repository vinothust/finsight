import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "pm" | "account_director" | "area_director";

interface RoleContextValue {
  role: Role;
  scopeId: number | null;
  setRole: (role: Role) => void;
}

const STORAGE_KEY = "finsight_role";

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(
    () => (localStorage.getItem(STORAGE_KEY) as Role) || "area_director"
  );

  const setRole = (next: Role) => {
    localStorage.setItem(STORAGE_KEY, next);
    setRoleState(next);
  };

  return <RoleContext.Provider value={{ role, scopeId: null, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
