# Palette's Journal

## 2024-02-20 - Initial Setup
**Learning:** UX improvements often hide in plain sight, like table headers that mouse users take for granted but keyboard users can't access.
**Action:** Always check interactive elements for keyboard accessibility (tabindex, key handlers, or native interactive elements).

## 2024-02-20 - Accessible Expandable Content
**Learning:** Simply using `focus:outline-none` on buttons creates a hostile experience for keyboard users.
**Action:** Always replace removed outlines with `focus-visible` ring utilities and ensure `aria-expanded` and `aria-controls` are present on expandable triggers.
