import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import styled, { css } from "styled-components";
import CommonModal, {
  ModalActions,
  ModalButton,
} from "../components/common/CommonModal";
import { createRoutine } from "../api/routines";
import { generateRoutine } from "../api/aiRoutines";
import { ApiRequestError } from "../api/translatedRequest";
import { useTranslation } from "../hooks/useTranslation";
import type { TranslationKey } from "../i18n/translations";
import type {
  CreateRoutineRequest,
  ExperienceLevel,
  MuscleGroup,
  RoutineGoal,
  WorkoutLocation,
} from "../types/routine";
import { showSuccessToast } from "../utils/successToast";

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
function parseCommaSeparatedText(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
type AiRoutineMessage =
  | ""
  | { translationKey: TranslationKey }
  | { message: string };
function getAiRoutineError(
  error: unknown,
  fallbackKey: TranslationKey,
): AiRoutineMessage {
  if (error instanceof ApiRequestError) {
    return {
      translationKey: error.translationKey,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }
  return {
    translationKey: fallbackKey,
  };
}
const controlStyle = css`
  width: 100%;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 12px;
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
const Card = styled.section`
  min-width: 0;
  padding: var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;
const Title = styled.h1`
  margin-bottom: 8px;
  font-size: var(--font-page-title);
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
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
  margin-top: var(--section-gap);
`;
const Section = styled.section`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 24px;
  & + & {
    padding-top: var(--section-gap);
    border-top: 1px solid var(--color-border);
  }
`;
const SectionTitle = styled.h2`
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
const SectionDescription = styled.p`
  margin-top: -16px;
  padding: 12px;
  color: var(--color-text-muted);
  background: var(--color-input);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 8px 8px 0;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 7px;
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
  input {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
    color-scheme: dark;
  }
  &:has(input:checked) {
    color: var(--color-primary);
    background: rgb(121 226 190 / 10%);
    border-color: var(--color-primary);
  }
  &:has(input:focus-visible) {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  &:has(input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
const Textarea = styled.textarea`
  ${controlStyle} min-height:120px;
  resize: vertical;
`;
const HelperText = styled.p`
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const SubmitButton = styled.button`
  ${buttonStyle} width:100%;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
  font-size: var(--font-body);
  font-weight: 700;
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
`;
const ErrorMessage = styled.p`
  padding: 12px;
  color: var(--color-error);
  background: var(--color-input);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-control);
  font-size: var(--font-caption);
  overflow-wrap: anywhere;
`;
const GeneratedResult = styled.section`
  min-width: 0;
  margin-top: var(--section-gap);
  padding-top: var(--section-gap);
  border-top: 1px solid var(--color-border);
`;
const GeneratedTitle = styled.h2`
  margin-bottom: 8px;
  font-size: var(--font-section-title);
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
const GeneratedDescription = styled.p`
  margin-bottom: 16px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.6;
`;
const GeneratedDayList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const GeneratedDay = styled.article`
  min-width: 0;
  overflow: hidden;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;
const GeneratedDayButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 48px;
  gap: 10px;
  padding: 14px 12px;
  color: var(--color-text);
  font-weight: 700;
  text-align: left;
  > span:first-child {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  > span:last-child {
    flex-shrink: 0;
    color: var(--color-primary);
    font-size: 12px;
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
`;
const GeneratedDayContent = styled.div`
  padding: 0 12px 12px;
`;
const TargetMuscles = styled.p`
  margin-bottom: 12px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  overflow-wrap: anywhere;
`;
const ExerciseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const ExerciseCard = styled.section`
  min-width: 0;
  padding: 12px;
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
`;
const ExerciseName = styled.h3`
  margin-bottom: 8px;
  font-size: 16px;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
const ExerciseInformation = styled.p`
  margin-bottom: 6px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  overflow-wrap: anywhere;
`;
const SetList = styled.ul`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  margin-top: 12px;
  list-style: none;
`;
const SetBadge = styled.li`
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto minmax(0, 0.8fr);
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 10px 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 13px;
  > span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  > span:last-child {
    text-align: right;
  }
`;
const SetNumber = styled.span`
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: var(--color-on-primary);
  background: var(--color-primary);
  font-weight: 700;
`;
const ExerciseNotes = styled.p`
  margin-top: 12px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;
const ResultActions = styled.div`
  margin-top: 16px;
`;
const SaveButton = styled(SubmitButton)``;
const SaveErrorMessage = styled(ErrorMessage)`
  margin-top: 16px;
`;
const NotesLabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
`;
const GuideButton = styled.button`
  ${buttonStyle} color:var(--color-primary);
  background: var(--color-input);
`;
const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`;
const ModalTitle = styled.h2`
  min-width: 0;
  font-size: var(--font-section-title);
  overflow-wrap: anywhere;
`;
const ModalCloseButton = styled(GuideButton)`
  flex-shrink: 0;
`;
const GuideDescription = styled.p`
  margin-bottom: 16px;
  color: var(--color-text-muted);
  line-height: 1.6;
`;
const GuideList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  padding-left: 20px;
  list-style: disc;
  line-height: 1.6;
`;
const GuideExample = styled.div`
  padding: 14px;
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  line-height: 1.7;
  white-space: pre-line;
  overflow-wrap: anywhere;
`;
const GuideWarning = styled.p`
  margin-top: 16px;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.6;
`;
const MuscleGroupField = styled.div`
  display: grid;
  gap: 7px;
  min-width: 0;
`;
const MuscleSummary = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  gap: 12px;
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
const ModalCard = styled(MuscleDialog)`
  top: 50%;
  bottom: auto;
  transform: translate(-50%, -50%);
  width: min(calc(100% - 24px), var(--app-max-width));
  border-radius: var(--radius-card);
`;
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
  },
};
function MusclePicker({
  label,
  values,
  onApply,
}: {
  label: string;
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
      <MuscleSummary>
        <MuscleTags id={summaryId}>
          {selectedOptions.length > 0 ? (
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
          aria-describedby={summaryId}
          aria-haspopup="dialog"
          onClick={() => {
            setDraft([...values]);
            setIsOpen(true);
          }}
        >
          {copy.change}
        </MuscleChangeButton>
      </MuscleSummary>
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
            <HelperText>{t("aiRoutineFocusHint")}</HelperText>
            <CheckboxGrid>
              {muscleGroupOptions.map((option) => (
                <CheckboxLabel key={option.value}>
                  <input
                    type="checkbox"
                    checked={draft.includes(option.value)}
                    disabled={
                      !draft.includes(option.value) && draft.length >= 6
                    }
                    onChange={() =>
                      setDraft((current) =>
                        current.includes(option.value)
                          ? current.filter((value) => value !== option.value)
                          : current.length < 6
                            ? [...current, option.value]
                            : current,
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
function AiRoutinePage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [goal, setGoal] = useState<RoutineGoal>("muscle_gain");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("beginner");
  const [weeklyFrequency, setWeeklyFrequency] = useState(3);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(60);
  const [location, setLocation] = useState<WorkoutLocation>("gym");
  const [focusMuscleGroups, setFocusMuscleGroups] = useState<MuscleGroup[]>([]);
  const [equipmentText, setEquipmentText] = useState("");
  const [excludedExercisesText, setExcludedExercisesText] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const guideRef = useRef<HTMLDialogElement>(null);
  const guideTriggerRef = useRef<HTMLButtonElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] =
    useState<AiRoutineMessage>("");
  const [errorMessage, setErrorMessage] = useState<AiRoutineMessage>("");
  const [generatedRoutine, setGeneratedRoutine] =
    useState<CreateRoutineRequest | null>(null);
  const [expandedDayNumbers, setExpandedDayNumbers] = useState<number[]>([]);
  const [hasUnsavedResult, setHasUnsavedResult] = useState(false);
  const savingRef = useRef(false);
  const isBusy = isGenerating || isSaving;
  const shouldBlockNavigation = hasUnsavedResult || isSaving;
  const blocker = useBlocker(shouldBlockNavigation);
  const blockerRef = useRef(blocker);
  blockerRef.current = blocker;
  const navigationCopy = {
    ko: {
      title: "추천 결과를 저장할까요?",
      description:
        "아직 저장하지 않은 AI 추천 루틴이 있습니다. 이동하면 이 결과가 사라집니다.",
      busy: "요청을 처리하고 있습니다. 잠시 기다려주세요.",
      stay: "계속 확인",
      leave: "저장하지 않고 이동",
      save: "저장 후 이동",
    },
    ja: {
      title: "提案結果を保存しますか？",
      description:
        "AIが提案したルーティンがまだ保存されていません。移動するとこの結果は失われます。",
      busy: "処理中です。しばらくお待ちください。",
      stay: "確認を続ける",
      leave: "保存せずに移動",
      save: "保存して移動",
    },
    en: {
      title: "Save the suggested routine?",
      description:
        "This AI-generated routine has not been saved. Leaving this page will discard it.",
      busy: "Processing your request. Please wait.",
      stay: "Keep reviewing",
      leave: "Leave without saving",
      save: "Save and leave",
    },
  }[language];

  useEffect(() => {
    if (blocker.state === "blocked" && !shouldBlockNavigation) {
      blocker.proceed();
    }
  }, [blocker, shouldBlockNavigation]);

  useEffect(() => {
    if (!shouldBlockNavigation) return;

    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldBlockNavigation]);

  function handleKeepReviewing(): void {
    if (!isBusy && blocker.state === "blocked") {
      blocker.reset();
    }
  }

  function handleLeaveWithoutSaving(): void {
    if (!isBusy && blocker.state === "blocked") {
      setHasUnsavedResult(false);
    }
  }

  function renderAiRoutineMessage(value: AiRoutineMessage): string {
    if (value === "") {
      return "";
    }
    if ("message" in value) {
      return value.message;
    }
    return t(value.translationKey);
  }
  function getMuscleGroupLabel(muscleGroup: MuscleGroup): string {
    const option = muscleGroupOptions.find(
      (item) => item.value === muscleGroup,
    );
    return option ? t(option.translationKey) : muscleGroup;
  }
  useEffect(() => {
    if (!isGuideOpen) return;
    const dialog = guideRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      guideTriggerRef.current?.focus({ preventScroll: true });
    };
  }, [isGuideOpen]);
  function toggleGeneratedDay(dayNumber: number): void {
    setExpandedDayNumbers((currentDays) => {
      if (currentDays.includes(dayNumber)) {
        return currentDays.filter((number) => number !== dayNumber);
      }
      return [...currentDays, dayNumber];
    });
  }
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (isGenerating || isSaving) {
      return;
    }
    setErrorMessage("");
    setSaveErrorMessage("");
    if (
      !Number.isInteger(weeklyFrequency) ||
      weeklyFrequency < 1 ||
      weeklyFrequency > 7
    ) {
      setErrorMessage({
        translationKey: "aiRoutineWeeklyFrequencyInvalid",
      });
      return;
    }
    if (
      !Number.isInteger(sessionDurationMinutes) ||
      sessionDurationMinutes < 10 ||
      sessionDurationMinutes > 240
    ) {
      setErrorMessage({
        translationKey: "aiRoutineDurationInvalid",
      });
      return;
    }
    const availableEquipment = parseCommaSeparatedText(equipmentText);
    const excludedExercises = parseCommaSeparatedText(excludedExercisesText);
    if (availableEquipment.length > 20) {
      setErrorMessage({
        translationKey: "aiRoutineEquipmentTooMany",
      });
      return;
    }
    if (excludedExercises.length > 20) {
      setErrorMessage({
        translationKey: "aiRoutineExcludedTooMany",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateRoutine({
        language,
        goal,
        experienceLevel,
        weeklyFrequency,
        sessionDurationMinutes,
        location,
        focusMuscleGroups,
        availableEquipment,
        excludedExercises,
        additionalNotes: additionalNotes.trim(),
      });
      setGeneratedRoutine(result.routine);
      setHasUnsavedResult(true);
      setExpandedDayNumbers(
        result.routine.days.length > 0
          ? [result.routine.days[0].dayNumber]
          : [],
      );
    } catch (error) {
      setErrorMessage(getAiRoutineError(error, "aiRoutineGenerateFailed"));
    } finally {
      setIsGenerating(false);
    }
  }
  async function handleSaveRoutine(): Promise<void> {
    if (!generatedRoutine || isSaving || isGenerating || savingRef.current) {
      return;
    }
    setSaveErrorMessage("");
    savingRef.current = true;
    setIsSaving(true);
    try {
      const result = await createRoutine(generatedRoutine);
      showSuccessToast();

      setHasUnsavedResult(false);

      if (blockerRef.current.state !== "blocked") {
        navigate(`/routines/${result.routine.id}`, {
          replace: true,
        });
      }
    } catch (error) {
      setSaveErrorMessage(getAiRoutineError(error, "aiRoutineSaveFailed"));
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }
  return (
    <Page>
      <Container>
        <Card>
          <Title>{t("aiRoutine")}</Title>
          <Description>{t("aiRoutineDescription")}</Description>
          <Form onSubmit={handleSubmit}>
            <Section>
              <SectionTitle>{t("aiRoutineBasicConditions")}</SectionTitle>
              <FormGrid>
                <Field>
                  <Label htmlFor="goal">{t("aiRoutineGoalLabel")}</Label>
                  <Select
                    id="goal"
                    value={goal}
                    onChange={(event) =>
                      setGoal(event.target.value as RoutineGoal)
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
                    value={experienceLevel}
                    onChange={(event) =>
                      setExperienceLevel(event.target.value as ExperienceLevel)
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
                    id="weeklyFrequency"
                    type="number"
                    min={1}
                    max={7}
                    value={weeklyFrequency}
                    onChange={(event) =>
                      setWeeklyFrequency(Number(event.target.value))
                    }
                  />
                </Field>
                <Field>
                  <Label htmlFor="sessionDurationMinutes">
                    {t("aiRoutineDurationLabel")}
                  </Label>
                  <Input
                    id="sessionDurationMinutes"
                    type="number"
                    min={10}
                    max={240}
                    value={sessionDurationMinutes}
                    onChange={(event) =>
                      setSessionDurationMinutes(Number(event.target.value))
                    }
                  />
                </Field>
              </FormGrid>
              <Field>
                <Label htmlFor="location">{t("aiRoutineLocationLabel")}</Label>
                <Select
                  id="location"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value as WorkoutLocation)
                  }
                >
                  <option value="gym">{t("aiRoutineGym")}</option>
                  <option value="home">{t("aiRoutineHome")}</option>
                  <option value="outdoors">{t("aiRoutineOutdoors")}</option>
                </Select>
              </Field>
            </Section>
            <Section>
              <SectionTitle>{t("aiRoutineOptionalConditions")}</SectionTitle>
              <SectionDescription>
                {t("aiRoutineOptionalDescription")}
              </SectionDescription>
              <Field>
                <MusclePicker
                  label={t("aiRoutineFocusLabel")}
                  values={focusMuscleGroups}
                  onApply={setFocusMuscleGroups}
                />
                <HelperText>{t("aiRoutineFocusHint")}</HelperText>
              </Field>
              <Field>
                <Label htmlFor="equipment">
                  {t("aiRoutineEquipmentLabel")}
                </Label>
                <Input
                  id="equipment"
                  value={equipmentText}
                  onChange={(event) => setEquipmentText(event.target.value)}
                  placeholder={t("aiRoutineEquipmentPlaceholder")}
                />
                <HelperText>{t("aiRoutineEquipmentHint")}</HelperText>
              </Field>
              <Field>
                <Label htmlFor="excludedExercises">
                  {t("aiRoutineExcludedLabel")}
                </Label>
                <Input
                  id="excludedExercises"
                  value={excludedExercisesText}
                  onChange={(event) =>
                    setExcludedExercisesText(event.target.value)
                  }
                  placeholder={t("aiRoutineExcludedPlaceholder")}
                />
                <HelperText>{t("aiRoutineExcludedHint")}</HelperText>
              </Field>
              <Field>
                <NotesLabelRow>
                  <Label htmlFor="additionalNotes">
                    {t("aiRoutineRequestsLabel")}
                  </Label>
                  <GuideButton
                    type="button"
                    ref={guideTriggerRef}
                    aria-haspopup="dialog"
                    onClick={() => setIsGuideOpen(true)}
                  >
                    {t("aiRoutineGuideTitle")}
                  </GuideButton>
                </NotesLabelRow>
                <Textarea
                  id="additionalNotes"
                  value={additionalNotes}
                  onChange={(event) => setAdditionalNotes(event.target.value)}
                  maxLength={500}
                  placeholder={t("aiRoutineRequestsPlaceholder")}
                />
                <HelperText>{additionalNotes.length}/500</HelperText>
              </Field>
            </Section>
            {errorMessage && (
              <ErrorMessage role="alert">
                {renderAiRoutineMessage(errorMessage)}
              </ErrorMessage>
            )}
            <SubmitButton type="submit" disabled={isGenerating || isSaving}>
              {isGenerating ? t("aiRoutineGenerating") : t("aiRoutineGenerate")}
            </SubmitButton>
          </Form>
          {generatedRoutine && (
            <GeneratedResult>
              <GeneratedTitle>{generatedRoutine.name}</GeneratedTitle>
              <GeneratedDescription>
                {t("aiRoutineGeneratedDescription").replace(
                  "{count}",
                  String(generatedRoutine.days.length),
                )}
              </GeneratedDescription>
              <GeneratedDayList>
                {generatedRoutine.days.map((day) => {
                  const isExpanded = expandedDayNumbers.includes(day.dayNumber);
                  return (
                    <GeneratedDay key={day.dayNumber}>
                      <GeneratedDayButton
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleGeneratedDay(day.dayNumber)}
                      >
                        <span>
                          {t("aiRoutineDayLabel").replace(
                            "{number}",
                            String(day.dayNumber),
                          )}
                          : {day.name}
                          {" · "}
                          {t("aiRoutineExerciseCount").replace(
                            "{count}",
                            String(day.exercises.length),
                          )}
                        </span>
                        <span>
                          {isExpanded
                            ? t("aiRoutineCollapse")
                            : t("aiRoutineShowDetails")}
                        </span>
                      </GeneratedDayButton>
                      {isExpanded && (
                        <GeneratedDayContent>
                          <TargetMuscles>
                            {t("aiRoutineTargetMuscles")}:{" "}
                            {day.targetMuscleGroups
                              .map(getMuscleGroupLabel)
                              .join(", ")}
                          </TargetMuscles>
                          <ExerciseList>
                            {day.exercises.map((exercise, exerciseIndex) => (
                              <ExerciseCard
                                key={`${day.dayNumber}-${exercise.name}-${exerciseIndex}`}
                              >
                                <ExerciseName>{exercise.name}</ExerciseName>
                                <ExerciseInformation>
                                  {t("aiRoutineExerciseMuscles")}:{" "}
                                  {exercise.muscleGroups
                                    .map(getMuscleGroupLabel)
                                    .join(", ")}
                                </ExerciseInformation>
                                <ExerciseInformation>
                                  {t("workoutRestLabel")}:{" "}
                                  {exercise.restSeconds}{" "}
                                  {t("workoutSecondsUnit")}
                                </ExerciseInformation>
                                <SetList>
                                  {exercise.sets.map((set) => (
                                    <SetBadge key={set.setNumber}>
                                      <SetNumber
                                        aria-label={`${t("workoutSetLabel")} ${set.setNumber}`}
                                      >
                                        {set.setNumber}
                                      </SetNumber>
                                      <span>
                                        {set.targetWeightKg === null
                                          ? t("workoutWeightUnspecified")
                                          : `${set.targetWeightKg} kg`}
                                      </span>
                                      <span aria-hidden="true">×</span>
                                      <span>
                                        {set.targetReps} {t("progressRepsUnit")}
                                      </span>
                                    </SetBadge>
                                  ))}
                                </SetList>
                                {exercise.notes && (
                                  <ExerciseNotes>
                                    {t("aiRoutineNotesLabel")}: {exercise.notes}
                                  </ExerciseNotes>
                                )}
                              </ExerciseCard>
                            ))}
                          </ExerciseList>
                        </GeneratedDayContent>
                      )}
                    </GeneratedDay>
                  );
                })}
              </GeneratedDayList>
              {saveErrorMessage && (
                <SaveErrorMessage role="alert">
                  {renderAiRoutineMessage(saveErrorMessage)}
                </SaveErrorMessage>
              )}
              <ResultActions>
                <SaveButton
                  type="button"
                  onClick={handleSaveRoutine}
                  disabled={isSaving || isGenerating}
                >
                  {isSaving ? t("aiRoutineSaving") : t("aiRoutineSave")}
                </SaveButton>
              </ResultActions>
            </GeneratedResult>
          )}
        </Card>
      </Container>
      {isGuideOpen &&
        createPortal(
          <ModalCard
            ref={guideRef}
            onCancel={(event) => {
              event.preventDefault();
              setIsGuideOpen(false);
            }}
            aria-labelledby="request-guide-title"
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              const rect = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
              )
                setIsGuideOpen(false);
            }}
          >
            <ModalHeader>
              <ModalTitle id="request-guide-title">
                {t("aiRoutineGuideTitle")}
              </ModalTitle>
              <ModalCloseButton
                type="button"
                onClick={() => setIsGuideOpen(false)}
              >
                {t("aiRoutineGuideClose")}
              </ModalCloseButton>
            </ModalHeader>
            <GuideDescription>
              {t("aiRoutineGuideDescription")}
            </GuideDescription>
            <GuideList>
              <li>{t("aiRoutineGuideItem1")}</li>
              <li>{t("aiRoutineGuideItem2")}</li>
              <li>{t("aiRoutineGuideItem3")}</li>
              <li>{t("aiRoutineGuideItem4")}</li>
            </GuideList>
            <GuideExample>{t("aiRoutineGuideExample")}</GuideExample>
            <GuideWarning>{t("aiRoutineGuideWarning")}</GuideWarning>
          </ModalCard>,
          document.body,
        )}
      {blocker.state === "blocked" && shouldBlockNavigation && (
        <CommonModal
          title={navigationCopy.title}
          description={
            isBusy ? navigationCopy.busy : navigationCopy.description
          }
          error={renderAiRoutineMessage(saveErrorMessage)}
          isBusy={isBusy}
          onClose={handleKeepReviewing}
          actions={
            <ModalActions $stacked>
              <ModalButton
                type="button"
                autoFocus
                disabled={isBusy}
                onClick={handleKeepReviewing}
              >
                {navigationCopy.stay}
              </ModalButton>
              <ModalButton
                type="button"
                $tone="danger"
                disabled={isBusy}
                onClick={handleLeaveWithoutSaving}
              >
                {navigationCopy.leave}
              </ModalButton>
              <ModalButton
                type="button"
                $tone="primary"
                disabled={isBusy}
                onClick={() => void handleSaveRoutine()}
              >
                {isSaving ? t("aiRoutineSaving") : navigationCopy.save}
              </ModalButton>
            </ModalActions>
          }
        />
      )}
    </Page>
  );
}
export default AiRoutinePage;
