## 2024-05-22 - PlayerCard Re-rendering
**Learning:** The `Players` page re-renders the entire list on every search keystroke. Since `PlayerCard` contains expensive logic (`ResizeObserver` and trend calculations), this causes significant performance overhead.
**Action:** Use `React.memo` for list items that depend on stable context data but are filtered in the parent.

## 2024-05-22 - StatsTable Rendering
**Learning:** `StatsTable` was recalculating sorted/filtered list on every render, even if triggered by parent updates that didn't change data.
**Action:** Memoize expensive derived state (filtering/sorting) and the component itself.

## 2025-05-22 - Games List Optimization
**Learning:** Filtering and sorting arrays inside a map loop (O(N*M)) kills performance on lists.
**Action:** Pre-compute lookup maps (O(N)) using useMemo before rendering.

## 2026-01-27 - Players List Optimization
**Learning:** `PlayerCard` was filtering the global `gameLogs` array for every player, causing O(N*M) complexity. This mirrors the issue previously found in `Games` list.
**Action:** Always pre-compute data maps (e.g. `playerId -> logs[]`) in the parent component using `useMemo` and pass specific data to list items.

## 2025-05-23 - Data Processing Optimization
**Learning:** `SupabaseStatsService` was performing multiple O(N*M) nested loop joins (Games<->Videos, Games<->Logs) during data fetching, which scales poorly as data grows.
**Action:** Use Hash Maps (O(1) lookup) for all client-side data joining operations immediately after fetching.

## 2025-05-24 - Utility Functions Performance
**Learning:** Utility functions like `getTopTrendingPlayers` might contain hidden O(N*M) loops.
**Action:** Inspect utility functions for performance bottlenecks before using them in critical paths, or refactor them to accept pre-computed maps.
## 2025-05-24 - Video Sync Layout Thrashing
**Learning:** Components synced to video playback (receiving `currentTime` props) can trigger layout thrashing if they query the DOM or scroll on every frame update, even if the visual state hasn't changed.
**Action:** Track the logical position (e.g., active index) in a ref and only trigger DOM updates/scrolling when the logical position actually changes, wrapping the DOM manipulation in `requestAnimationFrame`.
