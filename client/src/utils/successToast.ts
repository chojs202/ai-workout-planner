interface SuccessToastState {
  id: number;
}

let nextId = 0;
let currentToast: SuccessToastState | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const durationMs = 4000;

function clearTimer(): void {
  if (timer !== undefined) {
    clearTimeout(timer);
    timer = undefined;
  }
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeSuccessToast(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSuccessToast(): SuccessToastState | null {
  return currentToast;
}

export function dismissSuccessToast(id: number): void {
  if (currentToast?.id !== id) return;
  clearTimer();
  currentToast = null;
  notify();
}

export function pauseSuccessToast(id: number): void {
  if (currentToast?.id === id) clearTimer();
}

export function resumeSuccessToast(id: number): void {
  if (currentToast?.id !== id) return;
  clearTimer();
  timer = setTimeout(() => dismissSuccessToast(id), durationMs);
}

export function showSuccessToast(): void {
  clearTimer();
  const toast = { id: ++nextId };
  currentToast = toast;
  notify();
  resumeSuccessToast(toast.id);
}
