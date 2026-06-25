import { useEffect, useState } from 'react';

export function useMapImage(src) {
  const [state, setState] = useState({
    image: null,
    ready: false,
    error: false,
  });

  useEffect(() => {
    if (!src) {
      setState({ image: null, ready: false, error: false });
      return undefined;
    }

    let cancelled = false;

    const image = new Image();
    image.src = src;

    image.onload = () => {
      if (!cancelled) {
        setState({ image, ready: true, error: false });
      }
    };

    image.onerror = () => {
      if (!cancelled) {
        setState({ image: null, ready: false, error: true });
      }
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return state;
}