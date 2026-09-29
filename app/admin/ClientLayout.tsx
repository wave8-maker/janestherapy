import type { SVGProps } from "react";
import styles from "./client-layout.module.css";

export { styles };
export function ClientIcon({
  kind,
  ...props
}: SVGProps<SVGSVGElement> & {
  kind: "document" | "records" | "edit" | "refresh" | "plus" | "check";
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {kind === "document" && (
        <>
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <path d="M14 3v6h6M8 13h8M8 17h5" />
        </>
      )}
      {kind === "records" && (
        <>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3M4 8c0 1.7 3.6 3 8 3s8-1.3 8-3" />
        </>
      )}
      {kind === "edit" && (
        <>
          <path d="m16 3 5 5-12 12-6 1 1-6zM13 6l5 5M4 15l5 5" />
        </>
      )}
      {kind === "refresh" && (
        <>
          <path d="M20 7a8 8 0 0 0-14-2L3 8m0-5v5h5M4 17a8 8 0 0 0 14 2l3-3m0 5v-5h-5" />
        </>
      )}
      {kind === "plus" && <path d="M12 4v16M4 12h16" />}
      {kind === "check" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </>
      )}
    </svg>
  );
}
