import { useEffect, useLayoutEffect, useState, useRef, useId } from "react";
import { Link, useParams, useNavigate, useBlocker } from "react-router-dom";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { deleteRoutine, getRoutineById, updateRoutine } from "../api/routines";
import { startWorkout } from "../api/workouts";
import type {
  ExperienceLevel,
  Exercise,
  UpdateRoutineRequest,
  MuscleGroup,
  Routine,
  RoutineGoal,
  WorkoutLocation,
} from "../types/routine";
import { useTranslation } from "../hooks/useTranslation";
import type { TranslationKey } from "../i18n/translations";
import { ApiRequestError } from "../api/translatedRequest";
import CommonModal, {
  ModalActions,
  ModalButton,
} from "../components/common/CommonModal";
import { showSuccessToast } from "../utils/successToast";
import { usePageLoading } from "../hooks/usePageLoading";

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

const SummaryCard = styled.section`
  min-width: 0;
  padding: var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;
const TitleRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
`;
const Title = styled.h1`
  min-width: 0;
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-page-title);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
`;
const TitleActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
`;
const EditLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 10px 12px;
  color: var(--color-primary);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: var(--font-caption);
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  overflow-wrap: anywhere;
  &:hover {
    border-color: var(--color-primary);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;
const DeleteButton = styled.button`
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 10px 12px;
  color: var(--color-error);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: var(--font-caption);
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
  &:hover:not(:disabled) {
    border-color: var(--color-error);
  }
  &:focus-visible {
    outline: 2px solid var(--color-error);
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.6;
  }
`;
const MetaGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  > div:last-child {
    grid-column: 1 / -1;
  }
`;
const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 5px;
  padding: 12px;
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: 10px;
`;
const DayList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
  margin-top: var(--section-gap);
`;
const DayCard = styled.details`
  min-width: 0;
  padding: var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;

const DaySummary = styled.summary`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  min-height: 44px;
  list-style: none;
  cursor: pointer;

  &::-webkit-details-marker {
    display: none;
  }

  > div {
    min-width: 0;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 4px;
    border-radius: 6px;
  }
`;

const DayTitle = styled.h2`
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const DayCount = styled.p`
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.5;
`;

const DayToggleLabel = styled.span`
  flex-shrink: 0;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;

  > span:last-child {
    display: none;
  }

  details[open] > summary & {
    > span:first-child {
      display: none;
    }

    > span:last-child {
      display: inline;
    }
  }
`;

const DayHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);

  > div {
    width: 100%;
    min-width: 0;
  }
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
const InfoLabel = styled.span`
  display: block;
  margin-bottom: 6px;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.5;
`;
const InfoValue = styled.strong`
  color: var(--color-text);
  font-size: 15px;
  font-weight: 600;
`;
const NoteInfo = styled.p`
  margin-top: 12px;
  padding: 12px;
  color: var(--color-text);
  background: var(--color-surface);
  border-left: 3px solid var(--color-border);
  border-radius: 0 8px 8px 0;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;
const MuscleText = styled.div`
  margin-top: 12px;
`;
const StartWorkoutButton = styled.button`
  width: 100%;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 12px 16px;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: var(--radius-control);
  font-size: var(--font-body);
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.6;
  }
`;
const ExerciseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
`;
const ExerciseCard = styled.article<{ $editing?: boolean }>`
  min-width: 0;
  padding: clamp(12px, 3vw, 16px);
  background: var(--color-input);
  border: 1px solid
    ${({ $editing }) =>
      $editing ? "var(--color-primary)" : "var(--color-border)"};
  border-radius: var(--radius-control);
`;
const ExerciseTitle = styled.h3`
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: clamp(16px, 4vw, 18px);
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
const ExerciseInfo = styled.p`
  margin-top: 14px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const SetList = styled.ul`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  margin-top: 14px;
`;
const SetItem = styled.li`
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(8px, 2vw, 12px);
  min-width: 0;
  padding: 12px 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
`;
const SetNumber = styled.span`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
`;
const SetMetric = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  & + & {
    padding-left: clamp(8px, 2vw, 12px);
    border-left: 1px solid var(--color-border);
  }
`;
const SetMetricLabel = styled.span`
  color: var(--color-text-muted);
  font-size: 11px;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
const SetMetricValue = styled.span<{
  $accent?: boolean;
  $unspecified?: boolean;
}>`
  color: ${({ $accent, $unspecified }) =>
    $unspecified
      ? "var(--color-text-muted)"
      : $accent
        ? "var(--color-primary)"
        : "var(--color-text)"};
  font-size: ${({ $unspecified }) =>
    $unspecified ? "13px" : "clamp(17px, 4.5vw, 20px)"};
  font-weight: ${({ $unspecified }) => ($unspecified ? 500 : 700)};
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
const MetaLabel = styled.dt`
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;
const MetaValue = styled.dd`
  margin: 0;
  color: var(--color-text);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;
const ErrorMessage = styled.p`
  padding: var(--card-padding);
  color: var(--color-error);
  background: var(--color-surface);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-card);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const WorkoutErrorMessage = styled(ErrorMessage)`
  margin-top: var(--section-gap);
`;
const MuscleGroupField = styled.div`
  min-width: 0;
  display: grid;
  gap: 7px;

  > p {
    color: var(--color-text);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
  }
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
const WeightHint = styled.p`
  margin-top: 10px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const MuscleSummary = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  > span {
    min-width: 0;
    color: var(--color-text-muted);
    font-size: var(--font-caption);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
`;
const MuscleChangeButton = styled.button`
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
  line-height: 1.4;
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
const ExerciseHeading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  > h3 {
    flex: 1 1 120px;
    margin-bottom: 0;
  }
`;
const InlineEditButton = styled(MuscleChangeButton)`
  max-width: 100%;
  color: var(--color-text);
`;
const EditingBadge = styled.span`
  flex-shrink: 0;
  padding: 4px 8px;
  color: var(--color-primary);
  background: var(--color-surface);
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.5;
`;
const EditorForm = styled.form`
  margin-top: 16px;
`;
const EditorFieldset = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
`;
const EditorField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  > label {
    color: var(--color-text);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
`;
const EditorInput = styled.input`
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
`;
const EditorTextarea = styled.textarea`
  width: 100%;
  min-width: 0;
  min-height: 88px;
  padding: 10px 12px;
  color: var(--color-text);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: 16px;
  line-height: 1.5;
  resize: vertical;
  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;
const EditorSetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const EditorSetRow = styled.div`
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
const EditorSetHeading = styled.p`
  grid-column: 1;
  grid-row: 1;
  color: var(--color-primary);
  font-size: var(--font-caption);
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;
const EditorRemoveSet = styled(InlineEditButton)`
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  max-width: 100%;
  padding: 4px 6px;
  color: var(--color-error);
  background: transparent;
  border-color: transparent;
  font-size: 12px;
`;
const EditorAddSet = styled(MuscleChangeButton)`
  width: 100%;
  border-style: dashed;
`;
const EditorError = styled(ErrorMessage)`
  margin-top: 16px;
  padding: 12px;
`;

const goalLabels: Record<RoutineGoal, TranslationKey> = {
  muscle_gain: "routineGoalMuscleGain",
  strength: "routineGoalStrength",
  weight_loss: "routineGoalWeightLoss",
  general_fitness: "routineGoalGeneralFitness",
};
const experienceLabels: Record<ExperienceLevel, TranslationKey> = {
  beginner: "aiRoutineBeginner",
  intermediate: "aiRoutineIntermediate",
  advanced: "aiRoutineAdvanced",
};
const locationLabels: Record<WorkoutLocation, TranslationKey> = {
  gym: "aiRoutineGym",
  home: "aiRoutineHome",
  outdoors: "aiRoutineOutdoors",
};
const muscleGroupLabels: Record<MuscleGroup, TranslationKey> = {
  chest: "muscleChest",
  back: "muscleBack",
  shoulders: "muscleShoulders",
  biceps: "muscleBiceps",
  triceps: "muscleTriceps",
  quadriceps: "muscleQuadriceps",
  hamstrings: "muscleHamstrings",
  glutes: "muscleGlutes",
  calves: "muscleCalves",
  core: "muscleCore",
  cardio: "muscleCardio",
  full_body: "muscleFullBody",
  other: "muscleOther",
};
type RoutineDetailMessage =
  | ""
  | { translationKey: TranslationKey }
  | { message: string };
function getRoutineDetailError(
  error: unknown,
  fallbackKey: TranslationKey,
): RoutineDetailMessage {
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
function getLocalWorkoutDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
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
      <InfoValue as="p">{label}</InfoValue>
      <MuscleSummary>
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
const detailUiCopy = {
  ko: {
    edit: "수정",
    editing: "수정 중",
    save: "변경 저장",
    saved: "변경사항을 저장했습니다.",
    conflict:
      "이 종목이 다른 곳에서 변경되었습니다. 취소 후 페이지를 새로고침해 다시 확인해주세요.",
    missing: "이 종목을 찾을 수 없습니다. 페이지를 새로고침해주세요.",
    abandoned: "화면이 변경되어 저장을 중단했습니다.",
  },
  ja: {
    edit: "編集",
    editing: "編集中",
    save: "変更を保存",
    saved: "変更を保存しました。",
    conflict:
      "この種目は別の場所で変更されました。キャンセルしてページを再読み込みし、確認してください。",
    missing: "種目が見つかりません。ページを再読み込みしてください。",
    abandoned: "画面が変更されたため、保存を中止しました。",
  },
  en: {
    edit: "Edit",
    editing: "Editing",
    save: "Save changes",
    saved: "Changes saved.",
    conflict:
      "This exercise changed elsewhere. Cancel and reload the page before editing again.",
    missing: "This exercise no longer exists. Please reload the page.",
    abandoned: "Saving was stopped because the page changed.",
  },
};
type EditorSet = { key: string; weight: string; reps: string };
// The array order of muscle groups is not a content change.
function sameExercise(left: Exercise, right: Exercise): boolean {
  return (
    left.id === right.id &&
    left.name === right.name &&
    left.restSeconds === right.restSeconds &&
    left.notes === right.notes &&
    JSON.stringify([...left.muscleGroups].sort()) ===
      JSON.stringify([...right.muscleGroups].sort()) &&
    left.sets.length === right.sets.length &&
    left.sets.every((set, index) => {
      const other = right.sets[index];
      return (
        set.setNumber === other.setNumber &&
        set.targetReps === other.targetReps &&
        set.targetWeightKg === other.targetWeightKg
      );
    })
  );
}
function ExerciseEditor({
  exercise,
  onSave,
  onCancel,
  onDirtyChange,
  onSavingChange,
}: {
  exercise: Exercise;
  onSave: (next: Exercise) => Promise<void>;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const { t, language } = useTranslation();
  const copy = formUiCopy[language];
  const detailCopy = detailUiCopy[language];
  const fieldId = useId();
  const [name, setName] = useState(exercise.name);
  const [muscles, setMuscles] = useState([...exercise.muscleGroups]);
  const [rest, setRest] = useState(String(exercise.restSeconds));
  const [notes, setNotes] = useState(exercise.notes);
  const [sets, setSets] = useState<EditorSet[]>(() =>
    exercise.sets.map((set) => ({
      key: crypto.randomUUID(),
      weight: set.targetWeightKg === null ? "" : String(set.targetWeightKg),
      reps: String(set.targetReps),
    })),
  );
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);
  const [saveError, setSaveError] = useState<RoutineDetailMessage>("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  const isDirty =
    name !== exercise.name ||
    notes !== exercise.notes ||
    rest !== String(exercise.restSeconds) ||
    JSON.stringify([...muscles].sort()) !==
      JSON.stringify([...exercise.muscleGroups].sort()) ||
    JSON.stringify(sets.map(({ weight, reps }) => ({ weight, reps }))) !==
      JSON.stringify(
        exercise.sets.map((set) => ({
          weight: set.targetWeightKg === null ? "" : String(set.targetWeightKg),
          reps: String(set.targetReps),
        })),
      );

  // Report committed input changes before the next user interaction.
  useLayoutEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    return () => onSavingChange(false);
  }, [onSavingChange]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    if (saveError) errorRef.current?.focus({ preventScroll: true });
  }, [saveError]);
  function validateDraft(): TranslationKey | null {
    if (!name.trim() || name.trim().length > 100)
      return "routineFormItemNameRequired";
    if (!muscles.length) return "routineFormExerciseMusclesRequired";
    if (
      !rest.trim() ||
      !Number.isInteger(Number(rest)) ||
      Number(rest) < 0 ||
      Number(rest) > 600
    )
      return "routineFormRestInvalid";
    if (notes.length > 500) return "apiInvalidRequest";
    if (!sets.length) return "routineFormSetsRequired";
    for (const set of sets) {
      if (
        !set.reps.trim() ||
        !Number.isInteger(Number(set.reps)) ||
        Number(set.reps) < 1 ||
        Number(set.reps) > 100
      )
        return "routineFormRepsInvalid";
      if (
        set.weight.trim() &&
        (!Number.isFinite(Number(set.weight)) ||
          Number(set.weight) < 0 ||
          Number(set.weight) > 1000)
      )
        return "routineFormWeightInvalid";
    }
    return null;
  }
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (savingRef.current) return;
    const invalid = validateDraft();
    if (invalid) {
      setSaveError({ translationKey: invalid });
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    onSavingChange(true);
    setSaveError("");
    try {
      await onSave({
        ...exercise,
        name: name.trim(),
        muscleGroups: [...muscles],
        restSeconds: Number(rest),
        notes,
        sets: sets.map((set, index) => ({
          setNumber: index + 1,
          targetWeightKg: set.weight.trim() === "" ? null : Number(set.weight),
          targetReps: Number(set.reps),
        })),
      });
    } catch (error) {
      if (mountedRef.current)
        setSaveError(getRoutineDetailError(error, "routineUpdateFailed"));
    } finally {
      savingRef.current = false;
      onSavingChange(false);
      if (mountedRef.current) setIsSaving(false);
    }
  }
  function updateSet(
    key: string,
    field: "weight" | "reps",
    value: string,
  ): void {
    setSets((current) =>
      current.map((set) =>
        set.key === key ? { ...set, [field]: value } : set,
      ),
    );
  }
  return (
    <EditorForm
      onSubmit={submit}
      noValidate
      aria-label={`${exercise.name}: ${detailCopy.edit}`}
    >
      <EditorFieldset disabled={isSaving}>
        <EditorField>
          <label htmlFor={`${fieldId}-name`}>
            {t("routineFormExerciseName")}
          </label>
          <EditorInput
            id={`${fieldId}-name`}
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
          />
        </EditorField>
        <MusclePicker
          label={t("aiRoutineExerciseMuscles")}
          values={muscles}
          onApply={setMuscles}
        />
        <EditorField>
          <label htmlFor={`${fieldId}-rest`}>{t("routineFormRestLabel")}</label>
          <EditorInput
            id={`${fieldId}-rest`}
            type="number"
            min={0}
            max={600}
            value={rest}
            onChange={(e) => setRest(e.target.value)}
          />
        </EditorField>
        <EditorField>
          <label htmlFor={`${fieldId}-notes`}>
            {t("routineFormExerciseNotes")}
          </label>
          <EditorTextarea
            id={`${fieldId}-notes`}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </EditorField>
        <EditorSetList>
          {sets.map((set, index) => (
            <EditorSetRow key={set.key}>
              <EditorSetHeading>
                {t("workoutSetLabel")} {index + 1}
              </EditorSetHeading>
              <EditorField>
                <label htmlFor={`${fieldId}-${set.key}-weight`}>
                  {t("routineFormTargetWeight")}
                </label>
                <EditorInput
                  id={`${fieldId}-${set.key}-weight`}
                  type="number"
                  min={0}
                  max={1000}
                  step={0.5}
                  placeholder={copy.optional}
                  aria-describedby={`${fieldId}-hint`}
                  value={set.weight}
                  onChange={(e) => updateSet(set.key, "weight", e.target.value)}
                />
              </EditorField>
              <EditorField>
                <label htmlFor={`${fieldId}-${set.key}-reps`}>
                  {t("routineFormTargetReps")}
                </label>
                <EditorInput
                  id={`${fieldId}-${set.key}-reps`}
                  type="number"
                  min={1}
                  max={100}
                  value={set.reps}
                  onChange={(e) => updateSet(set.key, "reps", e.target.value)}
                />
              </EditorField>
              <EditorRemoveSet
                type="button"
                onClick={() =>
                  setSets((current) =>
                    current.filter((item) => item.key !== set.key),
                  )
                }
              >
                {t("routineFormRemoveSet")}
              </EditorRemoveSet>
            </EditorSetRow>
          ))}
        </EditorSetList>
        <WeightHint id={`${fieldId}-hint`}>
          {t("workoutWeightPlaceholder")}
        </WeightHint>
        <EditorAddSet
          type="button"
          onClick={() => {
            const next: EditorSet = {
              key: crypto.randomUUID(),
              weight: "",
              reps: "10",
            };
            setSets((current) => [...current, next]);
          }}
        >
          {t("routineFormAddSet")}
        </EditorAddSet>
      </EditorFieldset>
      {saveError && (
        <EditorError role="alert" tabIndex={-1} ref={errorRef}>
          {"translationKey" in saveError
            ? t(saveError.translationKey)
            : saveError.message}
        </EditorError>
      )}
      <DialogActions>
        <InlineEditButton type="button" disabled={isSaving} onClick={onCancel}>
          {copy.cancel}
        </InlineEditButton>
        <DialogApplyButton type="submit" disabled={isSaving}>
          {isSaving ? t("routineFormSaving") : detailCopy.save}
        </DialogApplyButton>
      </DialogActions>
    </EditorForm>
  );
}
function RoutineDetailPage() {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const backLabel = {
    ko: "뒤로가기",
    ja: "戻る",
    en: "Back",
  }[language];
  const detailCopy = detailUiCopy[language];
  const dayViewCopy = {
    ko: {
      open: "자세히 보기",
      close: "접기",
      count: "운동 {count}개",
    },
    ja: {
      open: "詳細を見る",
      close: "閉じる",
      count: "種目 {count}件",
    },
    en: {
      open: "View details",
      close: "Collapse",
      count: "{count} exercises",
    },
  }[language];
  const [editingTarget, setEditingTarget] = useState<{
    dayId: string;
    exerciseId: string;
  } | null>(null);
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  const [isEditorSaving, setIsEditorSaving] = useState(false);
  const shouldBlockNavigation =
    editingTarget !== null && (isEditorDirty || isEditorSaving);
  const blocker = useBlocker(shouldBlockNavigation);
  const navigationCopy = {
    ko: {
      title: "수정 중인 내용을 두고 이동할까요?",
      description: "저장하지 않은 운동 변경사항은 사라집니다.",
      saving: "변경사항을 저장하고 있습니다. 잠시 기다려주세요.",
      stay: "계속 수정",
      leave: "저장하지 않고 이동",
    },
    ja: {
      title: "変更を保存せずに移動しますか？",
      description: "保存していない種目の変更内容は失われます。",
      saving: "変更内容を保存しています。しばらくお待ちください。",
      stay: "編集を続ける",
      leave: "保存せずに移動",
    },
    en: {
      title: "Leave without saving?",
      description: "Your unsaved exercise changes will be lost.",
      saving: "Saving your changes. Please wait.",
      stay: "Keep editing",
      leave: "Leave without saving",
    },
  }[language];

  useEffect(() => {
    if (blocker.state === "blocked" && !shouldBlockNavigation)
      blocker.proceed();
  }, [blocker, shouldBlockNavigation]);

  useEffect(() => {
    if (!shouldBlockNavigation) return;
    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldBlockNavigation]);

  function handleKeepEditing(): void {
    if (!isEditorSaving && blocker.state === "blocked") blocker.reset();
  }

  function handleLeaveWithoutSaving(): void {
    if (!isEditorSaving && blocker.state === "blocked") blocker.proceed();
  }
  const pageVersionRef = useRef(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] =
    useState<RoutineDetailMessage>("");
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<RoutineDetailMessage>("");

  usePageLoading(isLoading);

  const [startingRoutineDayId, setStartingRoutineDayId] = useState<
    string | null
  >(null);
  const [workoutErrorMessage, setWorkoutErrorMessage] =
    useState<RoutineDetailMessage>("");

  function handleBack(): void {
    if (isDeleting || startingRoutineDayId !== null || isEditorSaving) {
      return;
    }

    const historyIndex: unknown = window.history.state?.idx;

    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate("/routines", {
        replace: true,
      });
    }
  }
  function renderRoutineDetailMessage(value: RoutineDetailMessage): string {
    if (value === "") {
      return "";
    }
    if ("message" in value) {
      return value.message;
    }
    return t(value.translationKey);
  }
  useEffect(() => {
    let isMounted = true;
    pageVersionRef.current += 1;
    setIsLoading(true);
    setRoutine(null);
    setErrorMessage("");
    setIsDeleteConfirmOpen(false);
    setDeleteErrorMessage("");
    setWorkoutErrorMessage("");
    setEditingTarget(null);
    setIsEditorDirty(false);
    setIsEditorSaving(false);
    async function loadRoutine(): Promise<void> {
      if (!routineId) {
        setErrorMessage({
          translationKey: "routineIdRequired",
        });
        setIsLoading(false);
        return;
      }
      try {
        const result = await getRoutineById(routineId);
        if (isMounted) {
          setRoutine(result.routine);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(getRoutineDetailError(error, "routineLoadFailed"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    void loadRoutine();
    return () => {
      isMounted = false;
      pageVersionRef.current += 1;
    };
  }, [routineId]);
  async function handleExerciseSave(
    dayId: string,
    original: Exercise,
    next: Exercise,
  ): Promise<void> {
    if (!routineId) throw new Error(detailCopy.missing);
    const version = pageVersionRef.current;
    const latest = (await getRoutineById(routineId)).routine;
    if (version !== pageVersionRef.current)
      throw new Error(detailCopy.abandoned);
    const latestDay = latest.days.find((day) => day.id === dayId);
    const latestExercise = latestDay?.exercises.find(
      (exercise) => exercise.id === original.id,
    );
    if (!latestExercise) throw new Error(detailCopy.missing);
    if (!sameExercise(latestExercise, original))
      throw new Error(detailCopy.conflict);
    const payload: UpdateRoutineRequest = {
      name: latest.name,
      goal: latest.goal,
      experienceLevel: latest.experienceLevel,
      weeklyFrequency: latest.weeklyFrequency,
      sessionDurationMinutes: latest.sessionDurationMinutes,
      location: latest.location,
      days: latest.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) =>
          day.id === dayId && exercise.id === original.id
            ? { ...next, id: original.id }
            : exercise,
        ),
      })),
    };
    const result = await updateRoutine(routineId, payload);
    if (version !== pageVersionRef.current) return;
    setRoutine(result.routine);
    setEditingTarget(null);
    showSuccessToast();
  }
  async function handleDelete(): Promise<void> {
    if (
      !routineId ||
      !isDeleteConfirmOpen ||
      isDeleting ||
      editingTarget !== null ||
      startingRoutineDayId !== null
    ) {
      return;
    }

    setDeleteErrorMessage("");
    setIsDeleting(true);

    try {
      await deleteRoutine(routineId);

      navigate("/routines", {
        replace: true,
      });
    } catch (error) {
      setDeleteErrorMessage(
        getRoutineDetailError(error, "routineDeleteFailed"),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleStartWorkout(routineDayId: string): Promise<void> {
    if (
      !routine ||
      startingRoutineDayId !== null ||
      isDeleting ||
      editingTarget !== null
    ) {
      return;
    }
    setWorkoutErrorMessage("");
    setStartingRoutineDayId(routineDayId);
    try {
      const result = await startWorkout({
        routineId: routine.id,
        routineDayId,
        workoutDate: getLocalWorkoutDate(),
      });
      navigate(`/workouts/${result.workout.id}`);
    } catch (error) {
      setWorkoutErrorMessage(
        getRoutineDetailError(error, "workoutStartFailed"),
      );
    } finally {
      setStartingRoutineDayId(null);
    }
  }
  return (
    <Page>
      <Container>
        <BackButton
          type="button"
          onClick={handleBack}
          disabled={
            isDeleting || startingRoutineDayId !== null || isEditorSaving
          }
        >
          <span aria-hidden="true">←</span>
          {backLabel}
        </BackButton>

        {!isLoading && errorMessage && (
          <ErrorMessage role="alert">
            {renderRoutineDetailMessage(errorMessage)}
          </ErrorMessage>
        )}
        {!isLoading && !errorMessage && routine && (
          <>
            <SummaryCard>
              <TitleRow>
                <Title>{routine.name}</Title>
                <TitleActions>
                  <EditLink
                    to={`/routines/${routine.id}/edit`}
                    aria-disabled={
                      editingTarget !== null ||
                      isDeleting ||
                      startingRoutineDayId !== null
                    }
                    onClick={(event) => {
                      if (
                        editingTarget !== null ||
                        isDeleting ||
                        startingRoutineDayId !== null
                      )
                        event.preventDefault();
                    }}
                    style={
                      editingTarget !== null ||
                      isDeleting ||
                      startingRoutineDayId !== null
                        ? { opacity: 0.6, cursor: "not-allowed" }
                        : undefined
                    }
                  >
                    {t("routineEdit")}
                  </EditLink>
                  <DeleteButton
                    type="button"
                    onClick={() => {
                      setDeleteErrorMessage("");
                      setIsDeleteConfirmOpen(true);
                    }}
                    disabled={
                      isDeleting ||
                      editingTarget !== null ||
                      startingRoutineDayId !== null
                    }
                  >
                    {isDeleting ? t("routineDeleting") : t("routineDelete")}
                  </DeleteButton>
                </TitleActions>
              </TitleRow>
              <MetaGrid>
                <MetaItem>
                  <MetaLabel>{t("dashboardGoal")}</MetaLabel>
                  <MetaValue>{t(goalLabels[routine.goal])}</MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>{t("aiRoutineExperienceLabel")}</MetaLabel>
                  <MetaValue>
                    {t(experienceLabels[routine.experienceLevel])}
                  </MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>{t("dashboardWeeklyFrequency")}</MetaLabel>
                  <MetaValue>
                    {t("routineWeeklyFrequencyValue").replace(
                      "{count}",
                      String(routine.weeklyFrequency),
                    )}
                  </MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>{t("dashboardEstimatedDuration")}</MetaLabel>
                  <MetaValue>
                    {routine.sessionDurationMinutes} {t("dashboardMinuteUnit")}
                  </MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>{t("aiRoutineLocationLabel")}</MetaLabel>
                  <MetaValue>{t(locationLabels[routine.location])}</MetaValue>
                </MetaItem>
              </MetaGrid>
            </SummaryCard>
            {workoutErrorMessage && (
              <WorkoutErrorMessage role="alert">
                {renderRoutineDetailMessage(workoutErrorMessage)}
              </WorkoutErrorMessage>
            )}
            <DayList>
              {routine.days.map((day) => (
                <DayCard key={day.id}>
                  <DaySummary>
                    <div>
                      <DayTitle>
                        {t("aiRoutineDayLabel").replace(
                          "{number}",
                          String(day.dayNumber),
                        )}
                        {" · "}
                        {day.name}
                      </DayTitle>

                      <DayCount>
                        {dayViewCopy.count.replace(
                          "{count}",
                          String(day.exercises.length),
                        )}
                      </DayCount>
                    </div>

                    <DayToggleLabel aria-hidden="true">
                      <span>{dayViewCopy.open}</span>
                      <span>{dayViewCopy.close}</span>
                    </DayToggleLabel>
                  </DaySummary>

                  <DayHeader>
                    <div>
                      <DayTitle>
                        {t("aiRoutineDayLabel").replace(
                          "{number}",
                          String(day.dayNumber),
                        )}
                        {" · "}
                        {day.name}
                      </DayTitle>
                      <MuscleText>
                        <InfoLabel>{t("aiRoutineTargetMuscles")}</InfoLabel>
                        <MuscleTags>
                          {day.targetMuscleGroups.map((group) => (
                            <MuscleTag key={group}>
                              {t(muscleGroupLabels[group])}
                            </MuscleTag>
                          ))}
                        </MuscleTags>
                      </MuscleText>
                    </div>
                    <StartWorkoutButton
                      type="button"
                      onClick={() => void handleStartWorkout(day.id)}
                      disabled={
                        startingRoutineDayId !== null ||
                        isDeleting ||
                        editingTarget !== null
                      }
                    >
                      {startingRoutineDayId === day.id
                        ? t("calendarStartingWorkout")
                        : t("calendarStartWorkout")}
                    </StartWorkoutButton>
                  </DayHeader>
                  <ExerciseList>
                    {day.exercises.map((exercise) => (
                      <ExerciseCard
                        key={exercise.id}
                        $editing={
                          editingTarget?.dayId === day.id &&
                          editingTarget.exerciseId === exercise.id
                        }
                      >
                        <ExerciseHeading>
                          <ExerciseTitle>{exercise.name}</ExerciseTitle>
                          {editingTarget?.dayId === day.id &&
                          editingTarget.exerciseId === exercise.id ? (
                            <EditingBadge>{detailCopy.editing}</EditingBadge>
                          ) : (
                            <InlineEditButton
                              type="button"
                              aria-label={`${exercise.name}: ${detailCopy.edit}`}
                              disabled={
                                editingTarget !== null ||
                                isDeleting ||
                                startingRoutineDayId !== null
                              }
                              onClick={() => {
                                setIsEditorDirty(false);
                                setIsEditorSaving(false);
                                setEditingTarget({
                                  dayId: day.id,
                                  exerciseId: exercise.id,
                                });
                              }}
                            >
                              {detailCopy.edit}
                            </InlineEditButton>
                          )}
                        </ExerciseHeading>
                        {editingTarget?.dayId === day.id &&
                        editingTarget.exerciseId === exercise.id ? (
                          <ExerciseEditor
                            exercise={exercise}
                            onSave={(next) =>
                              handleExerciseSave(day.id, exercise, next)
                            }
                            onDirtyChange={setIsEditorDirty}
                            onSavingChange={setIsEditorSaving}
                            onCancel={() => setEditingTarget(null)}
                          />
                        ) : (
                          <>
                            <MuscleText>
                              <InfoLabel>
                                {t("aiRoutineExerciseMuscles")}
                              </InfoLabel>
                              <MuscleTags>
                                {exercise.muscleGroups.map((group) => (
                                  <MuscleTag key={group}>
                                    {t(muscleGroupLabels[group])}
                                  </MuscleTag>
                                ))}
                              </MuscleTags>
                            </MuscleText>
                            <ExerciseInfo>
                              <InfoLabel>{t("workoutRestLabel")}</InfoLabel>
                              <InfoValue>
                                {exercise.restSeconds} {t("workoutSecondsUnit")}
                              </InfoValue>
                            </ExerciseInfo>
                            {exercise.notes && (
                              <NoteInfo>
                                <InfoLabel>
                                  {t("aiRoutineNotesLabel")}
                                </InfoLabel>
                                {exercise.notes}
                              </NoteInfo>
                            )}
                            <SetList>
                              {exercise.sets.map((exerciseSet) => (
                                <SetItem key={exerciseSet.setNumber}>
                                  <SetNumber
                                    aria-label={`${t("workoutSetLabel")} ${exerciseSet.setNumber}`}
                                  >
                                    {exerciseSet.setNumber}
                                  </SetNumber>
                                  <SetMetric>
                                    <SetMetricLabel>
                                      {t("routineFormTargetWeight")}
                                    </SetMetricLabel>
                                    <SetMetricValue
                                      $unspecified={
                                        exerciseSet.targetWeightKg === null
                                      }
                                    >
                                      {exerciseSet.targetWeightKg === null
                                        ? t("workoutWeightUnspecified")
                                        : `${exerciseSet.targetWeightKg}kg`}
                                    </SetMetricValue>
                                  </SetMetric>
                                  <SetMetric>
                                    <SetMetricLabel>
                                      {t("routineFormTargetReps")}
                                    </SetMetricLabel>
                                    <SetMetricValue $accent>
                                      {exerciseSet.targetReps}{" "}
                                      {t("progressRepsUnit")}
                                    </SetMetricValue>
                                  </SetMetric>
                                </SetItem>
                              ))}
                            </SetList>
                          </>
                        )}
                      </ExerciseCard>
                    ))}
                  </ExerciseList>
                </DayCard>
              ))}
            </DayList>
          </>
        )}
      </Container>

      {isDeleteConfirmOpen && routine && (
        <CommonModal
          title={t("routineDelete")}
          description={`${routine.name}\n\n${t("routineDeleteConfirm")}`}
          error={renderRoutineDetailMessage(deleteErrorMessage)}
          isBusy={isDeleting}
          onClose={() => setIsDeleteConfirmOpen(false)}
          actions={
            <ModalActions>
              <ModalButton
                type="button"
                autoFocus
                disabled={isDeleting}
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                {t("calendarCancel")}
              </ModalButton>

              <ModalButton
                type="button"
                $tone="danger"
                disabled={isDeleting}
                onClick={() => {
                  void handleDelete();
                }}
              >
                {isDeleting ? t("routineDeleting") : t("routineDelete")}
              </ModalButton>
            </ModalActions>
          }
        />
      )}
      {blocker.state === "blocked" && shouldBlockNavigation && (
        <CommonModal
          title={navigationCopy.title}
          description={
            isEditorSaving ? navigationCopy.saving : navigationCopy.description
          }
          isBusy={isEditorSaving}
          onClose={handleKeepEditing}
          actions={
            <ModalActions>
              <ModalButton
                type="button"
                autoFocus
                disabled={isEditorSaving}
                onClick={handleKeepEditing}
              >
                {navigationCopy.stay}
              </ModalButton>
              <ModalButton
                type="button"
                $tone="danger"
                disabled={isEditorSaving}
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
export default RoutineDetailPage;
