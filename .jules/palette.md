# Palette's Journal

## 2024-02-20 - Initial Setup
**Learning:** UX improvements often hide in plain sight, like table headers that mouse users take for granted but keyboard users can't access.
**Action:** Always check interactive elements for keyboard accessibility (tabindex, key handlers, or native interactive elements).

## 2024-02-20 - Accessible Expandable Content
**Learning:** Simply using `focus:outline-none` on buttons creates a hostile experience for keyboard users.
**Action:** Always replace removed outlines with `focus-visible` ring utilities and ensure `aria-expanded` and `aria-controls` are present on expandable triggers.

## 2026-01-24 - Keyboard Accessible Cards
**Learning:** `div` elements with `onClick` are invisible to keyboard users. Simply adding `role="button"` isn't enough; they need `tabIndex` and `onKeyDown` (Enter/Space) handlers.
**Action:** When making cards clickable, always implement full button semantics and keyboard handlers, ensuring `focus-visible` styles are present.

## 2026-01-24 - Mobile Data Entry UX
**Learning:** `inputMode="numeric"` triggers the best keyboard for data entry on mobile, but `pattern` validation applies to the formatted *value* (e.g. "20:30"), not just the keystrokes.
**Action:** Use `inputMode="numeric"` for digit-heavy inputs, add `onFocus={(e) => e.target.select()}` for quick editing, and ensure `pattern` regex accounts for formatting characters like separators.

## 2026-03-01 - Empty States UX
**Learning:** Returning `null` or an empty `div` for filtered lists leaves users confused about whether the app is broken or just empty.
**Action:** Always provide an explicit "Empty State" component with an icon and helpful text that suggests how to recover (e.g., "Adjust filters").
