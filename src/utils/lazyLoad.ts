import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * A wrapper around React.lazy that automatically reloads the page
 * when a dynamic import fails (e.g., due to a new deployment).
 */
export const lazyLoad = <T extends ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
): LazyExoticComponent<T> => {
    return lazy(() => {
        return importFunc().catch((error) => {
            console.error('Error loading component:', error);

            // Check for common chunk load errors
            const isChunkLoadError =
                error.message?.includes('Failed to fetch dynamically imported module') ||
                error.message?.includes('Importing a module script failed') ||
                error.name === 'ChunkLoadError';

            if (isChunkLoadError) {
                // Prevent infinite reload loops directly
                // We use sessionStorage which survives reloads in the same tab,
                // but it's safer to check if the error persists after reload.
                // A simple strategy is: if we haven't reloaded recently (e.g. last 10 seconds), try reloading.

                const storageKey = 'last_chunk_error_reload';
                const lastReload = sessionStorage.getItem(storageKey);
                const now = Date.now();

                // If we haven't reloaded in the last 10 seconds, try it
                if (!lastReload || (now - parseInt(lastReload)) > 10000) {
                    sessionStorage.setItem(storageKey, String(now));
                    window.location.reload();
                    // Return a never-resolving promise to keep the loading state visible while reloading
                    return new Promise(() => { });
                } else {
                    console.error('Reload loop detected, not reloading.');
                }
            }

            throw error;
        });
    });
};
