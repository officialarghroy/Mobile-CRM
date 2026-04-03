/**
 * Users list uses one <table> with table-fixed + colgroup so every row shares the same column
 * widths. Per-row CSS grids with `auto` for the role column made that column’s width depend on
 * each row’s text (e.g. Content_writer vs Admin), which changed the fr tracks row-to-row and
 * shifted where the email column started.
 */
export const usersTableClassName =
  "w-full min-w-[17.75rem] border-collapse text-sm text-[var(--text-primary)] table-fixed sm:min-w-0";

/** Email cells: stable left inset; no grid-only utilities. */
export const usersTableEmailColumnClass =
  "min-w-0 overflow-x-clip text-left align-top [text-align:left] pl-8 pr-3 sm:pl-10 sm:pr-4 [direction:ltr] [unicode-bidi:isolate]";
