import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import LanguageSelector from "../LanguageSelector";
import fitPlanIcon from "../../assets/fit-plan-icon.svg";
import { useTranslation } from "../../hooks/useTranslation";

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 12px var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
`;
const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  flex-shrink: 0;
  border-radius: 6px;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 4px;
  }
`;

const BrandIcon = styled.img`
  display: block;
  flex-shrink: 0;
  width: clamp(26px, 6vw, 30px);
  height: clamp(26px, 6vw, 30px);
  object-fit: contain;
`;

const BrandName = styled.span`
  color: var(--color-text);
  font-family: "Pretendard", sans-serif;
  font-size: clamp(20px, 5vw, 23px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.035em;
  white-space: nowrap;
`;
const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;
const RoutineLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 112px;
  min-height: 44px;
  padding: 8px 10px;
  color: var(--color-primary);
  background: rgb(121 226 190 / 8%);
  border: 1px solid rgb(121 226 190 / 20%);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  overflow-wrap: anywhere;
  &:hover {
    background: rgb(121 226 190 / 14%);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;
const MenuWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;
const MenuButton = styled.button`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  &:hover,
  &[aria-expanded="true"] {
    color: var(--color-text);
    background: var(--color-surface);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;
const MenuPanel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 150;
  width: min(280px, calc(100vw - 32px));
  padding: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgb(0 0 0 / 35%);
`;
const LanguageSection = styled.div`
  padding: 4px 0 12px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
  > div {
    margin-bottom: 0;
  }
`;
const LanguageLabel = styled.p`
  margin-bottom: 10px;
  padding-left: 4px;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
`;
const ProfileLink = styled(Link)`
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 10px 12px;
  color: var(--color-text);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  &:hover {
    background: rgb(255 255 255 / 5%);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
`;
const LogoutButton = styled.button`
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  color: var(--color-error);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-align: left;
  &:hover:not(:disabled) {
    background: rgb(255 133 133 / 8%);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
  &:disabled {
    opacity: 0.5;
  }
`;

function AppHeader() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuLabel = {
    ko: "더보기",
    ja: "その他",
    en: "More options",
  }[language];

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(event: PointerEvent): void {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function handleLogout(): void {
    setIsOpen(false);
    navigate("/logout");
  }

  return (
    <Header>
      <Brand to="/calendar" aria-label={t("calendar")}>
        <BrandIcon src={fitPlanIcon} alt="" />
        <BrandName>Fit Plan</BrandName>
      </Brand>
      <Actions>
        <RoutineLink to="/routines">{t("dashboardMyRoutines")}</RoutineLink>
        <MenuWrapper
          ref={menuRef}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsOpen(false);
            }
          }}
        >
          <MenuButton
            ref={buttonRef}
            type="button"
            aria-label={menuLabel}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((previous) => !previous)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="5" cy="12" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="19" cy="12" r="1.7" />
            </svg>
          </MenuButton>
          {isOpen && (
            <MenuPanel>
              <LanguageSection>
                <LanguageLabel>{t("language")}</LanguageLabel>
                <LanguageSelector />
              </LanguageSection>
              <ProfileLink to="/profile" onClick={() => setIsOpen(false)}>
                {t("profile")}
              </ProfileLink>
              <LogoutButton type="button" onClick={handleLogout}>
                {t("profileLogout")}
              </LogoutButton>
            </MenuPanel>
          )}
        </MenuWrapper>
      </Actions>
    </Header>
  );
}

export default AppHeader;
