/**
 * Mappls Maps SDK Loader
 *
 * Dynamically loads the Mappls Maps JavaScript SDK exactly once.
 * Resolves with `window.mappls` when the SDK is ready.
 * Rejects with an error if the script fails to load.
 *
 * API key is read from import.meta.env.VITE_MAPPLS_API_KEY (Vite env).
 */

let loadPromise = null;

export const loadMappls = () => {
  // Return the existing promise if already loading / loaded
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // If the SDK is already on the page, resolve immediately
    if (window.mappls) {
      resolve(window.mappls);
      return;
    }

    const apiKey = import.meta.env.VITE_MAPPLS_API_KEY;
    if (!apiKey) {
      reject(new Error('VITE_MAPPLS_API_KEY is not set in the environment.'));
      loadPromise = null; // allow retry after env is fixed
      return;
    }

    const script = document.createElement('script');
    script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.mappls) {
        console.info('[MapplsLoader] SDK loaded successfully.');
        resolve(window.mappls);
      } else {
        const err = new Error('Mappls SDK script loaded but window.mappls is not available.');
        console.error('[MapplsLoader]', err.message);
        reject(err);
        loadPromise = null;
      }
    };

    script.onerror = () => {
      const err = new Error('Failed to load Mappls SDK script. Check network and API key.');
      console.error('[MapplsLoader]', err.message);
      reject(err);
      loadPromise = null; // allow retry
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};
