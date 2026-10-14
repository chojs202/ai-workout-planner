import { useEffect, useId, useRef, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "../hooks/useTranslation";
import type { Language } from "../contexts/LanguageContext";

const Field = styled.div<{
  $compact: boolean;
}>`
  display: flex;
  justify-content: flex-end;
  min-width: 0;
  margin-bottom: ${({ $compact }) =>
    $compact ? "0" : "24px"};
`;

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;

  width: 100%;
  max-width: 280px;
  padding: 4px;

  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
`;

const LanguageButton = styled.button<{
  $selected: boolean;
}>`
  min-width: 0;
  min-height: 40px;
  padding: 8px 6px;

  color: ${({ $selected }) =>
    $selected
      ? "var(--color-primary)"
      : "var(--color-text-muted)"};
  background: ${({ $selected }) =>
    $selected
      ? "rgb(121 226 190 / 12%)"
      : "transparent"};
  border: 1px solid ${({ $selected }) =>
    $selected
      ? "rgb(121 226 190 / 30%)"
      : "transparent"};
  border-radius: 8px;

  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;

  &:hover {
    color: var(--color-primary);
    background: rgb(121 226 190 / 8%);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

const Dropdown = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  min-height: 44px;
  padding: 10px 12px;

  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 10px;

  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;

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

const Arrow = styled.svg<{
  $open: boolean;
}>`
  flex-shrink: 0;
  width: 14px;
  height: 14px;

  color: var(--color-text-muted);
  transform: ${({ $open }) =>
    $open ? "rotate(180deg)" : "none"};
`;

const DropdownList = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 150;

  display: grid;
  gap: 4px;

  width: 164px;
  padding: 6px;

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgb(0 0 0 / 35%);
`;

const DropdownOption = styled.button<{
  $selected: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  width: 100%;
  min-height: 44px;
  padding: 10px 12px;

  color: ${({ $selected }) =>
    $selected
      ? "var(--color-primary)"
      : "var(--color-text)"};
  background: transparent;
  border-radius: 8px;

  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  text-align: left;

  &:hover {
    background: rgb(255 255 255 / 5%);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
`;

const languageOptions: {
  value: Language;
  label: string;
}[] = [
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
];

interface LanguageSelectorProps {
  compact?: boolean;
}

export default function LanguageSelector({
  compact = false,
}: LanguageSelectorProps) {
  const { t, language, setLanguage } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownId = useId();

  const selectedLabel = languageOptions.find(
    (option) => option.value === language,
  )?.label;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleOutsideClick(event: PointerEvent): void {
      if (
        event.target instanceof Node &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <Field $compact={compact}>
      {compact ? (
        <Dropdown
          ref={dropdownRef}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsOpen(false);
            }
          }}
        >
          <DropdownButton
            ref={triggerRef}
            type="button"
            aria-label={`${t("language")}: ${selectedLabel}`}
            aria-expanded={isOpen}
            aria-controls={isOpen ? dropdownId : undefined}
            onClick={() => setIsOpen((previous) => !previous)}
          >
            <span>{selectedLabel}</span>

            <Arrow
              $open={isOpen}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="m6 9 6 6 6-6" />
            </Arrow>
          </DropdownButton>

          {isOpen && (
            <DropdownList
              id={dropdownId}
              role="group"
              aria-label={t("language")}
            >
              {languageOptions.map((option) => (
                <DropdownOption
                  key={option.value}
                  type="button"
                  lang={option.value}
                  $selected={language === option.value}
                  aria-pressed={language === option.value}
                  onClick={() => {
                    setLanguage(option.value);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  <span>{option.label}</span>

                  {language === option.value && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  )}
                </DropdownOption>
              ))}
            </DropdownList>
          )}
        </Dropdown>
      ) : (
        <ButtonGroup
          role="group"
          aria-label={t("language")}
        >
          {languageOptions.map((option) => (
            <LanguageButton
              key={option.value}
              type="button"
              lang={option.value}
              $selected={language === option.value}
              aria-pressed={language === option.value}
              onClick={() => setLanguage(option.value)}
            >
              {option.label}
            </LanguageButton>
          ))}
        </ButtonGroup>
      )}
    </Field>
  );
}