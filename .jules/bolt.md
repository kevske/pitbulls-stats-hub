## 2024-05-22 - PlayerCard Re-rendering
**Learning:** The `Players` page re-renders the entire list on every search keystroke. Since `PlayerCard` contains expensive logic (`ResizeObserver` and trend calculations), this causes significant performance overhead.
**Action:** Use `React.memo` for list items that depend on stable context data but are filtered in the parent.

## 2024-05-22 - StatsTable Rendering
**Learning:** `StatsTable` was recalculating sorted/filtered list on every render, even if triggered by parent updates that didn't change data.
**Action:** Memoize expensive derived state (filtering/sorting) and the component itself.

## 2025-05-22 - Games List Optimization
**Learning:** Filtering and sorting arrays inside a map loop (O(N*M)) kills performance on lists.
**Action:** Pre-compute lookup maps (O(N)) using useMemo before rendering.
