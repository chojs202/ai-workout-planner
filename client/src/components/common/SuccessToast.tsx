import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import { useTranslation } from "../../hooks/useTranslation";
import {
  dismissSuccessToast,
  getSuccessToast,
  pauseSuccessToast,
  resumeSuccessToast,
  subscribeSuccessToast,
} from "../../utils/successToast";

const enter = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Region = styled.div<{ $hasBottomNav: boolean }>`
  position: fixed;
  right: 0;
  bottom: ${({ $hasBottomNav }) =>
    $hasBottomNav
      ? "calc(104px + env(safe-area-inset-bottom, 0px))"
      : "calc(20px + env(safe-area-inset-bottom, 0px))"};
  left: 0;
  z-index: 200;
  width: calc(100% - 32px);
  max-width: calc(var(--app-max-width) - 32px);
  margin: 0 auto;
  pointer-events: none;
`;

const Toast = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 6px 8px 6px 14px;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid rgb(121 226 190 / 35%);
  border-radius: var(--radius-control);
  box-shadow: 0 8px 28px rgb(0 0 0 / 30%);
  pointer-events: auto;
  animation: ${enter} 0.18s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Icon = styled.svg`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  color: var(--color-primary);
`;

const Message = styled.p`
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const CloseButton = styled.button`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  color: var(--color-text-muted);
  border-radius: 8px;

  &:hover {
    color: var(--color-text);
    background: rgb(255 255 255 / 5%);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
`;

interface SuccessToastProps {
  hasBottomNav?: boolean;
}

function SuccessToast({ hasBottomNav = false }: SuccessToastProps) {
  const { language } = useTranslation();
  const toast = useSyncExternalStore(
    subscribeSuccessToast,
    getSuccessToast,
    () => null,
  );
  const copy = {
    ko: { saved: "저장되었습니다.", close: "알림 닫기" },
    ja: { saved: "保存しました。", close: "通知を閉じる" },
    en: { saved: "Saved successfully.", close: "Dismiss notification" },
  }[language];

  return createPortal(
    <Region
      $hasBottomNav={hasBottomNav}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {toast && (
        <Toast
          key={toast.id}
          onPointerEnter={() => pauseSuccessToast(toast.id)}
          onPointerLeave={(event) => {
            if (!event.currentTarget.contains(document.activeElement)) {
              resumeSuccessToast(toast.id);
            }
          }}
          onFocusCapture={() => pauseSuccessToast(toast.id)}
          onBlurCapture={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget) &&
              !event.currentTarget.matches(":hover")
            ) {
              resumeSuccessToast(toast.id);
            }
          }}
        >
          <Icon
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 3 3 5-6" />
          </Icon>
          <Message>{copy.saved}</Message>
          <CloseButton
            type="button"
            aria-label={copy.close}
            onClick={() => dismissSuccessToast(toast.id)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </CloseButton>
        </Toast>
      )}
    </Region>,
    document.body,
  );
}

export default SuccessToast;
