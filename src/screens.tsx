import { useMemo, useState } from "react";
import { Icon, Mark } from "./icons";
import { useNav, usePantry, type ItemFilter } from "./ctx";
import {
  categoryOf,
  expiryLabel,
  expiryState,
  formatQty,
  isLow,
  plural,
  unitLabel,
  type Item,
  type Shelf,
} from "./store";

export const VERSION = "1.0.1";

// ---------- small pieces ----------------------------------------------------

function Qty({ item }: { item: Item }) {
  const unit = unitLabel(item.unit, item.qty);
  return (
    <span className={`row-qty num ${item.qty <= 0 ? "out" : ""}`}>
      {Number.isInteger(item.qty) ? item.qty : Math.round(item.qty * 100) / 100}
      {unit && <small className="unit">{unit}</small>}
    </span>
  );
}

export function ShelfTile({
  shelf,
  count,
  soon,
  low,
}: {
  shelf: Shelf;
  count: number;
  soon: number;
  low: number;
}) {
  const nav = useNav();
  return (
    <button
      className="shelf-tile"
      style={{ ["--sc" as string]: shelf.color }}
      onClick={() => nav.go({ name: "shelf", shelfId: shelf.id })}
      aria-label={`Open ${shelf.name}`}
    >
      <span className="shelf-tile-top">
        <span className="tile-icon">
          <Icon name={shelf.icon} size={20} />
        </span>
        <span className="tile-count">{count}</span>
      </span>
      <span className="tile-name">{shelf.name}</span>
      <span className="tile-sub">
        {soon > 0 ? (
          <span className="flag">{soon === 1 ? "1 due soon" : `${soon} due soon`}</span>
        ) : low > 0 ? (
          <span className="flag">{low === 1 ? "1 running low" : `${low} running low`}</span>
        ) : (
          <span>In order</span>
        )}
      </span>
    </button>
  );
}

export function ItemRow({
  item,
  showShelf,
  shelfName,
}: {
  item: Item;
  showShelf?: boolean;
  shelfName?: string;
}) {
  const nav = useNav();
  const cat = categoryOf(item.category);
  const state = expiryState(item.expiry);
  const low = isLow(item);
  return (
    <button className="row" onClick={() => nav.openItem(item.id)}>
      <span className="cat-dot" style={{ ["--cat" as string]: cat.color }} />
      <span className="row-main">
        <span className="row-name">{item.name}</span>
        <span className="row-sub">
          {showShelf && shelfName && <span>{shelfName}</span>}
          {showShelf && shelfName && item.expiry && <span>·</span>}
          {item.expiry && (
            <span className={state === "expired" ? "expired" : state === "soon" ? "soon" : ""}>
              {expiryLabel(item.expiry)}
            </span>
          )}
          {low && (
            <>
              {(showShelf || item.expiry) && <span>·</span>}
              <span className="lowflag">{item.qty <= 0 ? "Out" : "Running low"}</span>
            </>
          )}
        </span>
      </span>
      <Qty item={item} />
    </button>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: "jar" | "search" | "shelf";
  title: string;
  body: string;
}) {
  return (
    <div className="empty">
      <Icon name={icon} size={30} />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ---------- home ------------------------------------------------------------

export function HomeScreen({ onSeeSoon }: { onSeeSoon: () => void }) {
  const { pantry } = usePantry();
  const nav = useNav();

  const counts = useMemo(() => {
    const map = new Map<string, { count: number; soon: number; low: number }>();
    for (const s of pantry.shelves) map.set(s.id, { count: 0, soon: 0, low: 0 });
    for (const i of pantry.items) {
      const entry = map.get(i.shelfId);
      if (!entry) continue;
      entry.count += 1;
      if (expiryState(i.expiry) === "soon" || expiryState(i.expiry) === "expired") entry.soon += 1;
      if (isLow(i)) entry.low += 1;
    }
    return map;
  }, [pantry]);

  const due = useMemo(
    () =>
      pantry.items
        .filter((i) => ["soon", "expired"].includes(expiryState(i.expiry)))
        .sort((a, b) => a.expiry.localeCompare(b.expiry)),
    [pantry.items],
  );

  const total = pantry.items.length;
  const shelfName = (id: string) => pantry.shelves.find((s) => s.id === id)?.name ?? "";

  return (
    <>
      <div className="topbar">
        <span className="wordmark">
          <Mark size={32} />
          <span className="wordmark-text">Poirot</span>
        </span>
        <span className="topbar-spacer" />
        <button
          className="iconbtn"
          aria-label="Search every item"
          onClick={() => nav.go({ name: "items" })}
        >
          <Icon name="search" size={20} />
        </button>
      </div>

      <header className="home-head">
        <p className="eyebrow">Pantry ledger</p>
        <h1 className="display">
          {greeting()}
          <em>.</em>
        </h1>
        <p className="lede">
          {total === 0 ? (
            <>The shelves are bare. Add the first thing and Poirot will keep the ledger.</>
          ) : (
            <>
              <strong>{total}</strong> {total === 1 ? "item" : "items"} across{" "}
              <strong>{pantry.shelves.length}</strong>{" "}
              {pantry.shelves.length === 1 ? "shelf" : "shelves"}.
              {due.length > 0
                ? ` ${due.length === 1 ? "One needs" : `${due.length} need`} using up.`
                : " All in order."}
            </>
          )}
        </p>
      </header>

      {due.length > 0 && (
        <section className="alert-card" aria-label="Due soon">
          <div className="alert-top">
            <Icon name="clock" size={15} />
            <span className="lbl">Use it up</span>
            <span className="count">{due.length}</span>
          </div>
          {due.slice(0, 3).map((item) => (
            <button key={item.id} className="alert-row" onClick={() => nav.openItem(item.id)}>
              <span className="aname">{item.name}</span>
              <span className="awhere">{shelfName(item.shelfId)}</span>
              <span className="pill-date">{expiryLabel(item.expiry)}</span>
            </button>
          ))}
          {due.length > 3 && (
            <button className="alert-row" onClick={onSeeSoon}>
              <span className="aname" style={{ fontSize: 14, fontFamily: "Karla, sans-serif" }}>
                See all {due.length}
              </span>
              <Icon name="right" size={16} />
            </button>
          )}
        </section>
      )}

      <div className="section-head">
        <h2>Shelves</h2>
        <span className="rule" />
        <button className="linkbtn" onClick={() => nav.go({ name: "shelves" })}>
          Edit
        </button>
      </div>

      {pantry.shelves.length === 0 ? (
        <EmptyState
          icon="shelf"
          title="No shelves yet"
          body="Name your first shelf: the left pantry, the freezer, the spice rack."
        />
      ) : (
        <div className="shelf-grid">
          {pantry.shelves.map((shelf) => (
            <ShelfTile
              key={shelf.id}
              shelf={shelf}
              count={counts.get(shelf.id)?.count ?? 0}
              soon={counts.get(shelf.id)?.soon ?? 0}
              low={counts.get(shelf.id)?.low ?? 0}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ---------- single shelf ----------------------------------------------------

export function ShelfScreen({ shelfId }: { shelfId: string }) {
  const { pantry, itemsInShelf } = usePantry();
  const nav = useNav();
  const shelf = pantry.shelves.find((s) => s.id === shelfId);

  if (!shelf) {
    return (
      <EmptyState icon="shelf" title="Shelf not found" body="It may have been removed." />
    );
  }

  const items = itemsInShelf(shelf.id);
  const groups = (() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()] as [Item["category"], Item[]][];
  })();

  const due = items.filter((i) => ["soon", "expired"].includes(expiryState(i.expiry))).length;

  return (
    <>
      <div className="backrow">
        <button className="iconbtn" aria-label="Back to shelves" onClick={() => nav.go({ name: "home" })}>
          <Icon name="back" size={20} />
        </button>
        <span className="topbar-spacer" />
        <button className="iconbtn" aria-label="Edit shelf" onClick={() => nav.editShelf(shelf.id)}>
          <Icon name="pencil" size={19} />
        </button>
      </div>

      <header className="detail-head">
        <span
          className="tile-icon"
          style={{ ["--sc" as string]: shelf.color }}
        >
          <Icon name={shelf.icon} size={23} />
        </span>
        <div className="detail-titles">
          <h1>{shelf.name}</h1>
          <p>
            {plural(items.length, "item")}
            {due > 0 ? ` · ${due} to use up` : ""}
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon="jar"
          title="Nothing on this shelf"
          body="Add something and it will be filed right here."
        />
      ) : (
        <div className="paper-list">
          {groups.map(([category, groupItems]) => {
            const cat = categoryOf(category as Item["category"]);
            return (
              <section className="group" key={category}>
                <div className="group-head">
                  <h3>{cat.label}</h3>
                  <span className="rule" />
                  <span className="gcount">{groupItems.length}</span>
                </div>
                {groupItems.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </section>
            );
          })}
          <div style={{ height: 8 }} />
        </div>
      )}
    </>
  );
}

// ---------- every item ------------------------------------------------------

export function ItemsScreen({
  filter,
  onFilter,
}: {
  filter: ItemFilter;
  onFilter: (f: ItemFilter) => void;
}) {
  const { pantry } = usePantry();
  const [query, setQuery] = useState("");

  const shelfName = (id: string) => pantry.shelves.find((s) => s.id === id)?.name ?? "";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = pantry.items.filter((item) => {
      if (filter === "soon" && !["soon", "expired"].includes(expiryState(item.expiry)))
        return false;
      if (filter === "low" && !(isLow(item) && item.qty > 0)) return false;
      if (filter === "out" && item.qty > 0) return false;
      if (!q) return true;
      const hay = [
        item.name,
        item.notes,
        shelfName(item.shelfId),
        categoryOf(item.category).label,
        item.unit,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    list = [...list];
    if (filter === "soon") list.sort((a, b) => a.expiry.localeCompare(b.expiry));
    else if (filter === "low" || filter === "out") list.sort((a, b) => a.qty - b.qty);
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [pantry.items, pantry.shelves, query, filter]);

  const filters: { id: ItemFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "soon", label: "Due soon" },
    { id: "low", label: "Running low" },
    { id: "out", label: "Out" },
  ];

  return (
    <>
      <header className="home-head" style={{ marginBottom: 16 }}>
        <p className="eyebrow">The whole pantry</p>
        <h1 className="display">Every item</h1>
      </header>

      <div className="search-wrap">
        <Icon name="search" size={19} />
        <input
          className="search"
          type="search"
          placeholder="Search the pantry"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search items"
        />
        {query && (
          <button className="clear-search" aria-label="Clear search" onClick={() => setQuery("")}>
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      <div className="chips" role="tablist">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`chip ${filter === f.id ? "on" : ""}`}
            onClick={() => onFilter(f.id)}
            role="tab"
            aria-selected={filter === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="eyebrow" style={{ margin: "6px 2px 10px" }}>
        {results.length === 1 ? "1 item" : `${results.length} items`}
        {query ? ` matching “${query}”` : ""}
      </p>

      {results.length === 0 ? (
        <EmptyState
          icon="search"
          title={query ? "No such thing" : "Nothing here"}
          body={
            query
              ? "Poirot checked every shelf. Try a shorter word."
              : "This shelf of the ledger is empty for now."
          }
        />
      ) : (
        <div className="paper-list">
          {results.map((item) => (
            <ItemRow key={item.id} item={item} showShelf shelfName={shelfName(item.shelfId)} />
          ))}
          <div style={{ height: 6 }} />
        </div>
      )}
    </>
  );
}

// ---------- shelves manager ------------------------------------------------

export function ShelvesScreen() {
  const { pantry, moveShelf } = usePantry();
  const nav = useNav();

  return (
    <>
      <div className="backrow">
        <button className="iconbtn" aria-label="Back" onClick={() => nav.go({ name: "settings" })}>
          <Icon name="back" size={20} />
        </button>
      </div>

      <header className="home-head" style={{ marginBottom: 14 }}>
        <p className="eyebrow">Where things live</p>
        <h1 className="display">Shelves</h1>
        <p className="lede">
          Name them the way you say them out loud. Reorder with the arrows; tap a shelf to
          rename or remove it.
        </p>
      </header>

      <div className="stack">
        {pantry.shelves.map((shelf, index) => {
          const count = pantry.items.filter((i) => i.shelfId === shelf.id).length;
          return (
            <div className="loc-row" key={shelf.id} style={{ ["--sc" as string]: shelf.color }}>
              <span className="tile-icon">
                <Icon name={shelf.icon} size={19} />
              </span>
              <button className="loc-main" onClick={() => nav.editShelf(shelf.id)}>
                <b>{shelf.name}</b>
                <span>{count === 1 ? "1 item" : `${count} items`}</span>
              </button>
              <span className="reorder">
                <button
                  aria-label={`Move ${shelf.name} up`}
                  disabled={index === 0}
                  onClick={() => moveShelf(shelf.id, -1)}
                >
                  <Icon name="up" size={17} />
                </button>
                <button
                  aria-label={`Move ${shelf.name} down`}
                  disabled={index === pantry.shelves.length - 1}
                  onClick={() => moveShelf(shelf.id, 1)}
                >
                  <Icon name="down" size={17} />
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <button
        className="btn btn-ghost block"
        style={{ marginTop: 12 }}
        onClick={() => nav.editShelf()}
      >
        <Icon name="plus" size={18} />
        Add a shelf
      </button>
    </>
  );
}

// ---------- settings -------------------------------------------------------

export function SettingsScreen() {
  const { pantry, clearAll } = usePantry();
  const nav = useNav();

  return (
    <>
      <header className="home-head" style={{ marginBottom: 18 }}>
        <p className="eyebrow">Housekeeping</p>
        <h1 className="display">The study</h1>
      </header>

      <div className="stack">
        <button className="setting-row" onClick={() => nav.go({ name: "shelves" })}>
          <span className="setting-ico">
            <Icon name="shelf" size={19} />
          </span>
          <span className="setting-main">
            <b>Shelves</b>
            <span>{plural(pantry.shelves.length, "shelf", "shelves")} · rename, reorder, remove</span>
          </span>
          <Icon name="right" size={18} className="chev" />
        </button>

        <button className="setting-row" onClick={() => nav.setModal({ kind: "backup", mode: "export" })}>
          <span className="setting-ico olive">
            <Icon name="export" size={19} />
          </span>
          <span className="setting-main">
            <b>Copy a backup</b>
            <span>Everything as plain text, ready to paste somewhere safe</span>
          </span>
          <Icon name="right" size={18} className="chev" />
        </button>

        <button className="setting-row" onClick={() => nav.setModal({ kind: "backup", mode: "import" })}>
          <span className="setting-ico olive">
            <Icon name="import" size={19} />
          </span>
          <span className="setting-main">
            <b>Restore a backup</b>
            <span>Replace this pantry with an earlier copy</span>
          </span>
          <Icon name="right" size={18} className="chev" />
        </button>

        <button
          className="setting-row"
          onClick={() =>
            nav.setModal({
              kind: "confirm",
              title: "Empty the pantry?",
              body: "Every item will be crossed off. Shelves stay exactly as they are.",
              label: "Empty it",
              action: () => {
                clearAll();
                nav.toast("Pantry emptied");
              },
            })
          }
        >
          <span className="setting-ico" style={{ background: "#f3ded8", color: "var(--danger)" }}>
            <Icon name="trash" size={19} />
          </span>
          <span className="setting-main">
            <b>Empty the pantry</b>
            <span>Remove every item, keep the shelves</span>
          </span>
          <Icon name="right" size={18} className="chev" />
        </button>
      </div>

      <div className="about-card">
        <Mark size={44} />
        <h3>Poirot</h3>
        <p className="tag">Every jar accounted for.</p>
        <p className="hint" style={{ margin: "0 auto", maxWidth: "30ch" }}>
          A quiet little ledger for the kitchen. No accounts, no sync, no nonsense. Your pantry
          lives on this device and nowhere else.
        </p>
        <p className="fine">Version {VERSION} · made for the shelves at home</p>
      </div>
    </>
  );
}

export function formatAmount(item: Item) {
  return formatQty(item.qty, item.unit);
}
