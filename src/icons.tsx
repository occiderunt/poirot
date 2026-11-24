import type { CSSProperties, ReactNode } from "react";
import type { IconKey } from "./store";

const paths: Record<string, ReactNode> = {
  shelf: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="1.5" />
      <path d="M4 12h16M9.5 7.75h5M9.5 16.25h5" />
    </>
  ),
  fridge: (
    <>
      <rect x="5" y="2.75" width="14" height="18.5" rx="3" />
      <path d="M5 10h14M8 5.75v2M8 12.75v3" />
    </>
  ),
  snowflake: (
    <>
      <path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17" />
      <path d="M9.6 3.6 12 6l2.4-2.4M9.6 20.4 12 18l2.4 2.4M3.2 10.6 6.4 10 5.9 6.8M20.8 13.4 17.6 14l.5 3.2M3.2 13.4l3.2.6-.5 3.2M20.8 10.6 17.6 10l.5-3.2" />
    </>
  ),
  jar: (
    <>
      <path d="M7 8.5h10v10.25A2.25 2.25 0 0 1 14.75 21h-5.5A2.25 2.25 0 0 1 7 18.75Z" />
      <path d="M6 4.75h12V8.5H6zM9 12.5h6M9 15.75h3.5" />
    </>
  ),
  basket: (
    <>
      <path d="M3.25 9.5h17.5l-2 10.25H5.25Z" />
      <path d="M8 9.5 10.25 3.5M16 9.5 13.75 3.5M8.5 13v3.5M12 13v3.5M15.5 13v3.5" />
    </>
  ),
  crate: (
    <>
      <path d="M4 7h16v13.5H4zM4 7l2.5-3.5h11L20 7" />
      <path d="M4 11.5h16M4 16h16M9 3.5v3.5M15 3.5v3.5" />
    </>
  ),
  bottle: (
    <>
      <path d="M10 2.75h4v3.5c0 1.2.6 2 1.5 2.9.9.9 1.5 1.9 1.5 3.35v9.75a1.75 1.75 0 0 1-1.75 1.75h-6.5A1.75 1.75 0 0 1 7 22.25V12.5c0-1.45.6-2.45 1.5-3.35.9-.9 1.5-1.7 1.5-2.9Z" />
      <path d="M7.25 14.5h9.5" />
    </>
  ),
  cheese: (
    <>
      <path d="M3 15.5 12.5 4.75 21 9v9.25a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <circle cx="9" cy="15.5" r="1.35" />
      <circle cx="15" cy="12.75" r="1" />
      <circle cx="16.5" cy="16.75" r="1.1" />
    </>
  ),
  plus: <path d="M12 4.75v14.5M4.75 12h14.5" />,
  minus: <path d="M4.75 12h14.5" />,
  search: (
    <>
      <circle cx="10.75" cy="10.75" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </>
  ),
  back: <path d="M19 12H5M11 18l-6-6 6-6" />,
  right: <path d="m9 5 7 7-7 7" />,
  left: <path d="m15 5-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  pencil: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16Z" />
      <path d="m14.5 5.5 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13.5h9L17.5 7" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </>
  ),
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  shelfPin: <path d="M4 17.5h16M7 17.5V9h10v8.5M10 12h4" />,
  list: (
    <>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" />
      <circle cx="4.25" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="4.25" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="4.25" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 2.75v2.5M12 18.75v2.5M4.5 12H2M22 12h-2.5M5.4 5.4l1.8 1.8M16.8 16.8l1.8 1.8M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.4C10.1 4.9 7.4 4.3 4.2 4.9v13.2c3.2-.6 5.9 0 7.8 1.5 1.9-1.5 4.6-2.1 7.8-1.5V4.9c-3.2-.6-5.9 0-7.8 1.5Z" />
      <path d="M12 6.4v13.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  tag: (
    <>
      <path d="M11 3.5H20.5V13L11.5 22 2 12.5Z" />
      <circle cx="16.25" cy="7.75" r="1.4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 11v5.5M12 7.9v.2" />
    </>
  ),
  export: (
    <>
      <path d="M12 15.5V3.5M7.5 8 12 3.5 16.5 8" />
      <path d="M4 14v5.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V14" />
    </>
  ),
  import: (
    <>
      <path d="M12 3.5v12M7.5 11l4.5 4.5L16.5 11" />
      <path d="M4 14v5.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V14" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M15.5 8.5v-4a1 1 0 0 0-1-1h-10a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4" />
    </>
  ),
  sparkle: (
    <path d="M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5Z" />
  ),
};

export function Icon({
  name,
  size = 22,
  className = "",
  style,
  filled = false,
}: {
  name: IconKey | keyof typeof paths;
  size?: number;
  className?: string;
  style?: CSSProperties;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`icon ${className}`}
      style={style}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] ?? paths.jar}
    </svg>
  );
}

const MOUSTACHE =
  "M21 12c-2 0-3-3-6-3s-3 2-3 2s0-2-3-2s-4 3-6 3c-1 0-2-1-2-1s1 5 5 5c5 0 6-3 6-3s1 3 6 3c4 0 5-5 5-5s-1 1-2 1";

export function Mark({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className="mark">
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="24"
        cy="24"
        r="17.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.45"
      />
      <g transform="translate(24 24) scale(1.28) translate(-12 -13)">
        <path fill="currentColor" d={MOUSTACHE} />
      </g>
    </svg>
  );
}
