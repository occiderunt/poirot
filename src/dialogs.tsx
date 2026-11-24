import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";
import { useNav, usePantry } from "./ctx";
import {
  CATEGORIES,
  ICON_KEYS,
  SHELF_COLORS,
  UNITS,
  categoryOf,
  expiryLabel,
  expiryState,
  formatQty,
  parseImport,
  plural,
  unitLabel,
  type CategoryId,
  type IconKey,
} from "./store";

// ---------- shell -----------------------------------------------------------

export function Sheet({
  title,
  onClose,
  children,
  footer,
  right,
  tall = true,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  right?: ReactNode;
  tall?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`sheet ${tall ? "tall" : ""}`} role="dialog" aria-modal="true">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <button className="iconbtn" aria-label="Close" onClick={onClose}>
            <Icon name="down" size={20} />
          </button>
          <h2>{title ?? ""}</h2>
          <span className="side">{right}</span>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- item editor -----------------------------------------------------

export function ItemEditor({ itemId, shelfId }: { itemId?: string; shelfId: string }) {
  const api = usePantry();
  const nav = useNav();
  const existing = itemId ? api.pantry.items.find((i) => i.id === itemId) : undefined;
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(existing?.name ?? "");
  const [qty, setQty] = useState(existing ? String(existing.qty) : "1");
  const [unit, setUnit] = useState(existing?.unit ?? "pcs");
  const [shelf, setShelf] = useState(existing?.shelfId ?? shelfId ?? api.pantry.shelves[0]?.id ?? "");
  const [category, setCategory] = useState<CategoryId>(existing?.category ?? "pantry");
  const [expiry, setExpiry] = useState(existing?.expiry ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [lowAt, setLowAt] = useState(existing ? String(existing.lowAt) : "1");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!itemId) nameRef.current?.focus();
  }, [itemId]);

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    const out: { name: string; category: CategoryId; unit: string }[] = [];
    for (const item of api.pantry.items) {
      const key = item.name.toLowerCase();
      if (seen.has(key) || key === q || !key.includes(q)) continue;
      seen.add(key);
      out.push({ name: item.name, category: item.category, unit: item.unit });
      if (out.length === 4) break;
    }
    return out;
  }, [api.pantry.items, name]);

  const shelfName = api.pantry.shelves.find((s) => s.id === shelf)?.name ?? "the pantry";

  const bump = (dir: 1 | -1) => {
    const current = Number(qty) || 0;
    const next = Math.max(0, Math.round((current + dir) * 100) / 100);
    setQty(String(next));
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give it a name first.");
      return;
    }
    const qtyNum = Math.max(0, Number(qty) || 0);
    const lowNum = Math.max(0, Number(lowAt) || 0);
    const payload = {
      name: trimmed,
      qty: qtyNum,
      unit,
      shelfId: shelf,
      category,
      expiry,
      notes: notes.trim(),
      lowAt: lowNum,
    };
    if (existing) {
      api.updateItem(existing.id, payload);
      nav.toast("Saved");
    } else {
      api.addItem(payload);
      nav.toast(`Filed in ${shelfName}`);
    }
    nav.setModal(null);
  };

  return (
    <Sheet
      title={existing ? "Edit item" : "New item"}
      onClose={() => nav.setModal(null)}
      footer={
        <button className="btn btn-primary block" onClick={save}>
          <Icon name="check" size={19} />
          {existing ? "Save changes" : "Add to the pantry"}
        </button>
      }
    >
      <div className="field">
        <label htmlFor="item-name">What is it?</label>
        <input
          id="item-name"
          ref={nameRef}
          className="input big"
          value={name}
          placeholder="What is it?"
          autoComplete="off"
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
        />
        {error && (
          <p className="hint" style={{ color: "var(--danger)", fontWeight: 700 }}>
            {error}
          </p>
        )}
        {suggestions.length > 0 && (
          <div className="pick-row" style={{ marginTop: 8 }}>
            {suggestions.map((s) => (
              <button
                key={s.name}
                className="pick"
                onClick={() => {
                  setName(s.name);
                  setCategory(s.category);
                  setUnit(s.unit);
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <span className="field-label">How much?</span>
        <div className="amount-row">
          <div className="stepper">
            <button className="stepbtn" aria-label="One fewer" onClick={() => bump(-1)}>
              <Icon name="minus" size={18} />
            </button>
            <input
              value={qty}
              inputMode="decimal"
              aria-label="Amount"
              onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))}
              onBlur={() => {
                if (!qty || Number.isNaN(Number(qty))) setQty("0");
              }}
            />
            <button className="stepbtn" aria-label="One more" onClick={() => bump(1)}>
              <Icon name="plus" size={18} />
            </button>
          </div>
          <select
            className="input"
            style={{ maxWidth: 118 }}
            value={unit}
            aria-label="Unit"
            onChange={(e) => setUnit(e.target.value)}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u === "l" ? "L" : u === "pcs" ? "pieces" : u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Which shelf?</span>
        <div className="pick-row">
          {api.pantry.shelves.map((s) => (
            <button
              key={s.id}
              className={`pick ${shelf === s.id ? "on" : ""}`}
              onClick={() => setShelf(s.id)}
            >
              <span className="dot" style={{ background: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="two-col">
        <div className="field">
          <label htmlFor="item-expiry">Best before</label>
          <input
            id="item-expiry"
            className="input"
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
          {expiry && (
            <button
              className="linkbtn"
              style={{ marginTop: 4, color: "var(--muted)" }}
              onClick={() => setExpiry("")}
            >
              Clear date
            </button>
          )}
        </div>
        <div className="field">
          <label htmlFor="item-low">Runs low at</label>
          <input
            id="item-low"
            className="input"
            type="number"
            inputMode="decimal"
            min={0}
            value={lowAt}
            onChange={(e) => setLowAt(e.target.value)}
          />
          <p className="hint">A nudge when ≤ {formatQty(Number(lowAt) || 0, unit)}</p>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Sort of thing</span>
        <div className="pick-row">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`pick ${category === c.id ? "on" : ""}`}
              onClick={() => setCategory(c.id)}
            >
              <span className="dot" style={{ background: c.color }} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="item-notes">A note for later</label>
        <textarea
          id="item-notes"
          className="input"
          placeholder="Anything worth remembering?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Sheet>
  );
}

// ---------- item detail -----------------------------------------------------

export function ItemSheet({ itemId }: { itemId: string }) {
  const api = usePantry();
  const nav = useNav();
  const item = api.pantry.items.find((i) => i.id === itemId);
  const [moving, setMoving] = useState(false);

  if (!item) {
    return (
      <Sheet title="Gone" onClose={() => nav.setModal(null)} tall={false}>
        <p className="lede">That item is no longer in the pantry.</p>
      </Sheet>
    );
  }

  const shelf = api.shelfById(item.shelfId);
  const cat = categoryOf(item.category);
  const state = expiryState(item.expiry);
  const low = item.qty <= item.lowAt;

  const setQty = (next: number) =>
    api.updateItem(item.id, { qty: Math.max(0, Math.round(next * 100) / 100) });

  return (
    <Sheet
      onClose={() => nav.setModal(null)}
      tall={false}
      right={
        <button className="iconbtn" aria-label="Edit item" onClick={() => nav.editItem(item.id)}>
          <Icon name="pencil" size={19} />
        </button>
      }
      footer={
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={() => nav.editItem(item.id)}>
            <Icon name="pencil" size={17} />
            Edit
          </button>
          <button
            className="btn btn-danger"
            onClick={() =>
              nav.setModal({
                kind: "confirm",
                title: `Cross off ${item.name}?`,
                body: "The item leaves the ledger for good.",
                label: "Cross it off",
                action: () => {
                  api.removeItem(item.id);
                  nav.toast("Crossed off");
                },
              })
            }
          >
            <Icon name="trash" size={17} />
            Remove
          </button>
        </div>
      }
    >
      <h1 className="detail-name">{item.name}</h1>
      <div className="detail-where">
        <span className="cat-dot" style={{ ["--cat" as string]: cat.color }} />
        <span>
          {shelf?.name ?? "Unknown shelf"} · {cat.label}
        </span>
      </div>

      <div className="big-amount">
        <button
          className="bigbtn"
          aria-label="Use one"
          onClick={() => setQty(item.qty - 1)}
          disabled={item.qty <= 0}
        >
          <Icon name="minus" size={24} />
        </button>
        <div className="amountnum">
          <b>{Number.isInteger(item.qty) ? item.qty : Math.round(item.qty * 100) / 100}</b>
          <span>{item.unit === "pcs" ? "in the pantry" : unitLabel(item.unit, item.qty)}</span>
        </div>
        <button className="bigbtn plus" aria-label="Add one" onClick={() => setQty(item.qty + 1)}>
          <Icon name="plus" size={24} />
        </button>
      </div>

      {item.qty <= 0 && (
        <p className="hint" style={{ textAlign: "center", color: "var(--danger)", fontWeight: 700 }}>
          This one is out. Add one when it comes home.
        </p>
      )}
      {item.qty > 0 && low && (
        <p className="hint" style={{ textAlign: "center", color: "var(--gold)", fontWeight: 700 }}>
          Running low. Worth a top-up.
        </p>
      )}

      <div className="meta-block">
        <div className="meta-row">
          <span className="k">Shelf</span>
          <span className="v" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ flex: 1 }}>{shelf?.name ?? "Unknown"}</span>
            <button className="linkbtn" onClick={() => setMoving((m) => !m)}>
              {moving ? "Cancel" : "Move"}
            </button>
          </span>
        </div>
        {moving && (
          <div className="pick-row" style={{ padding: "0 0 12px" }}>
            {api.pantry.shelves.map((s) => (
              <button
                key={s.id}
                className={`pick ${s.id === item.shelfId ? "on" : ""}`}
                onClick={() => {
                  api.moveItem(item.id, s.id);
                  setMoving(false);
                  nav.toast(`Moved to ${s.name}`);
                }}
              >
                <span className="dot" style={{ background: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
        )}
        <div className="meta-row">
          <span className="k">Best before</span>
          <span className={`v ${state === "soon" ? "soon" : state === "expired" ? "expired" : ""}`}>
            {item.expiry ? (
              <>
                {expiryLabel(item.expiry)}
                {state === "soon" || state === "expired" ? (
                  <small>
                    {" "}
                    ·{" "}
                    {new Date(`${item.expiry}T12:00:00`).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </small>
                ) : null}
              </>
            ) : (
              <small>No date noted</small>
            )}
          </span>
        </div>
        <div className="meta-row">
          <span className="k">Runs low at</span>
          <span className="v">{formatQty(item.lowAt, item.unit)}</span>
        </div>
        <div className="meta-row">
          <span className="k">Filed</span>
          <span className="v">
            <small>
              {new Date(item.addedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </small>
          </span>
        </div>
      </div>

      {item.notes && <p className="note-line">“{item.notes}”</p>}
    </Sheet>
  );
}

// ---------- shelf editor ----------------------------------------------------

export function ShelfEditor({ shelfId }: { shelfId?: string }) {
  const api = usePantry();
  const nav = useNav();
  const existing = shelfId ? api.shelfById(shelfId) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [icon, setIcon] = useState<IconKey>(existing?.icon ?? "shelf");
  const [color, setColor] = useState(
    existing?.color ?? SHELF_COLORS[api.pantry.shelves.length % SHELF_COLORS.length],
  );
  const [error, setError] = useState("");
  const count = existing ? api.pantry.items.filter((i) => i.shelfId === existing.id).length : 0;

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("A shelf needs a name.");
      return;
    }
    if (existing) {
      api.updateShelf(existing.id, { name: trimmed, icon, color });
      nav.toast("Shelf saved");
    } else {
      api.addShelf({ name: trimmed, icon, color });
      nav.toast("Shelf added");
    }
    nav.setModal(null);
  };

  return (
    <Sheet
      title={existing ? "Edit shelf" : "New shelf"}
      onClose={() => nav.setModal(null)}
      footer={
        <button className="btn btn-primary block" onClick={save}>
          <Icon name="check" size={19} />
          {existing ? "Save shelf" : "Add shelf"}
        </button>
      }
    >
      <div className="field">
        <label htmlFor="shelf-name">What do you call it?</label>
        <input
          id="shelf-name"
          className="input big"
          value={name}
          placeholder="e.g. Left Pantry"
          autoFocus
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
        />
        {error && (
          <p className="hint" style={{ color: "var(--danger)", fontWeight: 700 }}>
            {error}
          </p>
        )}
        <p className="hint">Left pantry, right pantry, fridge, freezer, spice rack, the drawer by the oven.</p>
      </div>

      <div className="field">
        <span className="field-label">Mark it with</span>
        <div className="icon-grid">
          {ICON_KEYS.map((key) => (
            <button
              key={key}
              className={`icon-pick ${icon === key ? "on" : ""}`}
              style={{ ["--sc" as string]: color }}
              aria-label={key}
              aria-pressed={icon === key}
              onClick={() => setIcon(key)}
            >
              <Icon name={key} size={24} />
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Colour</span>
        <div className="swatches">
          {SHELF_COLORS.map((c) => (
            <button
              key={c}
              className={`swatch ${color === c ? "on" : ""}`}
              style={{ background: c }}
              aria-label={`Colour ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {existing && (
        <button
          className="btn btn-danger block"
          style={{ marginTop: 8 }}
          onClick={() =>
            nav.setModal({
              kind: "confirm",
              title: `Remove ${existing.name}?`,
              body:
                count > 0
                  ? `${plural(count, "item")} will be removed along with the shelf.`
                  : "The shelf is empty. It will simply go.",
              label: "Remove shelf",
              action: () => {
                api.removeShelf(existing.id);
                nav.toast("Shelf removed");
              },
            })
          }
        >
          <Icon name="trash" size={18} />
          Remove this shelf
        </button>
      )}
    </Sheet>
  );
}

// ---------- confirm ---------------------------------------------------------

export function ConfirmDialog({
  title,
  body,
  label,
  action,
}: {
  title: string;
  body: string;
  label: string;
  action: () => void;
}) {
  const nav = useNav();
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) nav.setModal(null);
      }}
    >
      <div className="sheet" role="alertdialog" aria-modal="true" style={{ maxHeight: "auto" }}>
        <div className="sheet-grip" />
        <div className="sheet-body" style={{ paddingTop: 26 }}>
          <h1 className="detail-name" style={{ fontSize: 26 }}>
            {title}
          </h1>
          <p className="lede" style={{ marginBottom: 18 }}>
            {body}
          </p>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => nav.setModal(null)}>
              Keep it
            </button>
            <button
              className="btn"
              style={{ background: "var(--danger)", color: "#fff6e9", borderColor: "#7e2a21" }}
              onClick={() => {
                action();
                nav.setModal(null);
              }}
            >
              {label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- backup ----------------------------------------------------------

export function BackupDialog({ mode }: { mode: "export" | "import" }) {
  const api = usePantry();
  const nav = useNav();
  const [text, setText] = useState(mode === "import" ? "" : "");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const exported = useMemo(
    () => JSON.stringify({ version: 1, shelves: api.pantry.shelves, items: api.pantry.items }, null, 2),
    [api.pantry],
  );

  const restore = () => {
    try {
      const next = parseImport(text);
      api.replacePantry(next);
      nav.toast("Backup restored");
      nav.setModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that backup.");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exported);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copying was blocked. Select the text and copy it by hand.");
    }
  };

  return (
    <Sheet
      title={mode === "export" ? "Copy a backup" : "Restore a backup"}
      onClose={() => nav.setModal(null)}
      footer={
        mode === "export" ? (
          <button className="btn btn-primary block" onClick={copy}>
            <Icon name="copy" size={18} />
            {copied ? "Copied to the clipboard" : "Copy everything"}
          </button>
        ) : (
          <button className="btn btn-primary block" onClick={restore} disabled={!text.trim()}>
            <Icon name="import" size={18} />
            Replace this pantry
          </button>
        )
      }
    >
      {mode === "export" ? (
        <>
          <p className="hint" style={{ marginTop: 0, marginBottom: 10 }}>
            {plural(api.pantry.items.length, "item")} on{" "}
            {plural(api.pantry.shelves.length, "shelf", "shelves")}. Paste this into a note, an
            email to yourself, anywhere safe.
          </p>
          <textarea
            className="code-box"
            readOnly
            value={exported}
            onFocus={(e) => e.currentTarget.select()}
          />
        </>
      ) : (
        <>
          <p className="hint" style={{ marginTop: 0, marginBottom: 10 }}>
            This replaces every shelf and item with the backup. Paste the text below.
          </p>
          <textarea
            className="code-box"
            placeholder='{ "version": 1, "shelves": [ ... ] }'
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
          />
        </>
      )}
      {error && (
        <p className="hint" style={{ color: "var(--danger)", fontWeight: 700 }}>
          {error}
        </p>
      )}
    </Sheet>
  );
}
