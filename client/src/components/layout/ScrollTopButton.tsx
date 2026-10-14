import { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "../../hooks/useTranslation";

const Button = styled.button<{
  $hasBottomNav: boolean;
}>`
  position: fixed;
  right: max(
    var(--page-padding),
    calc((100vw - var(--app-max-width)) / 2 + var(--page-padding))
  );
  bottom: ${({ $hasBottomNav }) =>
    $hasBottomNav
      ? "calc(104px + env(safe-area-inset-bottom, 0px))"
      : "calc(20px + env(safe-area-inset-bottom, 0px))"};
  z-index: 110;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;

  width: 48px;
  height: 48px;

  color: var(--color-primary);
  background: rgb(23 27 30 / 45%);
  border: 1px solid rgb(121 226 190 / 18%);
  border-radius: 50%;
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
  backdrop-filter: blur(4px);

  &:hover {
    background: rgb(23 27 30 / 65%);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }
`;

const TopLabel = styled.span`
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
`;

interface ScrollTopButtonProps {
  hasBottomNav?: boolean;
}

function ScrollTopButton({ hasBottomNav = false }: ScrollTopButtonProps) {
  const { language } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  const label = {
    ko: "맨 위로 이동",
    ja: "ページの先頭へ",
    en: "Back to top",
  }[language];

  useEffect(() => {
    function updateVisibility(): void {
      setIsVisible(window.scrollY >= 300);
    }

    updateVisibility();

    window.addEventListener("scroll", updateVisibility, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", updateVisibility);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      type="button"
      $hasBottomNav={hasBottomNav}
      aria-label={label}
      title={label}
      onClick={() => {
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        window.scrollTo({
          top: 0,
          behavior: reduceMotion ? "instant" : "smooth",
        });
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="m6 12 6-6 6 6" />
        <path d="M12 6v13" />
      </svg>

      <TopLabel aria-hidden="true">TOP</TopLabel>
    </Button>
  );
}

export default ScrollTopButton;
