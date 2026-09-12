import { useCallback, useEffect, useState } from 'react';

/** Runs `loader` and tracks status/data/error for a page. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  const run = useCallback(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });

    Promise.resolve()
      .then(loader)
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', data: null, error });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { ...state, retry: run };
}
