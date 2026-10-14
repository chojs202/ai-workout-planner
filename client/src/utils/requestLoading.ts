const LOADING_DELAY_MS = 200;

let pendingCount = 0;
let isVisible = false;
let showTimer: ReturnType<typeof setTimeout> | undefined;

const listeners = new Set<() => void>();

function setVisible(value: boolean): void {
  if (isVisible === value) {
    return;
  }

  isVisible = value;

  listeners.forEach((listener) => {
    listener();
  });
}

export function subscribeRequestLoading(
  listener: () => void,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getRequestLoading(): boolean {
  return isVisible;
}

export function beginRequestLoading(): () => void {
  pendingCount += 1;

  if (pendingCount === 1 && !isVisible) {
    showTimer = setTimeout(() => {
      showTimer = undefined;

      if (pendingCount > 0) {
        setVisible(true);
      }
    }, LOADING_DELAY_MS);
  }

  let finished = false;

  return () => {
    if (finished) {
      return;
    }

    finished = true;
    pendingCount -= 1;

    if (pendingCount === 0) {
      if (showTimer !== undefined) {
        clearTimeout(showTimer);
        showTimer = undefined;
      }

      setVisible(false);
    }
  };
}