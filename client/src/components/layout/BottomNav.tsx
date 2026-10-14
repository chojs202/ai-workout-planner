import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "../../hooks/useTranslation";
import type { TranslationKey } from "../../i18n/translations";

const Navigation = styled.nav`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 100;

  width: 100%;
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding-bottom: env(safe-area-inset-bottom, 0px);

  background: var(--color-background);
  border-top: 1px solid var(--color-border);
`;

const MenuList = styled.ul`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  width: 100%;
  min-height: 80px;
  margin: 0;
  padding: 8px 4px;
`;

const MenuItem = styled.li`
  min-width: 0;
`;

const MenuLink = styled(NavLink) <{
  $isCenter?: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;

  min-width: 0;
  min-height: 64px;
  height: 100%;
  padding: 4px 2px;

  color: var(--color-text-muted);
  font-size: clamp(11px, 2.5vw, 12px);
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
  border-radius: 10px;

  &.active {
    color: var(--color-primary);
  }

  &:hover {
    color: var(--color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }

  > span:first-child {
    display: grid;
    place-items: center;
    flex-shrink: 0;

    width: ${({ $isCenter }) =>
    $isCenter ? "40px" : "28px"};
    height: ${({ $isCenter }) =>
    $isCenter ? "40px" : "28px"};

    color: ${({ $isCenter }) =>
    $isCenter ? "var(--color-on-primary)" : "inherit"};
    background: ${({ $isCenter }) =>
    $isCenter ? "var(--color-primary)" : "transparent"};

    border-radius: var(--radius-control);
  }

  > span:last-child {
    width: 100%;
    min-width: 0;
  }
`;

type IconName =
  | "calendar"
  | "history"
  | "create"
  | "ai"
  | "user";

interface NavIconProps {
  name: IconName;
}

function NavIcon({ name }: NavIconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {name === "calendar" && (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4M17 3v4M3 11h18" />
          <path d="M7 15h2M15 15h2M7 18h2" />
        </>
      )}

      {name === "history" && (
        <>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 3h6v3H9z" />
          <path d="M9 11h6M9 15h6M9 18h3" />
        </>
      )}

      {name === "create" && <path d="M12 5v14M5 12h14" />}

      {name === "ai" && (
        <>
          <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
          <path d="M20 2v4M18 4h4" />
        </>
      )}

      {name === "user" && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </>
      )}
    </svg>
  );
}

interface MenuItemConfig {
  to: string;
  labelKey: TranslationKey;
  icon: IconName;
  isCenter?: boolean;
  end?: boolean;
}

const menuItems: MenuItemConfig[] = [
  {
    to: "/calendar",
    labelKey: "calendar",
    icon: "calendar",
  },
  {
    to: "/workouts",
    labelKey: "workouts",
    icon: "history",
  },
  {
    to: "/routines/new",
    labelKey: "createRoutine",
    icon: "create",
    isCenter: true,
    end: true,
  },
  {
    to: "/routines/ai",
    labelKey: "aiRoutine",
    icon: "ai",
    end: true,
  },
  {
    to: "/profile",
    labelKey: "profile",
    icon: "user",
    end: true,
  },
];

function BottomNav() {
  const { t } = useTranslation();

  return (
    <Navigation aria-label={t("mainNavigation")}>
      <MenuList>
        {menuItems.map((item) => (
          <MenuItem key={item.to}>
            <MenuLink
              to={item.to}
              end={item.end}
              $isCenter={item.isCenter}
            >
              <span>
                <NavIcon name={item.icon} />
              </span>
              <span>{t(item.labelKey)}</span>
            </MenuLink>
          </MenuItem>
        ))}
      </MenuList>
    </Navigation>
  );
}

export default BottomNav;