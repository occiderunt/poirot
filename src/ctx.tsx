import { createContext, useContext } from "react";
import type { PantryApi } from "./store";

export type Route =
  | { name: "home" }
  | { name: "shelf"; shelfId: string }
  | { name: "items" }
  | { name: "settings" }
  | { name: "shelves" };

export type ItemFilter = "all" | "soon" | "low" | "out";

export type ModalState =
  | { kind: "item"; id: string }
  | { kind: "editItem"; id: string }
  | { kind: "newItem"; shelfId: string }
  | { kind: "shelfEditor"; id?: string }
  | { kind: "confirm"; title: string; body: string; label: string; action: () => void }
  | { kind: "backup"; mode: "export" | "import" }
  | null;

export interface Nav {
  go: (route: Route) => void;
  openItem: (id: string) => void;
  editItem: (id: string) => void;
  newItem: (shelfId?: string) => void;
  editShelf: (id?: string) => void;
  setModal: (modal: ModalState) => void;
  toast: (message: string) => void;
}

export const PantryCtx = createContext<PantryApi | null>(null);
export const NavCtx = createContext<Nav | null>(null);

export function usePantry(): PantryApi {
  const api = useContext(PantryCtx);
  if (!api) throw new Error("PantryCtx missing");
  return api;
}

export function useNav(): Nav {
  const nav = useContext(NavCtx);
  if (!nav) throw new Error("NavCtx missing");
  return nav;
}
