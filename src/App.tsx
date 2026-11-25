import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";
import { NavCtx, PantryCtx, type ItemFilter, type ModalState, type Nav, type Route } from "./ctx";
import { usePantry } from "./store";
import { HomeScreen, ItemsScreen, SettingsScreen, ShelfScreen, ShelvesScreen } from "./screens";
import {
  BackupDialog,
  ConfirmDialog,
  ItemEditor,
  ItemSheet,
  ShelfEditor,
} from "./dialogs";

export default function App() {
  const api = usePantry();
  const [route, setRoute] = useState<Route>({ name: "home" });
  const [modal, setModal] = useState<ModalState>(null);
  const [filter, setFilter] = useState<ItemFilter>("all");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  const toast = useCallback((message: string) => {
    setToastMsg(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  // Keep sheets clear of the on-screen keyboard. Android WebView reports the
  // keyboard through the visual viewport rather than resizing the window.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--kb", `${Math.round(gap)}px`);
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      document.documentElement.style.setProperty("--kb", "0px");
    };
  }, []);

  const nav: Nav = useMemo(
    () => ({
      go: (next) => {
        setRoute(next);
      },
      openItem: (id) => setModal({ kind: "item", id }),
      editItem: (id) => setModal({ kind: "editItem", id }),
      newItem: (shelfId) => {
        const fallback = shelfId ?? (route.name === "shelf" ? route.shelfId : undefined);
        const target = fallback ?? api.pantry.shelves[0]?.id;
        if (!target) {
          setModal({ kind: "shelfEditor" });
          return;
        }
        setModal({ kind: "newItem", shelfId: target });
      },
      editShelf: (id) => setModal({ kind: "shelfEditor", id }),
      setModal,
      toast,
    }),
    [route, api.pantry.shelves, toast],
  );

  useEffect(() => {
    viewRef.current?.scrollTo({ top: 0 });
  }, [route]);

  useEffect(() => {
    if (toastMsg) {
      const el = document.querySelector(".toast");
      el?.classList.remove("leaving");
    }
  }, [toastMsg]);

  const tab: "shelves" | "items" | "settings" =
    route.name === "items"
      ? "items"
      : route.name === "settings" || route.name === "shelves"
        ? "settings"
        : "shelves";

  const showFab = route.name === "home" || route.name === "shelf" || route.name === "items";

  const renderScreen = () => {
    switch (route.name) {
      case "home":
        return (
          <HomeScreen
            onSeeSoon={() => {
              setFilter("soon");
              setRoute({ name: "items" });
            }}
          />
        );
      case "shelf":
        return <ShelfScreen shelfId={route.shelfId} />;
      case "items":
        return <ItemsScreen filter={filter} onFilter={setFilter} />;
      case "shelves":
        return <ShelvesScreen />;
      case "settings":
        return <SettingsScreen />;
    }
  };

  const renderModal = () => {
    if (!modal) return null;
    switch (modal.kind) {
      case "item":
        return <ItemSheet key={modal.id} itemId={modal.id} />;
      case "editItem":
        return <ItemEditor key={modal.id} itemId={modal.id} shelfId={modal.id} />;
      case "newItem":
        return <ItemEditor key="new" shelfId={modal.shelfId} />;
      case "shelfEditor":
        return <ShelfEditor key={modal.id ?? "new-shelf"} shelfId={modal.id} />;
      case "confirm":
        return (
          <ConfirmDialog
            title={modal.title}
            body={modal.body}
            label={modal.label}
            action={modal.action}
          />
        );
      case "backup":
        return <BackupDialog key={modal.mode} mode={modal.mode} />;
    }
  };

  return (
    <PantryCtx.Provider value={api}>
      <NavCtx.Provider value={nav}>
        <div className="app">
          <div className="view" ref={viewRef}>
            {renderScreen()}
          </div>

          {toastMsg && (
            <div className="toast" role="status">
              <Icon name="check" size={16} />
              {toastMsg}
            </div>
          )}

          {showFab && (
            <button className="fab" aria-label="Add an item" onClick={() => nav.newItem()}>
              <Icon name="plus" size={26} />
            </button>
          )}

          <nav className="tabbar" aria-label="Main">
            <div className="tabbar-inner">
              <button
                className={`tab ${tab === "shelves" ? "on" : ""}`}
                onClick={() => setRoute({ name: "home" })}
                aria-current={tab === "shelves" ? "page" : undefined}
              >
                <Icon name="shelf" size={21} />
                Shelves
              </button>
              <button
                className={`tab ${tab === "items" ? "on" : ""}`}
                onClick={() => setRoute({ name: "items" })}
                aria-current={tab === "items" ? "page" : undefined}
              >
                <Icon name="list" size={21} />
                Items
              </button>
              <button
                className={`tab ${tab === "settings" ? "on" : ""}`}
                onClick={() => setRoute({ name: "settings" })}
                aria-current={tab === "settings" ? "page" : undefined}
              >
                <Icon name="settings" size={21} />
                Settings
              </button>
            </div>
          </nav>

          {renderModal()}
        </div>
      </NavCtx.Provider>
    </PantryCtx.Provider>
  );
}
