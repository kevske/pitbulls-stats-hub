## 2024-05-22 - PlayerCard Re-rendering
**Learning:** The `Players` page re-renders the entire list on every search keystroke. Since `PlayerCard` contains expensive logic (`ResizeObserver` and trend calculations), this causes significant performance overhead.
**Action:** Use `React.memo` for list items that depend on stable context data but are filtered in the parent.
