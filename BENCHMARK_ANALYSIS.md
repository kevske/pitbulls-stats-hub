# Performance Analysis: PlayerCard Resize Listeners

## Issue Description
The `PlayerCard` component currently attaches a `resize` event listener to the global `window` object for each instance of the component to check for text overflow in the bio section.

```typescript
useEffect(() => {
  const checkOverflow = () => {
    if (bioRef.current) {
      setShowExpandButton(bioRef.current.scrollHeight > bioRef.current.clientHeight);
    }
  };

  checkOverflow();
  window.addEventListener('resize', checkOverflow);
  return () => window.removeEventListener('resize', checkOverflow);
}, [player.bio]);
```

## Complexity Analysis

### Current Implementation
- **Complexity**: O(N) where N is the number of `PlayerCard` components rendered.
- **Behavior**: On *every* window resize event (which can fire many times per second during a drag), *every* `PlayerCard` executes `checkOverflow`.
- **Cost**:
  - `checkOverflow` accesses `scrollHeight` and `clientHeight`. Reading these properties forces the browser to perform a synchronous reflow (layout calculation) if the layout is dirty.
  - Doing this N times in a loop (triggered by the event loop for each listener) can cause "Layout Thrashing" if there are interleaved writes, though here it's mostly reads. However, the sheer volume of callbacks can block the main thread.

### Optimized Implementation (ResizeObserver)
- **Complexity**: O(N) observers, but optimized by the browser engine.
- **Behavior**: `ResizeObserver` callbacks are fired only when the *observed element's* size changes.
  - The browser collects all resize events and dispatches them efficiently, often in a single batch per frame (at the end of the layout phase).
  - It avoids the "event spam" of `window.resize` which fires for any window dimension change, even if it doesn't affect the specific element's layout (though often it does).
  - More importantly, it handles cases where the element resizes due to *other* reasons than window resize (e.g. dynamic content changes elsewhere in the DOM), which the original code missed.

## Measurement Plan (Theoretical)

To measure this effectively in a browser environment:

1.  **Setup**: Render a page with 100 `PlayerCard` components.
2.  **Benchmark**:
    - Record a Performance Profile in Chrome DevTools.
    - Resize the window continuously for 5 seconds.
3.  **Metrics to Watch**:
    - **Scripting Time**: Total time spent in JS handlers.
    - **Layout / Reflow**: Number of forced reflows.
    - **Frame Rate (FPS)**: Drops in FPS during resize.

### Expected Results
- **Baseline**: High scripting time due to 100 separate event handlers firing repeatedly. Potential forced reflows if the browser doesn't optimize the reads.
- **Optimization**: significantly lower scripting time. The `ResizeObserver` callback should only run when necessary and is batched.

## Conclusion
Replacing `window.addEventListener` with `ResizeObserver` reduces the overhead of global event listeners and leverages the browser's native optimization for layout observation, resulting in smoother resizing and better UI responsiveness, especially on pages with many players.
