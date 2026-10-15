const SHOW_DELAY_MS = 200;

let pendingCount = 0;
let isVisible = false;

let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideFrame: number | undefined;
let finalHideFrame: number | undefined;

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

function cancelHide(): void {
  if (hideFrame !== undefined) {
    cancelAnimationFrame(hideFrame);
    hideFrame = undefined;
  }

  if (finalHideFrame !== undefined) {
    cancelAnimationFrame(finalHideFrame);
    finalHideFrame = undefined;
  }
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

export function beginRequestLoading(
  options: { immediate?: boolean } = {},
): () => void {
  pendingCount += 1;
  cancelHide();

  if (options.immediate) {
    if (showTimer !== undefined) {
      clearTimeout(showTimer);
      showTimer = undefined;
    }

    setVisible(true);
  } else if (!isVisible && showTimer === undefined) {
    showTimer = setTimeout(() => {
      showTimer = undefined;

      if (pendingCount > 0) {
        setVisible(true);
      }
    }, SHOW_DELAY_MS);
  }

  let finished = false;

  return () => {
    if (finished) {
      return;
    }

    finished = true;
    pendingCount -= 1;

    if (pendingCount !== 0) {
      return;
    }

    if (showTimer !== undefined) {
      clearTimeout(showTimer);
      showTimer = undefined;
    }

    if (!isVisible) {
      return;
    }

    cancelHide();

    hideFrame = requestAnimationFrame(() => {
      hideFrame = undefined;

      finalHideFrame = requestAnimationFrame(() => {
        finalHideFrame = undefined;

        if (pendingCount === 0) {
          setVisible(false);
        }
      });
    });
  };
}