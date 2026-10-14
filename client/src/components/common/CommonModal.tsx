import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

const Dialog = styled.dialog`
  position: fixed;
  inset: 0;

  width: min(380px, calc(100% - 32px));
  max-width: calc(100% - 32px);
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  margin: auto;
  padding: var(--card-padding);
  overflow-y: auto;
  overscroll-behavior: contain;

  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: 0 20px 60px rgb(0 0 0 / 35%);

  &::backdrop {
    background: rgb(0 0 0 / 65%);
  }
`;

const Title = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const Description = styled.div`
  margin-top: 12px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.7;
  white-space: pre-line;
  overflow-wrap: anywhere;
`;

const Content = styled.div`
  margin-top: 16px;
`;

const ErrorMessage = styled.p`
  margin-top: 16px;
  padding: 12px;
  color: var(--color-error);
  background: rgb(255 133 133 / 8%);
  border: 1px solid rgb(255 133 133 / 25%);
  border-radius: var(--radius-control);
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

export const ModalActions = styled.div<{
  $stacked?: boolean;
}>`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 24px;

  > button {
    height: 100%;
  }

  > button:only-child {
    grid-column: 1 / -1;
  }

  ${({ $stacked }) =>
    $stacked &&
    `
    > button:first-child {
      grid-column: 1 / -1;
    }

    > button:nth-child(2):last-child {
      grid-column: 1 / -1;
    }
  `}
`;

export const ModalButton = styled.button<{
  $tone?: "neutral" | "primary" | "danger";
}>`
  display: flex;
  align-items: center;
  justify-content: center;

  min-width: 0;
  min-height: var(--control-min-height);
  padding: 10px 12px;

  color: ${({ $tone }) =>
    $tone === "primary"
      ? "var(--color-on-primary)"
      : $tone === "danger"
        ? "var(--color-error)"
        : "var(--color-text)"};
  background: ${({ $tone }) =>
    $tone === "primary"
      ? "var(--color-primary)"
      : $tone === "danger"
        ? "rgb(255 133 133 / 10%)"
        : "var(--color-input)"};
  border: 1px solid
    ${({ $tone }) =>
      $tone === "primary"
        ? "var(--color-primary)"
        : $tone === "danger"
          ? "rgb(255 133 133 / 40%)"
          : "var(--color-border)"};
  border-radius: var(--radius-control);

  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  text-align: center;
  overflow-wrap: anywhere;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ $tone }) =>
      $tone === "primary"
        ? "var(--color-primary-hover)"
        : $tone === "danger"
          ? "rgb(255 133 133 / 18%)"
          : "rgb(255 255 255 / 5%)"};
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface CommonModalProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
  error?: string;
  isBusy?: boolean;
  onClose: () => void;
}

// Render this component only while the modal is open.
function CommonModal({
  title,
  description,
  children,
  actions,
  error,
  isBusy = false,
  onClose,
}: CommonModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef(document.activeElement);
  const latestProps = useRef({ isBusy, onClose });
  latestProps.current = { isBusy, onClose };
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = returnFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  function requestClose(): void {
    if (!latestProps.current.isBusy) {
      latestProps.current.onClose();
    }
  }

  return createPortal(
    <Dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-modal="true"
      aria-busy={isBusy}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        ) {
          requestClose();
        }
      }}
    >
      <Title id={titleId}>{title}</Title>
      {description && (
        <Description id={descriptionId}>{description}</Description>
      )}
      {children && <Content>{children}</Content>}
      {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
      {actions}
    </Dialog>,
    document.body,
  );
}

export default CommonModal;
