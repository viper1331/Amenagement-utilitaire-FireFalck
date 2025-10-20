import { useEffect } from 'react';

export const useServiceWorker = (): void => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => console.error('Service worker registration failed', error));
    }
  }, []);
};
