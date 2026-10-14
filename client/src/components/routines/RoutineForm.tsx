import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useBlocker, useNavigate } from "react-router-dom";
import CommonModal, { ModalActions, ModalButton } from "../common/CommonModal";
import type { FormEvent } from "react";
import styled, { css } from "styled-components";
import type {
  ExerciseSetTarget,
  ExperienceLevel,
  MuscleGroup,
  RoutineGoal,
  WorkoutLocation,
} from "../../types/routine";
import type {
  RoutineFormData,
  RoutineFormDay,
  RoutineFormExercise,
} from "../../types/routineForm";
import { useTranslation } from "../../hooks/useTranslation";
import type { TranslationKey } from "../../i18n/translations";
import { ApiRequestError } from "../../api/translatedRequest";

const controlStyle = css`
  width: 100%;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 10px 12px;

  color: var(--color-text);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);

  font-size: 16px;
  line-height: 1.5;
  color-scheme: dark;

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 1;
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &[aria-invalid="true"] {
    border-color: var(--color-error);
    background: rgb(255 133 133 / 5%);
  }

  &[aria-invalid="true"]:focus {
    outline-color: var(--color-error);
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const buttonStyle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 10px 12px;

  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);

  font-size: var(--font-caption);
  font-weight: 600;
  line-height: 1.5;
  text-align: center;
  overflow-wrap: anywhere;

  &[aria-invalid="true"] {
    border-color: var(--color-error);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Page = styled.main`
  width: 100%;
  padding: 24px var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
`;

const Container = styled.div`
  width: 100%;
  min-width: 0;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  min-height: 44px;
  margin-bottom: 16px;
  padding: 8px 12px;

  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 10px;

  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;

  &:hover:not(:disabled) {
    color: var(--color-text);
    background: var(--color-surface);
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

const LockedFields = styled.fieldset`
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
`;

const FormCard = styled.form`
  min-width: 0;
  padding: clamp(12px, 3vw, 16px);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;

const Title = styled.h1`
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: var(--font-page-title);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
`;

const Description = styled.p`
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const Section = styled.section`
  min-width: 0;
  margin-top: var(--section-gap);
`;

const SectionTitle = styled.h2`
  margin-bottom: 16px;
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
`;

const FullWidthField = styled(Field)`
  grid-column: 1 / -1;
`;

const Label = styled.label`
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const Input = styled.input`
  ${controlStyle}
`;

const Select = styled.select`
  ${controlStyle}
`;

const Textarea = styled.textarea`
  ${controlStyle}

  min-height: 88px;
  resize: vertical;
`;

const DayList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DayCard = styled.article`
  min-width: 0;
  padding: 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;

const DayHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
`;

const DayTitle = styled.h3`
  min-width: 0;
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const RemoveButton = styled.button`
  ${buttonStyle}

  max-width: 100%;
  color: var(--color-error);
  background: var(--color-input);

  &:hover:not(:disabled) {
    border-color: var(--color-error);
  }

  &:focus-visible {
    outline-color: var(--color-error);
  }
`;

const AddDayButton = styled.button`
  ${buttonStyle}

  width: 100%;
  margin-top: 16px;
  color: var(--color-primary);
  background: var(--color-input);
  border-style: dashed;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
  }
`;

const EmptyMessage = styled.p`
  padding: 16px;
  color: var(--color-text-muted);
  background: var(--color-input);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-control);

  font-size: var(--font-caption);
  line-height: 1.6;
  text-align: center;
  overflow-wrap: anywhere;
`;

const NextSectionMessage = styled.p`
  margin-top: var(--section-gap);
  padding: 14px;
  color: var(--color-text-muted);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);

  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const MuscleGroupField = styled.div`
  display: grid;
  gap: 7px;
  min-width: 0;
  margin-top: 20px;
`;

const CheckboxGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 10px;
  color: var(--color-text-muted);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  overflow-wrap: anywhere;
  cursor: pointer;

  &:has(input:checked) {
    color: var(--color-primary);
    background: rgb(121 226 190 / 10%);
    border-color: var(--color-primary);
  }

  &:has(input:focus-visible) {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

const Checkbox = styled.input`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  color-scheme: dark;
`;

const ExerciseSection = styled.section`
  min-width: 0;
  margin-top: var(--section-gap);
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
`;

const ExerciseSectionTitle = styled.h4`
  margin-bottom: 12px;
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const ExerciseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ExerciseCard = styled.details`
  &[data-invalid="true"] {
    border-color: var(--color-error);
  }
  min-width: 0;
  padding: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
`;

const ExerciseHeader = styled.summary`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: var(--control-min-height);
  list-style: none;
  cursor: pointer;
  &::-webkit-details-marker {
    display: none;
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 4px;
    border-radius: 4px;
  }
  > div {
    min-width: 0;
  }
`;

const ExerciseBody = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
`;

const ExerciseOverview = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.6;
  > span:first-child {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const ExerciseChevron = styled.span<{ $open: boolean }>`
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  margin-right: 4px;
  border-right: 2px solid var(--color-text-muted);
  border-bottom: 2px solid var(--color-text-muted);
  transform: ${({ $open }) => ($open ? "rotate(225deg)" : "rotate(45deg)")};
`;

const ExerciseTitle = styled.h5`
  min-width: 0;
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const AddExerciseButton = styled(AddDayButton)`
  margin-top: 12px;
`;

const ExerciseDetailsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  margin-top: 20px;
`;

const SetSection = styled.section`
  min-width: 0;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
`;

const SetSectionTitle = styled.h6`
  margin-bottom: 12px;
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const SetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SetRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  > div {
    grid-row: 2;
    align-self: stretch;
  }
  > div > label {
    flex: 1;
  }
`;

const SetNumber = styled.p`
  grid-column: 1;
  grid-row: 1;
  min-width: 0;
  color: var(--color-primary);
  font-size: var(--font-caption);
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const RemoveSetButton = styled(RemoveButton)`
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  padding: 4px 6px;
  background: transparent;
  border-color: transparent;
  font-size: 12px;
`;

const WeightHint = styled.p`
  margin-top: 10px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const MuscleSummary = styled.div`
  &[data-invalid="true"] {
    padding: 10px;
    border: 1px solid var(--color-error);
    border-radius: var(--radius-control);
    background: rgb(255 133 133 / 5%);
  }
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  gap: 12px;
`;

const FieldError = styled.p`
  color: var(--color-error);
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const MuscleTags = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  min-width: 0;
  gap: 6px;
`;
const MuscleTag = styled.span`
  max-width: 100%;
  padding: 5px 9px;
  color: var(--color-primary);
  background: rgb(121 226 190 / 10%);
  border: 1px solid rgb(121 226 190 / 25%);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;
const MuscleEmpty = styled.span`
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.5;
`;

const SetCountBadge = styled.span`
  flex-shrink: 0;
  padding: 3px 8px;
  color: var(--color-primary);
  background: rgb(121 226 190 / 10%);
  border: 1px solid rgb(121 226 190 / 25%);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
`;

const MuscleChangeButton = styled.button`
  ${buttonStyle}
  flex-shrink: 0;
  color: var(--color-primary);
  background: var(--color-input);
  &:hover:not(:disabled) {
    border-color: var(--color-primary);
  }
`;

const MuscleDialog = styled.dialog`
  position: fixed;
  top: auto;
  bottom: 0;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
  width: min(100%, var(--app-max-width));
  max-width: 100%;
  max-height: 85vh;
  max-height: 85dvh;
  margin: 0;
  padding: 20px var(--page-padding)
    calc(20px + env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  overscroll-behavior: contain;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px 20px 0 0;

  h2 {
    min-width: 0;
    font-size: var(--font-section-title);
    font-weight: 700;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  > p,
  > span {
    display: block;
    margin-top: 10px;
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  > div:last-child {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 16px;
  }

  > div:last-child > button {
    min-height: var(--control-min-height);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
  }

  > div:last-child > button:last-child {
    border-color: var(--color-primary);
  }

  > div:last-child > button:last-child:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &::backdrop {
    background: rgb(0 0 0 / 65%);
  }
`;

const DialogHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  h2 {
    min-width: 0;
    font-size: var(--font-section-title);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
`;

const DialogActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
`;

const DialogApplyButton = styled(MuscleChangeButton)`
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
`;

const AddSetButton = styled(AddDayButton)`
  margin-top: 12px;
`;

const SetEmptyMessage = styled(EmptyMessage)``;

const ErrorMessage = styled.p`
  margin-top: 16px;
  padding: 14px;
  color: var(--color-error);
  background: var(--color-input);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-control);

  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const SaveButton = styled.button`
  ${buttonStyle}

  width: 100%;
  margin-top: 20px;
  padding: 14px 16px;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
  font-size: var(--font-body);
  font-weight: 700;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }
`;

const muscleGroupOptions: {
  value: MuscleGroup;
  translationKey: TranslationKey;
}[] = [
  { value: "chest", translationKey: "muscleChest" },
  { value: "back", translationKey: "muscleBack" },
  { value: "shoulders", translationKey: "muscleShoulders" },
  { value: "biceps", translationKey: "muscleBiceps" },
  { value: "triceps", translationKey: "muscleTriceps" },
  { value: "quadriceps", translationKey: "muscleQuadriceps" },
  { value: "hamstrings", translationKey: "muscleHamstrings" },
  { value: "glutes", translationKey: "muscleGlutes" },
  { value: "calves", translationKey: "muscleCalves" },
  { value: "core", translationKey: "muscleCore" },
  { value: "cardio", translationKey: "muscleCardio" },
  { value: "full_body", translationKey: "muscleFullBody" },
  { value: "other", translationKey: "muscleOther" },
];

// New UI copy stays here so this replacement needs no translation-file changes.
const formUiCopy = {
  ko: {
    change: "변경",
    cancel: "취소",
    apply: "적용",
    close: "닫기",
    choose: "운동 부위 선택",
    multiple: "여러 부위를 선택할 수 있어요.",
    empty: "선택한 부위 없음",
    optional: "선택",
    sets: "세트",
    invalid: "입력 확인 필요",
    validationSummary: "빨간색으로 표시된 항목을 확인해주세요.",
  },
  ja: {
    change: "変更",
    cancel: "キャンセル",
    apply: "適用",
    close: "閉じる",
    choose: "トレーニング部位を選択",
    multiple: "複数の部位を選択できます。",
    empty: "部位未選択",
    optional: "任意",
    sets: "セット",
    invalid: "入力内容を確認",
    validationSummary: "赤く表示された項目をご確認ください。",
  },
  en: {
    change: "Change",
    cancel: "Cancel",
    apply: "Apply",
    close: "Close",
    choose: "Choose muscle groups",
    multiple: "You can select multiple groups.",
    empty: "No groups selected",
    optional: "Optional",
    sets: "sets",
    invalid: "Check input",
    validationSummary: "Please check the fields marked in red.",
  },
};

function getExerciseKey(
  day: RoutineFormDay,
  exercise: RoutineFormExercise,
): string {
  return `${day.id}:${exercise.id}`;
}

function MusclePicker({
  label,
  values,
  onApply,
  error,
  fieldKey,
}: {
  label: string;
  error?: string;
  fieldKey?: string;
  values: MuscleGroup[];
  onApply: (values: MuscleGroup[]) => void;
}) {
  const { t, language } = useTranslation();
  const copy = formUiCopy[language];
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<MuscleGroup[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const summaryId = useId();
  const errorId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const selectedOptions = muscleGroupOptions.filter((option) =>
    values.includes(option.value),
  );

  return (
    <MuscleGroupField>
      <Label as="p">{label}</Label>
      <MuscleSummary data-invalid={Boolean(error)}>
        <MuscleTags id={summaryId}>
          {selectedOptions.length ? (
            selectedOptions.map((option) => (
              <MuscleTag key={option.value}>
                {t(option.translationKey)}
              </MuscleTag>
            ))
          ) : (
            <MuscleEmpty>{copy.empty}</MuscleEmpty>
          )}
        </MuscleTags>
        <MuscleChangeButton
          type="button"
          ref={triggerRef}
          aria-label={`${label}: ${copy.change}`}
          aria-invalid={Boolean(error)}
          data-field-key={fieldKey}
          aria-describedby={error ? `${summaryId} ${errorId}` : summaryId}
          aria-haspopup="dialog"
          onClick={() => {
            setDraft([...values]);
            setIsOpen(true);
          }}
        >
          {copy.change}
        </MuscleChangeButton>
      </MuscleSummary>
      {error && <FieldError id={errorId}>{error}</FieldError>}
      {isOpen &&
        createPortal(
          <MuscleDialog
            ref={dialogRef}
            aria-labelledby={headingId}
            onCancel={(event) => {
              event.preventDefault();
              setIsOpen(false);
            }}
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              const rect = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
              )
                setIsOpen(false);
            }}
          >
            <DialogHeading>
              <h2 id={headingId}>{copy.choose}</h2>
              <MuscleChangeButton
                type="button"
                aria-label={copy.close}
                onClick={() => setIsOpen(false)}
              >
                ×
              </MuscleChangeButton>
            </DialogHeading>
            <WeightHint>
              {label} · {copy.multiple}
            </WeightHint>
            <CheckboxGrid>
              {muscleGroupOptions.map((option) => (
                <CheckboxLabel key={option.value}>
                  <Checkbox
                    type="checkbox"
                    checked={draft.includes(option.value)}
                    onChange={() =>
                      setDraft((current) =>
                        current.includes(option.value)
                          ? current.filter((value) => value !== option.value)
                          : [...current, option.value],
                      )
                    }
                  />
                  {t(option.translationKey)}
                </CheckboxLabel>
              ))}
            </CheckboxGrid>
            <DialogActions>
              <MuscleChangeButton
                type="button"
                onClick={() => setIsOpen(false)}
              >
                {copy.cancel}
              </MuscleChangeButton>
              <DialogApplyButton
                type="button"
                onClick={() => {
                  onApply(draft);
                  setIsOpen(false);
                }}
              >
                {copy.apply}
              </DialogApplyButton>
            </DialogActions>
          </MuscleDialog>,
          document.body,
        )}
    </MuscleGroupField>
  );
}

interface RoutineFormProps {
  initialData: RoutineFormData;
  title: string;
  description: string;
  backTo: string;
  backLabel: string;
  submitLabel: string;
  onSubmit: (routineData: RoutineFormData) => Promise<void>;
}

type RoutineFormMessage =
  | ""
  | {
      translationKey: TranslationKey;
      dayNumber?: number;
      exerciseNumber?: number;
    }
  | {
      message: string;
    };

interface RoutineFieldIssue {
  field: string;
  translationKey: TranslationKey;
  exerciseKey?: string;
}

function validateRoutineData(data: RoutineFormData): RoutineFieldIssue[] {
  const issues: RoutineFieldIssue[] = [];
  const add = (
    field: string,
    translationKey: TranslationKey,
    exerciseKey?: string,
  ) => {
    issues.push({ field, translationKey, exerciseKey });
  };

  if (data.name.trim() === "") add("routineName", "routineFormNameRequired");
  if (
    !Number.isInteger(data.weeklyFrequency) ||
    data.weeklyFrequency < 1 ||
    data.weeklyFrequency > 7
  ) {
    add("weeklyFrequency", "aiRoutineWeeklyFrequencyInvalid");
  }
  if (
    !Number.isInteger(data.sessionDurationMinutes) ||
    data.sessionDurationMinutes < 10 ||
    data.sessionDurationMinutes > 240
  ) {
    add("sessionDurationMinutes", "aiRoutineDurationInvalid");
  }
  if (data.days.length === 0) {
    add("days", "routineFormDayRequired");
  } else if (data.days.length !== data.weeklyFrequency) {
    add("days", "routineFormDayCountMismatch");
  }

  data.days.forEach((day, dayIndex) => {
    const dayKey = `day-${dayIndex}`;
    if (day.name.trim() === "")
      add(`${dayKey}-name`, "routineFormItemNameRequired");
    if (day.targetMuscleGroups.length === 0)
      add(`${dayKey}-muscles`, "routineFormDayMusclesRequired");
    if (day.exercises.length === 0)
      add(`${dayKey}-exercises`, "routineFormExercisesRequired");

    day.exercises.forEach((exercise, exerciseIndex) => {
      const fieldKey = `${dayKey}-exercise-${exerciseIndex}`;
      const exerciseKey = getExerciseKey(day, exercise);
      if (exercise.name.trim() === "")
        add(`${fieldKey}-name`, "routineFormItemNameRequired", exerciseKey);
      if (exercise.muscleGroups.length === 0)
        add(
          `${fieldKey}-muscles`,
          "routineFormExerciseMusclesRequired",
          exerciseKey,
        );
      if (
        !Number.isInteger(exercise.restSeconds) ||
        exercise.restSeconds < 0 ||
        exercise.restSeconds > 600
      ) {
        add(`${fieldKey}-rest`, "routineFormRestInvalid", exerciseKey);
      }
      if (exercise.sets.length === 0)
        add(`${fieldKey}-sets`, "routineFormSetsRequired", exerciseKey);

      exercise.sets.forEach((set, setIndex) => {
        const setKey = `${fieldKey}-set-${setIndex}`;
        if (
          set.targetWeightKg !== null &&
          (!Number.isFinite(set.targetWeightKg) ||
            set.targetWeightKg < 0 ||
            set.targetWeightKg > 1000)
        ) {
          add(`${setKey}-weight`, "routineFormWeightInvalid", exerciseKey);
        }
        if (
          !Number.isInteger(set.targetReps) ||
          set.targetReps < 1 ||
          set.targetReps > 100
        ) {
          add(`${setKey}-reps`, "routineFormRepsInvalid", exerciseKey);
        }
      });
    });
  });
  return issues;
}

function RoutineForm({
  initialData,
  title,
  description,
  backTo,
  submitLabel,
  onSubmit,
}: RoutineFormProps) {
  const [routineData, setRoutineData] = useState<RoutineFormData>(() => ({
    ...initialData,
    days: initialData.days.map((day) => ({
      ...day,
      id: day.id ?? crypto.randomUUID(),
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        id: exercise.id ?? crypto.randomUUID(),
      })),
    })),
  }));
  const { t, language } = useTranslation();
  const copy = formUiCopy[language];
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(
    new Set(),
  );
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();
  const pendingFocus = useRef<string | null>(null);
  const [focusVersion, setFocusVersion] = useState(0);
  const [hasValidated, setHasValidated] = useState(false);
  const allIssues = useMemo(
    () => validateRoutineData(routineData),
    [routineData],
  );
  const fieldIssues = hasValidated ? allIssues : [];
  const issueMap = new Map(fieldIssues.map((issue) => [issue.field, issue]));

  function fieldMessage(key: string): string | undefined {
    const issue = issueMap.get(key);
    return issue ? t(issue.translationKey) : undefined;
  }

  function inputErrorProps(key: string, hintId?: string) {
    const errorId = issueMap.has(key) ? `${formId}-${key}-error` : undefined;
    return {
      "data-field-key": key,
      "aria-invalid": issueMap.has(key),
      "aria-describedby":
        [hintId, errorId].filter(Boolean).join(" ") || undefined,
    };
  }

  function renderFieldError(key: string) {
    const message = fieldMessage(key);
    return message ? (
      <FieldError id={`${formId}-${key}-error`}>{message}</FieldError>
    ) : null;
  }

  // Run only when a submit requests focus, after errors and expanded cards render.
  useLayoutEffect(() => {
    const key = pendingFocus.current;
    if (!key) return;
    const target = formRef.current?.querySelector<HTMLElement>(
      `[data-field-key="${key}"]`,
    );
    if (!target) return;
    pendingFocus.current = null;
    target.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.scrollIntoView({
      block: "center",
      behavior: reduceMotion ? "instant" : "smooth",
    });
  }, [focusVersion]);

  function toggleExercise(key: string): void {
    setExpandedExercises((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function muscleText(groups: MuscleGroup[]): string {
    return (
      muscleGroupOptions
        .filter((option) => groups.includes(option.value))
        .map((option) => t(option.translationKey))
        .join(" · ") || copy.empty
    );
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<RoutineFormMessage>("");
  const navigate = useNavigate();
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(routineData),
  );
  const hasUnsavedChanges = JSON.stringify(routineData) !== savedSnapshot;
  const blocker = useBlocker(hasUnsavedChanges || isSubmitting);

  const navigationCopy = {
    ko: {
      back: "뒤로가기",
      title: "수정 중인 내용을 두고 이동할까요?",
      description: "저장하지 않은 변경사항은 사라집니다.",
      stay: "계속 수정",
      leave: "저장하지 않고 이동",
    },
    ja: {
      back: "戻る",
      title: "変更を保存せずに移動しますか？",
      description: "保存していない変更内容は失われます。",
      stay: "編集を続ける",
      leave: "保存せずに移動",
    },
    en: {
      back: "Back",
      title: "Leave without saving?",
      description: "Your unsaved changes will be lost.",
      stay: "Keep editing",
      leave: "Leave without saving",
    },
  }[language];

  // Parent pages navigate inside onSubmit. Hold that navigation while saving,
  // then resume it automatically once the save has succeeded.
  useEffect(() => {
    if (blocker.state === "blocked" && !hasUnsavedChanges && !isSubmitting) {
      blocker.proceed();
    }
  }, [blocker, hasUnsavedChanges, isSubmitting]);

  useEffect(() => {
    if (!hasUnsavedChanges && !isSubmitting) return;
    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isSubmitting]);

  function handleBack(): void {
    if (isSubmitting) return;
    const historyIndex: unknown = window.history.state?.idx;
    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate(backTo, { replace: true });
    }
  }

  function handleContinueEditing(): void {
    if (!isSubmitting && blocker.state === "blocked") blocker.reset();
  }

  function handleLeaveWithoutSaving(): void {
    if (!isSubmitting && blocker.state === "blocked") blocker.proceed();
  }

  function renderRoutineFormMessage(value: RoutineFormMessage): string {
    if (value === "") {
      return "";
    }

    if ("message" in value) {
      return value.message;
    }

    const parts: string[] = [];

    if (value.dayNumber !== undefined) {
      parts.push(
        t("aiRoutineDayLabel").replace("{number}", String(value.dayNumber)),
      );
    }

    if (value.exerciseNumber !== undefined) {
      parts.push(
        t("routineFormExerciseNumber").replace(
          "{number}",
          String(value.exerciseNumber),
        ),
      );
    }

    parts.push(t(value.translationKey));

    return parts.join(" · ");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMessage("");
    setHasValidated(true);

    const issues = validateRoutineData(routineData);
    if (issues.length > 0) {
      const firstIssue = issues[0];
      pendingFocus.current = firstIssue.field;
      setFocusVersion((version) => version + 1);
      if (firstIssue.exerciseKey) {
        setExpandedExercises((current) =>
          new Set(current).add(firstIssue.exerciseKey!),
        );
      }
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(routineData);
      setSavedSnapshot(JSON.stringify(routineData));
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrorMessage({
          translationKey: error.translationKey,
        });
      } else if (error instanceof Error) {
        setErrorMessage({
          message: error.message,
        });
      } else {
        setErrorMessage({
          translationKey: "aiRoutineSaveFailed",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }
  function addRoutineDay(): void {
    setRoutineData((current) => {
      if (current.days.length >= current.weeklyFrequency) {
        return current;
      }

      const newDay: RoutineFormDay = {
        id: crypto.randomUUID(),
        dayNumber: current.days.length + 1,
        name: "",
        targetMuscleGroups: [],
        exercises: [],
      };

      return {
        ...current,
        days: [...current.days, newDay],
      };
    });
  }
  function updateRoutineDayName(dayIndex: number, name: string): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              name,
            }
          : day,
      ),
    }));
  }

  function removeRoutineDay(dayIndex: number): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days
        .filter((_day, index) => index !== dayIndex)
        .map((day, index) => ({
          ...day,
          dayNumber: index + 1,
        })),
    }));
  }

  function applyDayMuscles(dayIndex: number, values: MuscleGroup[]): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((day, index) =>
        index === dayIndex ? { ...day, targetMuscleGroups: [...values] } : day,
      ),
    }));
  }

  function addExercise(dayIndex: number): void {
    const day = routineData.days[dayIndex];
    if (!day) return;
    const newExercise: RoutineFormExercise = {
      id: crypto.randomUUID(),
      name: "",
      muscleGroups: [],
      sets: [],
      restSeconds: 60,
      notes: "",
    };
    setExpandedExercises((current) =>
      new Set(current).add(getExerciseKey(day, newExercise)),
    );
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((item, index) =>
        index === dayIndex
          ? { ...item, exercises: [...item.exercises, newExercise] }
          : item,
      ),
    }));
  }

  function updateExerciseName(
    dayIndex: number,
    exerciseIndex: number,
    name: string,
  ): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((day, index) => {
        if (index !== dayIndex) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.map((exercise, currentExerciseIndex) =>
            currentExerciseIndex === exerciseIndex
              ? {
                  ...exercise,
                  name,
                }
              : exercise,
          ),
        };
      }),
    }));
  }

  function removeExercise(dayIndex: number, exerciseIndex: number): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((day, index) => {
        if (index !== dayIndex) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.filter(
            (_exercise, currentExerciseIndex) =>
              currentExerciseIndex !== exerciseIndex,
          ),
        };
      }),
    }));
  }

  function applyExerciseMuscles(
    dayIndex: number,
    exerciseIndex: number,
    values: MuscleGroup[],
  ): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((exercise, i) =>
                i === exerciseIndex
                  ? { ...exercise, muscleGroups: [...values] }
                  : exercise,
              ),
            }
          : day,
      ),
    }));
  }

  function updateExerciseRestSeconds(
    dayIndex: number,
    exerciseIndex: number,
    restSeconds: number,
  ): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.map((exercise, currentExerciseIndex) =>
            currentExerciseIndex === exerciseIndex
              ? {
                  ...exercise,
                  restSeconds,
                }
              : exercise,
          ),
        };
      }),
    }));
  }

  function updateExerciseNotes(
    dayIndex: number,
    exerciseIndex: number,
    notes: string,
  ): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.map((exercise, currentExerciseIndex) =>
            currentExerciseIndex === exerciseIndex
              ? {
                  ...exercise,
                  notes,
                }
              : exercise,
          ),
        };
      }),
    }));
  }

  function addExerciseSet(dayIndex: number, exerciseIndex: number): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.map((exercise, currentExerciseIndex) => {
            if (currentExerciseIndex !== exerciseIndex) {
              return exercise;
            }

            const newSet: ExerciseSetTarget = {
              setNumber: exercise.sets.length + 1,
              targetReps: 10,
              targetWeightKg: null,
            };

            return {
              ...exercise,
              sets: [...exercise.sets, newSet],
            };
          }),
        };
      }),
    }));
  }

  function updateExerciseSetReps(
    dayIndex: number,
    exerciseIndex: number,
    setIndex: number,
    targetReps: number,
  ): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.map((exercise, currentExerciseIndex) => {
            if (currentExerciseIndex !== exerciseIndex) {
              return exercise;
            }

            return {
              ...exercise,
              sets: exercise.sets.map((exerciseSet, currentSetIndex) =>
                currentSetIndex === setIndex
                  ? {
                      ...exerciseSet,
                      targetReps,
                    }
                  : exerciseSet,
              ),
            };
          }),
        };
      }),
    }));
  }

  function updateExerciseSetWeight(
    dayIndex: number,
    exerciseIndex: number,
    setIndex: number,
    targetWeightKg: number | null,
  ): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.map((exercise, currentExerciseIndex) => {
            if (currentExerciseIndex !== exerciseIndex) {
              return exercise;
            }

            return {
              ...exercise,
              sets: exercise.sets.map((exerciseSet, currentSetIndex) =>
                currentSetIndex === setIndex
                  ? {
                      ...exerciseSet,
                      targetWeightKg,
                    }
                  : exerciseSet,
              ),
            };
          }),
        };
      }),
    }));
  }

  function removeExerciseSet(
    dayIndex: number,
    exerciseIndex: number,
    setIndex: number,
  ): void {
    setRoutineData((current) => ({
      ...current,
      days: current.days.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.map((exercise, currentExerciseIndex) => {
            if (currentExerciseIndex !== exerciseIndex) {
              return exercise;
            }

            return {
              ...exercise,
              sets: exercise.sets
                .filter(
                  (_exerciseSet, currentSetIndex) =>
                    currentSetIndex !== setIndex,
                )
                .map((exerciseSet, currentSetIndex) => ({
                  ...exerciseSet,
                  setNumber: currentSetIndex + 1,
                })),
            };
          }),
        };
      }),
    }));
  }

  return (
    <Page>
      <Container>
        <BackButton type="button" onClick={handleBack} disabled={isSubmitting}>
          <span aria-hidden="true">←</span>
          {navigationCopy.back}
        </BackButton>

        <FormCard ref={formRef} onSubmit={handleSubmit} noValidate>
          <LockedFields disabled={isSubmitting}>
            <Title>{title}</Title>

            <Description>{description}</Description>

            <Section>
              <SectionTitle>{t("routineFormBasicInfo")}</SectionTitle>

              <FieldGrid>
                <FullWidthField>
                  <Label htmlFor="routineName">{t("routineFormName")}</Label>

                  <Input
                    {...inputErrorProps("routineName")}
                    id="routineName"
                    type="text"
                    value={routineData.name}
                    maxLength={100}
                    placeholder={t("routineFormNamePlaceholder")}
                    onChange={(event) =>
                      setRoutineData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                  {renderFieldError("routineName")}
                </FullWidthField>

                <Field>
                  <Label htmlFor="goal">{t("aiRoutineGoalLabel")}</Label>

                  <Select
                    id="goal"
                    value={routineData.goal}
                    onChange={(event) =>
                      setRoutineData((current) => ({
                        ...current,
                        goal: event.target.value as RoutineGoal,
                      }))
                    }
                  >
                    <option value="muscle_gain">
                      {t("routineGoalMuscleGain")}
                    </option>
                    <option value="strength">{t("routineGoalStrength")}</option>
                    <option value="weight_loss">
                      {t("routineGoalWeightLoss")}
                    </option>
                    <option value="general_fitness">
                      {t("routineGoalGeneralFitness")}
                    </option>
                  </Select>
                </Field>

                <Field>
                  <Label htmlFor="experienceLevel">
                    {t("aiRoutineExperienceLabel")}
                  </Label>

                  <Select
                    id="experienceLevel"
                    value={routineData.experienceLevel}
                    onChange={(event) =>
                      setRoutineData((current) => ({
                        ...current,
                        experienceLevel: event.target.value as ExperienceLevel,
                      }))
                    }
                  >
                    <option value="beginner">{t("aiRoutineBeginner")}</option>
                    <option value="intermediate">
                      {t("aiRoutineIntermediate")}
                    </option>
                    <option value="advanced">{t("aiRoutineAdvanced")}</option>
                  </Select>
                </Field>

                <Field>
                  <Label htmlFor="weeklyFrequency">
                    {t("dashboardWeeklyFrequency")}
                  </Label>

                  <Input
                    {...inputErrorProps("weeklyFrequency")}
                    id="weeklyFrequency"
                    type="number"
                    min={1}
                    max={7}
                    value={routineData.weeklyFrequency}
                    onChange={(event) =>
                      setRoutineData((current) => ({
                        ...current,
                        weeklyFrequency: Number(event.target.value),
                      }))
                    }
                  />
                  {renderFieldError("weeklyFrequency")}
                </Field>

                <Field>
                  <Label htmlFor="sessionDurationMinutes">
                    {t("aiRoutineDurationLabel")}
                  </Label>

                  <Input
                    {...inputErrorProps("sessionDurationMinutes")}
                    id="sessionDurationMinutes"
                    type="number"
                    min={10}
                    max={240}
                    value={routineData.sessionDurationMinutes}
                    onChange={(event) =>
                      setRoutineData((current) => ({
                        ...current,
                        sessionDurationMinutes: Number(event.target.value),
                      }))
                    }
                  />
                  {renderFieldError("sessionDurationMinutes")}
                </Field>

                <FullWidthField>
                  <Label htmlFor="location">
                    {t("aiRoutineLocationLabel")}
                  </Label>

                  <Select
                    id="location"
                    value={routineData.location}
                    onChange={(event) =>
                      setRoutineData((current) => ({
                        ...current,
                        location: event.target.value as WorkoutLocation,
                      }))
                    }
                  >
                    <option value="gym">{t("aiRoutineGym")}</option>
                    <option value="home">{t("aiRoutineHome")}</option>
                    <option value="outdoors">{t("aiRoutineOutdoors")}</option>
                  </Select>
                </FullWidthField>
              </FieldGrid>
            </Section>

            <Section>
              <SectionTitle>{t("routineFormDays")}</SectionTitle>

              {routineData.days.length === 0 && (
                <EmptyMessage>{t("routineFormDayRequired")}</EmptyMessage>
              )}

              <DayList data-field-key="days" tabIndex={-1}>
                {routineData.days.map((day, dayIndex) => (
                  <DayCard
                    key={day.id ?? day.dayNumber}
                    data-day-position={dayIndex}
                  >
                    <DayHeader>
                      <DayTitle>
                        {t("aiRoutineDayLabel").replace(
                          "{number}",
                          String(day.dayNumber),
                        )}
                      </DayTitle>
                      <RemoveButton
                        type="button"
                        onClick={() => removeRoutineDay(dayIndex)}
                      >
                        {t("routineFormRemoveDay")}
                      </RemoveButton>
                    </DayHeader>

                    <Field>
                      <Label htmlFor={`day-name-${day.dayNumber}`}>
                        {t("routineFormDayName")}
                      </Label>

                      <Input
                        {...inputErrorProps(`day-${dayIndex}-name`)}
                        id={`day-name-${day.dayNumber}`}
                        type="text"
                        maxLength={100}
                        value={day.name}
                        placeholder={t("routineFormDayNamePlaceholder")}
                        onChange={(event) =>
                          updateRoutineDayName(dayIndex, event.target.value)
                        }
                      />
                      {renderFieldError(`day-${dayIndex}-name`)}
                    </Field>
                    <MusclePicker
                      label={t("aiRoutineTargetMuscles")}
                      fieldKey={`day-${dayIndex}-muscles`}
                      error={fieldMessage(`day-${dayIndex}-muscles`)}
                      values={day.targetMuscleGroups}
                      onApply={(values) => applyDayMuscles(dayIndex, values)}
                    />
                    <ExerciseSection>
                      <ExerciseSectionTitle>
                        {t("routineFormExercises")}
                      </ExerciseSectionTitle>

                      {day.exercises.length === 0 && (
                        <EmptyMessage>
                          {t("routineFormExercisesRequired")}
                        </EmptyMessage>
                      )}

                      <ExerciseList>
                        {day.exercises.map((exercise, exerciseIndex) => (
                          <ExerciseCard
                            key={getExerciseKey(day, exercise)}
                            data-exercise-position={`${dayIndex}-${exerciseIndex}`}
                            data-invalid={fieldIssues.some(
                              (issue) =>
                                issue.exerciseKey ===
                                getExerciseKey(day, exercise),
                            )}
                            open={expandedExercises.has(
                              getExerciseKey(day, exercise),
                            )}
                          >
                            <ExerciseHeader
                              onClick={(event) => {
                                event.preventDefault();
                                toggleExercise(getExerciseKey(day, exercise));
                              }}
                            >
                              <div>
                                <ExerciseTitle>
                                  {exercise.name.trim() ||
                                    t("routineFormExerciseNumber").replace(
                                      "{number}",
                                      String(exerciseIndex + 1),
                                    )}
                                </ExerciseTitle>
                                <ExerciseOverview>
                                  <span>
                                    {muscleText(exercise.muscleGroups)}
                                  </span>
                                  <SetCountBadge>
                                    {exercise.sets.length} {copy.sets}
                                  </SetCountBadge>
                                </ExerciseOverview>
                              </div>
                              <ExerciseChevron
                                aria-hidden="true"
                                $open={expandedExercises.has(
                                  getExerciseKey(day, exercise),
                                )}
                              />
                            </ExerciseHeader>
                            <ExerciseBody>
                              <Field>
                                <Label
                                  htmlFor={`exercise-name-${day.dayNumber}-${exerciseIndex}`}
                                >
                                  {t("routineFormExerciseName")}
                                </Label>

                                <Input
                                  {...inputErrorProps(
                                    `day-${dayIndex}-exercise-${exerciseIndex}-name`,
                                  )}
                                  id={`exercise-name-${day.dayNumber}-${exerciseIndex}`}
                                  type="text"
                                  maxLength={100}
                                  value={exercise.name}
                                  placeholder={t(
                                    "routineFormExercisePlaceholder",
                                  )}
                                  onChange={(event) =>
                                    updateExerciseName(
                                      dayIndex,
                                      exerciseIndex,
                                      event.target.value,
                                    )
                                  }
                                />
                                {renderFieldError(
                                  `day-${dayIndex}-exercise-${exerciseIndex}-name`,
                                )}
                              </Field>
                              <MusclePicker
                                label={t("aiRoutineExerciseMuscles")}
                                fieldKey={`day-${dayIndex}-exercise-${exerciseIndex}-muscles`}
                                error={fieldMessage(
                                  `day-${dayIndex}-exercise-${exerciseIndex}-muscles`,
                                )}
                                values={exercise.muscleGroups}
                                onApply={(values) =>
                                  applyExerciseMuscles(
                                    dayIndex,
                                    exerciseIndex,
                                    values,
                                  )
                                }
                              />
                              <ExerciseDetailsGrid>
                                <Field>
                                  <Label
                                    htmlFor={`rest-seconds-${day.dayNumber}-${exerciseIndex}`}
                                  >
                                    {t("routineFormRestLabel")}
                                  </Label>

                                  <Input
                                    {...inputErrorProps(
                                      `day-${dayIndex}-exercise-${exerciseIndex}-rest`,
                                    )}
                                    id={`rest-seconds-${day.dayNumber}-${exerciseIndex}`}
                                    type="number"
                                    min={0}
                                    max={600}
                                    value={exercise.restSeconds}
                                    onChange={(event) =>
                                      updateExerciseRestSeconds(
                                        dayIndex,
                                        exerciseIndex,
                                        Number(event.target.value),
                                      )
                                    }
                                  />
                                  {renderFieldError(
                                    `day-${dayIndex}-exercise-${exerciseIndex}-rest`,
                                  )}
                                </Field>

                                <FullWidthField>
                                  <Label
                                    htmlFor={`exercise-notes-${day.dayNumber}-${exerciseIndex}`}
                                  >
                                    {t("routineFormExerciseNotes")}
                                  </Label>

                                  <Textarea
                                    id={`exercise-notes-${day.dayNumber}-${exerciseIndex}`}
                                    maxLength={500}
                                    value={exercise.notes}
                                    placeholder={t(
                                      "routineFormNotesPlaceholder",
                                    )}
                                    onChange={(event) =>
                                      updateExerciseNotes(
                                        dayIndex,
                                        exerciseIndex,
                                        event.target.value,
                                      )
                                    }
                                  />
                                </FullWidthField>
                              </ExerciseDetailsGrid>
                              <SetSection>
                                <SetSectionTitle>
                                  {t("routineFormSets")}
                                </SetSectionTitle>

                                {exercise.sets.length === 0 && (
                                  <SetEmptyMessage>
                                    {t("routineFormSetsRequired")}
                                  </SetEmptyMessage>
                                )}

                                <SetList>
                                  {exercise.sets.map(
                                    (exerciseSet, setIndex) => (
                                      <SetRow key={exerciseSet.setNumber}>
                                        <SetNumber>
                                          {t("workoutSetLabel")}{" "}
                                          {exerciseSet.setNumber}
                                        </SetNumber>

                                        <Field>
                                          <Label
                                            htmlFor={`target-weight-${day.dayNumber}-${exerciseIndex}-${setIndex}`}
                                          >
                                            {t("routineFormTargetWeight")}
                                          </Label>

                                          <Input
                                            {...inputErrorProps(
                                              `day-${dayIndex}-exercise-${exerciseIndex}-set-${setIndex}-weight`,
                                              `weight-hint-${day.dayNumber}-${exerciseIndex}`,
                                            )}
                                            id={`target-weight-${day.dayNumber}-${exerciseIndex}-${setIndex}`}
                                            type="number"
                                            min={0}
                                            max={1000}
                                            step={0.5}
                                            value={
                                              exerciseSet.targetWeightKg ?? ""
                                            }
                                            placeholder={copy.optional}
                                            onChange={(event) =>
                                              updateExerciseSetWeight(
                                                dayIndex,
                                                exerciseIndex,
                                                setIndex,
                                                event.target.value === ""
                                                  ? null
                                                  : Number(event.target.value),
                                              )
                                            }
                                          />
                                          {renderFieldError(
                                            `day-${dayIndex}-exercise-${exerciseIndex}-set-${setIndex}-weight`,
                                          )}
                                        </Field>
                                        <Field>
                                          <Label
                                            htmlFor={`target-reps-${day.dayNumber}-${exerciseIndex}-${setIndex}`}
                                          >
                                            {t("routineFormTargetReps")}
                                          </Label>

                                          <Input
                                            {...inputErrorProps(
                                              `day-${dayIndex}-exercise-${exerciseIndex}-set-${setIndex}-reps`,
                                            )}
                                            id={`target-reps-${day.dayNumber}-${exerciseIndex}-${setIndex}`}
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={exerciseSet.targetReps}
                                            onChange={(event) =>
                                              updateExerciseSetReps(
                                                dayIndex,
                                                exerciseIndex,
                                                setIndex,
                                                Number(event.target.value),
                                              )
                                            }
                                          />
                                          {renderFieldError(
                                            `day-${dayIndex}-exercise-${exerciseIndex}-set-${setIndex}-reps`,
                                          )}
                                        </Field>
                                        <RemoveSetButton
                                          type="button"
                                          onClick={() =>
                                            removeExerciseSet(
                                              dayIndex,
                                              exerciseIndex,
                                              setIndex,
                                            )
                                          }
                                        >
                                          {t("routineFormRemoveSet")}
                                        </RemoveSetButton>
                                      </SetRow>
                                    ),
                                  )}
                                </SetList>
                                {exercise.sets.length > 0 && (
                                  <WeightHint
                                    id={`weight-hint-${day.dayNumber}-${exerciseIndex}`}
                                  >
                                    {t("workoutWeightPlaceholder")}
                                  </WeightHint>
                                )}

                                {renderFieldError(
                                  `day-${dayIndex}-exercise-${exerciseIndex}-sets`,
                                )}
                                <AddSetButton
                                  {...inputErrorProps(
                                    `day-${dayIndex}-exercise-${exerciseIndex}-sets`,
                                  )}
                                  type="button"
                                  onClick={() =>
                                    addExerciseSet(dayIndex, exerciseIndex)
                                  }
                                >
                                  {t("routineFormAddSet")}
                                </AddSetButton>
                              </SetSection>
                              <RemoveButton
                                type="button"
                                style={{ marginTop: 16 }}
                                onClick={() =>
                                  removeExercise(dayIndex, exerciseIndex)
                                }
                              >
                                {t("routineFormRemoveExercise")}
                              </RemoveButton>
                            </ExerciseBody>
                          </ExerciseCard>
                        ))}
                      </ExerciseList>

                      {renderFieldError(`day-${dayIndex}-exercises`)}
                      <AddExerciseButton
                        {...inputErrorProps(`day-${dayIndex}-exercises`)}
                        type="button"
                        onClick={() => addExercise(dayIndex)}
                      >
                        {t("routineFormAddExercise")}
                      </AddExerciseButton>
                    </ExerciseSection>
                  </DayCard>
                ))}
              </DayList>

              {renderFieldError("days")}
              <AddDayButton
                type="button"
                onClick={addRoutineDay}
                disabled={
                  routineData.days.length >= routineData.weeklyFrequency
                }
              >
                {t("routineFormAddDay")} ({routineData.days.length}/
                {routineData.weeklyFrequency})
              </AddDayButton>
            </Section>

            <NextSectionMessage>{t("routineFormSaveHint")}</NextSectionMessage>
            {fieldIssues.length > 0 && (
              <ErrorMessage role="alert">{copy.validationSummary}</ErrorMessage>
            )}
            {errorMessage && (
              <ErrorMessage role="alert">
                {renderRoutineFormMessage(errorMessage)}
              </ErrorMessage>
            )}

            <SaveButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("routineFormSaving") : submitLabel}
            </SaveButton>
          </LockedFields>
        </FormCard>
      </Container>

      {blocker.state === "blocked" && hasUnsavedChanges && !isSubmitting && (
        <CommonModal
          title={navigationCopy.title}
          description={navigationCopy.description}
          error={renderRoutineFormMessage(errorMessage)}
          onClose={handleContinueEditing}
          actions={
            <ModalActions>
              <ModalButton
                type="button"
                autoFocus
                onClick={handleContinueEditing}
              >
                {navigationCopy.stay}
              </ModalButton>
              <ModalButton
                type="button"
                $tone="danger"
                onClick={handleLeaveWithoutSaving}
              >
                {navigationCopy.leave}
              </ModalButton>
            </ModalActions>
          }
        />
      )}
    </Page>
  );
}

export default RoutineForm;
