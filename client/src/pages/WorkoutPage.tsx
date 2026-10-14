import { useEffect, useState, useId, useRef } from "react";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import styled, { css } from "styled-components";
import {
  completeWorkout,
  deleteWorkout,
  getWorkoutById,
  updateCompletedWorkout,
  updateWorkoutSet,
} from "../api/workouts";
import type { Workout, WorkoutExercise } from "../types/workout";
import { useTranslation } from "../hooks/useTranslation";
import type { MuscleGroup } from "../types/routine";
import type { TranslationKey } from "../i18n/translations";
import { ApiRequestError } from "../api/translatedRequest";
import CommonModal, {
  ModalActions,
  ModalButton,
} from "../components/common/CommonModal";
import { showSuccessToast } from "../utils/successToast";

type WorkoutMessage =
  | ""
  | {
      translationKey: TranslationKey;
      exerciseName?: string;
      setNumber?: number;
    }
  | {
      message: string;
    };

function getWorkoutError(
  error: unknown,
  fallbackKey: TranslationKey,
): WorkoutMessage {
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

interface SetDraft {
  actualWeightKg: string;
  actualReps: string;
  isCompleted: boolean;
}

function getSetDraftKey(routineExerciseId: string, setNumber: number): string {
  return `${routineExerciseId}-${setNumber}`;
}

function createSetDrafts(workout: Workout): Record<string, SetDraft> {
  const drafts: Record<string, SetDraft> = {};

  workout.exercises.forEach((exercise) => {
    exercise.sets.forEach((set) => {
      const key = getSetDraftKey(exercise.routineExerciseId, set.setNumber);

      drafts[key] = {
        actualWeightKg:
          set.actualWeightKg !== null
            ? String(set.actualWeightKg)
            : workout.status === "in_progress" && set.targetWeightKg !== null
              ? String(set.targetWeightKg)
              : "",

        actualReps:
          set.actualReps !== null
            ? String(set.actualReps)
            : workout.status === "in_progress"
              ? String(set.targetReps)
              : "",

        isCompleted:
          workout.status === "completed"
            ? set.actualReps !== null && set.actualReps > 0
            : set.isCompleted,
      };
    });
  });

  return drafts;
}

function hasSetDraftChanges(
  workout: Workout,
  setDrafts: Record<string, SetDraft>,
): boolean {
  const originalDrafts = createSetDrafts(workout);

  return workout.exercises.some((exercise) =>
    exercise.sets.some((set) => {
      const key = getSetDraftKey(exercise.routineExerciseId, set.setNumber);

      const currentDraft = setDrafts[key];

      const originalDraft = originalDrafts[key];

      if (!currentDraft || !originalDraft) {
        return true;
      }

      return (
        currentDraft.actualReps !== originalDraft.actualReps ||
        currentDraft.actualWeightKg !== originalDraft.actualWeightKg ||
        currentDraft.isCompleted !== originalDraft.isCompleted
      );
    }),
  );
}

function hasCompletedWorkoutChanges(
  workout: Workout,
  setDrafts: Record<string, SetDraft>,
  workoutNotes: string,
  deletedExerciseIds: string[],
): boolean {
  if (deletedExerciseIds.length > 0) {
    return true;
  }

  const hasNoteChanges = workoutNotes.trim() !== workout.notes;

  if (hasNoteChanges) {
    return true;
  }

  return hasSetDraftChanges(workout, setDrafts);
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

const Title = styled.h1`
  margin-bottom: 16px;
  font-size: var(--font-page-title);
  line-height: 1.3;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
`;

const SummaryText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: 10px;
`;

const StatusText = styled.strong`
  align-self: flex-start;
  color: var(--color-primary);
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgb(121 226 190 / 10%);
`;

const WorkoutActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
`;

const EditWorkoutButton = styled.button<{ $isEditing: boolean }>`
  ${buttonStyle}
  color:var(--color-primary);
  background: var(--color-input);
  &:hover:not(:disabled) {
    border-color: var(--color-primary);
  }
  border-color: ${({ $isEditing }) =>
    $isEditing ? "var(--color-primary)" : "var(--color-border)"};
`;

const DeleteWorkoutButton = styled.button`
  ${buttonStyle}
  color:var(--color-error);
  background: var(--color-input);
  &:hover:not(:disabled) {
    border-color: var(--color-error);
  }
`;

const WorkoutActionErrorMessage = styled.p`
  padding: 12px;
  color: var(--color-error);
  background: var(--color-input);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-control);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
  margin-top: 16px;
`;

const ExerciseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
  margin-top: var(--section-gap);
`;

const ExerciseCard = styled.section`
  min-width: 0;
  padding: var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;

const ExerciseHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
`;

const DeleteExerciseButton = styled.button`
  ${buttonStyle}
  color:var(--color-error);
  background: var(--color-input);
  &:hover:not(:disabled) {
    border-color: var(--color-error);
  }
`;

const RestoreExerciseButton = styled.button`
  ${buttonStyle}
  color:var(--color-primary);
  background: var(--color-input);
  &:hover:not(:disabled) {
    border-color: var(--color-primary);
  }
`;

const ExerciseDeletionNotice = styled.p`
  padding: 12px;
  color: var(--color-error);
  background: var(--color-input);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-control);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const ExerciseTitle = styled.h2`
  min-width: 0;
  font-size: var(--font-section-title);
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const ExerciseInfo = styled.p`
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
  margin-top: 14px;
`;

const SetList = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 18px;
`;

const SetItem = styled.div<{ $isCompleted: boolean }>`
  min-width: 0;
  padding: 12px;
  background: var(--color-input);
  border: 1px solid
    ${({ $isCompleted }) =>
      $isCompleted ? "var(--color-primary)" : "var(--color-border)"};
  border-radius: var(--radius-control);
`;

const SetText = styled.p`
  margin-top: 10px;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const SetForm = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-items: end;
  margin-top: 14px;
`;

const SetField = styled.label`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 6px;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const SetInput = styled.input`
  ${controlStyle}
  padding:10px 8px;
`;

const SetSaveButton = styled.button<{ $isCompleted: boolean }>`
  ${buttonStyle}
  color:var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
  font-weight: 700;
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  background: ${({ $isCompleted }) =>
    $isCompleted ? "var(--color-surface)" : "var(--color-primary)"};
  color: ${({ $isCompleted }) =>
    $isCompleted ? "var(--color-primary)" : "var(--color-on-primary)"};
  &:hover:not(:disabled) {
    background: ${({ $isCompleted }) =>
      $isCompleted ? "var(--color-background)" : "var(--color-primary-hover)"};
  }
`;

const SetButtonGroup = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  > button {
    flex: 1 1 110px;
  }
`;

const UndoSetCompletionButton = styled.button`
  ${buttonStyle}
  color:var(--color-primary);
  background: var(--color-input);
  &:hover:not(:disabled) {
    border-color: var(--color-primary);
  }
`;

const ClearSetRecordButton = styled.button`
  ${buttonStyle}
  color:var(--color-error);
  background: var(--color-input);
  &:hover:not(:disabled) {
    border-color: var(--color-error);
  }
`;

const SetErrorMessage = styled.p`
  padding: 12px;
  color: var(--color-error);
  background: var(--color-input);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-control);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
  margin-top: 16px;
`;

const CompletionSection = styled.section`
  min-width: 0;
  padding: var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  margin-top: var(--section-gap);
`;

const CompletionTitle = styled.h2`
  margin-bottom: 16px;
  font-size: var(--font-section-title);
  line-height: 1.4;
`;

const WorkoutNotesLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: 15px;
  font-weight: 700;
`;

const WorkoutNotesInput = styled.textarea`
  ${controlStyle}
  min-height:110px;
  resize: vertical;
`;

const CompleteWorkoutButton = styled.button`
  ${buttonStyle}
  color:var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
  font-weight: 700;
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  width: 100%;
  margin-top: 16px;
`;

const SaveWorkoutEditButton = styled.button`
  ${buttonStyle}
  color:var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
  font-weight: 700;
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  width: 100%;
  margin-top: 16px;
`;

const CompletionMessage = styled.p`
  margin-top: 16px;
  padding: 12px;
  color: var(--color-primary);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: 14px;
  line-height: 1.6;
`;

const ContinueEditingButton = styled.button`
  ${buttonStyle}
  color:var(--color-primary);
  background: var(--color-input);
  &:hover:not(:disabled) {
    border-color: var(--color-primary);
  }
`;

const ConfirmCompleteButton = styled.button`
  ${buttonStyle}
  color:var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
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
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  > div:first-child {
    grid-column: 1 / -1;
  }
`;
const InfoLabel = styled.span`
  display: block;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
`;
const InfoValue = styled.strong`
  color: var(--color-text);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const RoutineNote = styled.p`
  margin-top: 14px;
  padding: 12px;
  color: var(--color-text);
  background: var(--color-input);
  border-left: 3px solid var(--color-border);
  border-radius: 0 8px 8px 0;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;
const SetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;
const SetNumber = styled.span<{ $isCompleted: boolean }>`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: ${({ $isCompleted }) =>
    $isCompleted ? "var(--color-on-primary)" : "var(--color-text-muted)"};
  background: ${({ $isCompleted }) =>
    $isCompleted ? "var(--color-primary)" : "var(--color-border)"};
  border-radius: 50%;
  font-weight: 700;
`;
const SetContent = styled.div<{ $readOnly: boolean }>`
  display: ${({ $readOnly }) => ($readOnly ? "grid" : "block")};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  > p {
    min-width: 0;
  }
`;

const SetStatus = styled.span<{ $isCompleted: boolean }>`
  color: ${({ $isCompleted }) =>
    $isCompleted ? "var(--color-primary)" : "var(--color-text-muted)"};
  font-size: 13px;
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
`;
const WeightHint = styled.p`
  grid-column: 1 / -1;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const MuscleTags = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  min-width: 0;
  gap: 6px;
  margin-top: 8px;
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
type RecordSetDraft = {
  setNumber: number;
  targetWeightKg: string;
  targetReps: string;
  actualWeightKg: string;
  actualReps: string;
};
type RecordExerciseDraft = {
  original: WorkoutExercise;
  nextSetNumber: number;
  name: string;
  muscleGroups: MuscleGroup[];
  restSeconds: string;
  notes: string;
  sets: RecordSetDraft[];
};
const recordCopy = {
  ko: {
    edit: "운동 수정",
    addExercise: "+ 운동 종목 추가",
    addSet: "+ 세트 추가",
    removeSet: "세트 삭제",
    cancel: "취소",
    save: "변경 저장",
    apply: "적용",
    change: "변경",
    choose: "운동 부위 선택",
    multiple: "여러 부위를 선택할 수 있습니다.",
    optional: "선택",
    newExercise: "새 운동",
    conflict: "기록이 변경되었습니다. 화면을 새로고침한 후 다시 수정해주세요.",
    applied: "변경사항을 적용했습니다. 전체 변경사항을 저장해주세요.",
  },
  ja: {
    edit: "種目を編集",
    addExercise: "+ 種目を追加",
    addSet: "+ セットを追加",
    removeSet: "セットを削除",
    cancel: "キャンセル",
    save: "変更を保存",
    apply: "適用",
    change: "変更",
    choose: "部位を選択",
    multiple: "複数の部位を選択できます。",
    optional: "任意",
    newExercise: "新しい種目",
    conflict:
      "記録が変更されています。画面を更新してから再度編集してください。",
    applied: "変更を適用しました。全変更を保存してください。",
  },
  en: {
    edit: "Edit exercise",
    addExercise: "+ Add exercise",
    addSet: "+ Add set",
    removeSet: "Delete set",
    cancel: "Cancel",
    save: "Save changes",
    apply: "Apply",
    change: "Change",
    choose: "Choose muscle groups",
    multiple: "You can select multiple groups.",
    optional: "Optional",
    newExercise: "New exercise",
    conflict: "This record has changed. Reload the page before editing again.",
    applied: "Changes applied. Save all changes to finish.",
  },
};
const RecordForm = styled.form`
  display: grid;
  gap: 16px;
  margin-top: 16px;
`;
const RecordFieldset = styled.fieldset`
  display: grid;
  gap: 16px;
  min-width: 0;
  border: 0;
`;
const RecordField = styled.div`
  display: grid;
  gap: 7px;
  min-width: 0;
  > label,
  > span {
    color: var(--color-text);
    font-size: 14px;
    font-weight: 600;
  }
`;
const RecordMuscleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  > ${MuscleTags} {
    margin-top: 0;
  }

  > button {
    flex-shrink: 0;
    width: auto;
    min-height: var(--control-min-height);
    white-space: nowrap;
  }
`;
const RecordInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 48px;
  padding: 10px 12px;
  color: var(--color-text);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;
const RecordTextarea = styled.textarea`
  width: 100%;
  min-height: 88px;
  padding: 10px 12px;
  color: var(--color-text);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  resize: vertical;
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;
const RecordPair = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;
const RecordSetCard = styled.div`
  display: grid;
  gap: 12px;
  padding: 14px;
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
`;
const RecordButton = styled.button<{ $primary?: boolean }>`
  min-height: 48px;
  padding: 10px 12px;
  color: ${({ $primary }) =>
    $primary ? "var(--color-on-primary)" : "var(--color-primary)"};
  background: ${({ $primary }) =>
    $primary ? "var(--color-primary)" : "var(--color-input)"};
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
  &:disabled {
    opacity: 0.5;
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;
const RecordDialog = styled.dialog`
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
const RecordChoices = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;

  > label {
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
  }

  input {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
    color-scheme: dark;
  }
`;
function draftExercise(exercise: WorkoutExercise): RecordExerciseDraft {
  const text = (value: number | null) => (value === null ? "" : String(value));
  return {
    original: exercise,
    nextSetNumber:
      Math.max(0, ...exercise.sets.map((set) => set.setNumber)) + 1,
    name: exercise.name,
    muscleGroups: [...exercise.muscleGroups],
    restSeconds: String(exercise.restSeconds),
    notes: exercise.notes,
    sets: exercise.sets.map((set) => ({
      setNumber: set.setNumber,
      targetWeightKg: text(set.targetWeightKg),
      targetReps: String(set.targetReps),
      actualWeightKg: text(set.actualWeightKg),
      actualReps: text(set.actualReps),
    })),
  };
}

function exerciseDraftSnapshot(draft: RecordExerciseDraft): string {
  return JSON.stringify({
    name: draft.name,
    muscleGroups: [...draft.muscleGroups].sort(),
    restSeconds: draft.restSeconds,
    notes: draft.notes,
    sets: draft.sets,
  });
}

function parseExerciseDraft(draft: RecordExerciseDraft): WorkoutExercise {
  if (!draft.name.trim() || draft.name.trim().length > 100)
    throw new Error("routineFormItemNameRequired");
  if (!draft.muscleGroups.length)
    throw new Error("routineFormExerciseMusclesRequired");
  const restSeconds = Number(draft.restSeconds);
  if (
    !draft.restSeconds.trim() ||
    !Number.isInteger(restSeconds) ||
    restSeconds < 0 ||
    restSeconds > 600
  )
    throw new Error("routineFormRestInvalid");
  if (draft.notes.length > 500) throw new Error("apiInvalidRequest");
  if (!draft.sets.length || draft.sets.length > 100)
    throw new Error("routineFormSetsRequired");
  const weight = (text: string): number | null => {
    if (!text.trim()) return null;
    const value = Number(text);
    if (!Number.isFinite(value) || value < 0 || value > 1000)
      throw new Error("workoutWeightInvalid");
    return value;
  };
  return {
    ...draft.original,
    name: draft.name.trim(),
    muscleGroups: [...draft.muscleGroups],
    restSeconds,
    notes: draft.notes.trim(),
    sets: draft.sets.map((set) => {
      const targetReps = Number(set.targetReps);
      if (
        !set.targetReps.trim() ||
        !Number.isInteger(targetReps) ||
        targetReps < 1 ||
        targetReps > 1000
      )
        throw new Error("routineFormRepsInvalid");
      const actualReps = set.actualReps.trim() ? Number(set.actualReps) : null;
      if (
        actualReps !== null &&
        (!Number.isInteger(actualReps) || actualReps < 0 || actualReps > 1000)
      )
        throw new Error("workoutRepsInvalid");
      return {
        setNumber: set.setNumber,
        targetReps,
        targetWeightKg: weight(set.targetWeightKg),
        actualReps,
        actualWeightKg: weight(set.actualWeightKg),
        isCompleted: actualReps !== null && actualReps > 0,
      };
    }),
  };
}
function RecordExerciseEditor({
  draft,
  onChange,
  onSave,
  onCancel,
  busy,
}: {
  draft: RecordExerciseDraft;
  onChange: (draft: RecordExerciseDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const { t, language } = useTranslation();
  const copy = recordCopy[language];
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [muscles, setMuscles] = useState<MuscleGroup[]>([]);
  const nextNumberRef = useRef(draft.nextSetNumber);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (pickerOpen && dialog && !dialog.open) dialog.showModal();
    if (!pickerOpen && dialog?.open) dialog.close();
  }, [pickerOpen]);
  const changeSet = (
    number: number,
    field: keyof Omit<RecordSetDraft, "setNumber">,
    value: string,
  ) =>
    onChange({
      ...draft,
      sets: draft.sets.map((set) =>
        set.setNumber === number ? { ...set, [field]: value } : set,
      ),
    });
  return (
    <RecordForm
      aria-label={`${draft.original.name}: ${copy.edit}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) onSave();
      }}
      noValidate
    >
      <RecordFieldset disabled={busy}>
        <RecordField>
          <label htmlFor={`${id}-name`}>{t("routineFormExerciseName")}</label>
          <RecordInput
            id={`${id}-name`}
            value={draft.name}
            maxLength={100}
            onChange={(event) =>
              onChange({ ...draft, name: event.target.value })
            }
          />
        </RecordField>
        <RecordField>
          <InfoLabel>{t("aiRoutineExerciseMuscles")}</InfoLabel>
          <RecordMuscleRow>
            <MuscleTags>
              {draft.muscleGroups.map((group) => (
                <MuscleTag key={group}>{t(muscleGroupLabels[group])}</MuscleTag>
              ))}
            </MuscleTags>
            <RecordButton
              type="button"
              onClick={() => {
                setMuscles([...draft.muscleGroups]);
                setPickerOpen(true);
              }}
            >
              {copy.change}
            </RecordButton>
          </RecordMuscleRow>
        </RecordField>
        <RecordField>
          <label htmlFor={`${id}-rest`}>{t("routineFormRestLabel")}</label>
          <RecordInput
            id={`${id}-rest`}
            type="number"
            min={0}
            max={600}
            step={1}
            value={draft.restSeconds}
            onChange={(event) =>
              onChange({ ...draft, restSeconds: event.target.value })
            }
          />
        </RecordField>
        <RecordField>
          <label htmlFor={`${id}-notes`}>{t("routineFormExerciseNotes")}</label>
          <RecordTextarea
            id={`${id}-notes`}
            value={draft.notes}
            maxLength={500}
            onChange={(event) =>
              onChange({ ...draft, notes: event.target.value })
            }
          />
        </RecordField>
        {draft.sets.map((set) => (
          <RecordSetCard key={set.setNumber}>
            <ExerciseHeader>
              <strong>
                {t("workoutSetLabel")} {set.setNumber}
              </strong>
              <RecordButton
                type="button"
                disabled={draft.sets.length <= 1}
                onClick={() =>
                  onChange({
                    ...draft,
                    sets: draft.sets.filter(
                      (item) => item.setNumber !== set.setNumber,
                    ),
                  })
                }
              >
                {copy.removeSet}
              </RecordButton>
            </ExerciseHeader>
            <InfoLabel>{t("workoutTargetLabel")}</InfoLabel>
            <RecordPair>
              <RecordField>
                <label htmlFor={`${id}-${set.setNumber}-tw`}>
                  {t("routineFormTargetWeight")}
                </label>
                <RecordInput
                  id={`${id}-${set.setNumber}-tw`}
                  type="number"
                  min={0}
                  max={1000}
                  step="any"
                  placeholder={copy.optional}
                  value={set.targetWeightKg}
                  onChange={(event) =>
                    changeSet(
                      set.setNumber,
                      "targetWeightKg",
                      event.target.value,
                    )
                  }
                />
              </RecordField>
              <RecordField>
                <label htmlFor={`${id}-${set.setNumber}-tr`}>
                  {t("routineFormTargetReps")}
                </label>
                <RecordInput
                  id={`${id}-${set.setNumber}-tr`}
                  type="number"
                  min={1}
                  max={1000}
                  step={1}
                  value={set.targetReps}
                  onChange={(event) =>
                    changeSet(set.setNumber, "targetReps", event.target.value)
                  }
                />
              </RecordField>
            </RecordPair>
            <InfoLabel>{t("workoutActualLabel")}</InfoLabel>
            <RecordPair>
              <RecordField>
                <label htmlFor={`${id}-${set.setNumber}-aw`}>
                  {t("workoutActualWeightLabel")}
                </label>
                <RecordInput
                  id={`${id}-${set.setNumber}-aw`}
                  type="number"
                  min={0}
                  max={1000}
                  step="any"
                  placeholder={copy.optional}
                  value={set.actualWeightKg}
                  onChange={(event) =>
                    changeSet(
                      set.setNumber,
                      "actualWeightKg",
                      event.target.value,
                    )
                  }
                />
              </RecordField>
              <RecordField>
                <label htmlFor={`${id}-${set.setNumber}-ar`}>
                  {t("workoutActualRepsLabel")}
                </label>
                <RecordInput
                  id={`${id}-${set.setNumber}-ar`}
                  type="number"
                  min={0}
                  max={1000}
                  step={1}
                  value={set.actualReps}
                  onChange={(event) =>
                    changeSet(set.setNumber, "actualReps", event.target.value)
                  }
                />
              </RecordField>
            </RecordPair>
          </RecordSetCard>
        ))}
        <RecordButton
          type="button"
          disabled={draft.sets.length >= 100}
          onClick={() => {
            const previous = draft.sets[draft.sets.length - 1];
            onChange({
              ...draft,
              sets: [
                ...draft.sets,
                {
                  setNumber: nextNumberRef.current++,
                  targetWeightKg: previous?.targetWeightKg ?? "",
                  targetReps: previous?.targetReps ?? "10",
                  actualWeightKg: "",
                  actualReps: "",
                },
              ],
            });
          }}
        >
          {copy.addSet}
        </RecordButton>
      </RecordFieldset>
      <RecordPair>
        <RecordButton type="button" disabled={busy} onClick={onCancel}>
          {copy.cancel}
        </RecordButton>
        <RecordButton type="submit" disabled={busy} $primary>
          {busy ? t("workoutSavingEdit") : copy.save}
        </RecordButton>
      </RecordPair>
      {createPortal(
        <RecordDialog
          ref={dialogRef}
          aria-labelledby={`${id}-picker`}
          onCancel={(event) => {
            event.preventDefault();
            setPickerOpen(false);
          }}
        >
          <h2 id={`${id}-picker`}>{copy.choose}</h2>
          <InfoLabel>{copy.multiple}</InfoLabel>
          <RecordChoices>
            {(Object.keys(muscleGroupLabels) as MuscleGroup[]).map((group) => (
              <label key={group}>
                <input
                  type="checkbox"
                  checked={muscles.includes(group)}
                  onChange={() =>
                    setMuscles((current) =>
                      current.includes(group)
                        ? current.filter((value) => value !== group)
                        : [...current, group],
                    )
                  }
                />
                {t(muscleGroupLabels[group])}
              </label>
            ))}
          </RecordChoices>
          <RecordPair>
            <RecordButton type="button" onClick={() => setPickerOpen(false)}>
              {copy.cancel}
            </RecordButton>
            <RecordButton
              type="button"
              $primary
              onClick={() => {
                onChange({ ...draft, muscleGroups: [...muscles] });
                setPickerOpen(false);
              }}
            >
              {copy.apply}
            </RecordButton>
          </RecordPair>
        </RecordDialog>,
        document.body,
      )}
    </RecordForm>
  );
}

function WorkoutPage() {
  const { t, language } = useTranslation();
  const backLabel = {
    ko: "뒤로가기",
    ja: "戻る",
    en: "Back",
  }[language];
  const setLabels =
    language === "ja"
      ? {
          edit: "編集",
          reset: "記録をリセット",
          delete: "セットを削除",
          restore: "削除を取り消す",
          pending: "削除予定 · 全変更を保存すると削除されます。",
        }
      : language === "en"
        ? {
            edit: "Edit",
            reset: "Reset record",
            delete: "Delete set",
            restore: "Undo deletion",
            pending: "Pending deletion · Removed when all changes are saved.",
          }
        : {
            edit: "수정",
            reset: "기록 초기화",
            delete: "세트 삭제",
            restore: "삭제 취소",
            pending: "삭제 예정 · 전체 변경사항 저장 시 삭제됩니다.",
          };
  const extraLabels =
    language === "ja"
      ? {
          allEdit: "記録全体を編集",
          saveClose: "保存して閉じる",
          conflict:
            "この記録は変更されています。画面を更新してから再度編集してください。",
          closeTitle: "変更を保存しますか？",
          closeDescription:
            "編集を続けるか、保存して閉じるか、変更を破棄するか選択してください。",
        }
      : language === "en"
        ? {
            allEdit: "Edit entire record",
            saveClose: "Save and close",
            conflict:
              "This record has changed. Reload the page before editing again.",
            closeTitle: "Save your changes?",
            closeDescription:
              "Continue editing, save and close, or discard your changes.",
          }
        : {
            allEdit: "전체 기록 수정",
            saveClose: "저장 후 닫기",
            conflict:
              "기록이 변경되었습니다. 화면을 새로고침한 후 다시 수정해주세요.",
            closeTitle: "수정 내용을 저장할까요?",
            closeDescription:
              "계속 수정하거나, 저장 후 닫거나, 변경사항을 저장하지 않고 닫을 수 있습니다.",
          };
  const [exerciseOverrides, setExerciseOverrides] = useState<
    Record<string, WorkoutExercise>
  >({});
  const [exerciseEditor, setExerciseEditor] =
    useState<RecordExerciseDraft | null>(null);
  const [editedWorkoutDate, setEditedWorkoutDate] = useState("");
  const recordSavingRef = useRef(false);
  const exerciseCopy = recordCopy[language];
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Each snapshot is the value to restore when this set's edit is cancelled.
  const [deletedSetKeys, setDeletedSetKeys] = useState<string[]>([]);
  const [editingSets, setEditingSets] = useState<Record<string, SetDraft>>({});

  function handleBack(): void {
    if (isBusy) {
      return;
    }

    const historyIndex: unknown = window.history.state?.idx;

    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate("/workouts", {
        replace: true,
      });
    }
  }
  function closeSetEditor(key: string): void {
    setEditingSets((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }
  function startSetEditor(key: string): void {
    if (
      isBusy ||
      exerciseEditor ||
      !setDrafts[key] ||
      (!isEditingCompletedWorkout &&
        (isEditingNotes || Object.keys(editingSets).length > 0))
    )
      return;
    setSetSaveErrorMessage("");
    setEditingSets((current) => ({ ...current, [key]: { ...setDrafts[key] } }));
  }
  function cancelSetEditor(key: string): void {
    if (isBusy || !editingSets[key]) return;
    const original = editingSets[key];
    setSetDrafts((current) => ({ ...current, [key]: { ...original } }));
    closeSetEditor(key);
    setSetSaveErrorMessage("");
  }

  function renderWorkoutMessage(value: WorkoutMessage): string {
    if (value === "") {
      return "";
    }

    if ("message" in value) {
      return value.message;
    }

    const translatedMessage = t(value.translationKey);

    if (value.exerciseName !== undefined && value.setNumber !== undefined) {
      return (
        `${value.exerciseName} · ` +
        `${t("workoutSetLabel")} ${value.setNumber} · ` +
        translatedMessage
      );
    }

    return translatedMessage;
  }
  const { workoutId } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<Workout | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<WorkoutMessage>("");

  const [setDrafts, setSetDrafts] = useState<Record<string, SetDraft>>({});

  const [deletedExerciseIds, setDeletedExerciseIds] = useState<string[]>([]);

  const [savingSetKey, setSavingSetKey] = useState<string | null>(null);

  const [undoingSetKey, setUndoingSetKey] = useState<string | null>(null);

  const [setSaveErrorMessage, setSetSaveErrorMessage] =
    useState<WorkoutMessage>("");

  const [workoutNotes, setWorkoutNotes] = useState("");

  const [isCompletingWorkout, setIsCompletingWorkout] = useState(false);

  const [isCompleteConfirmModalOpen, setIsCompleteConfirmModalOpen] =
    useState(false);

  const [completionErrorMessage, setCompletionErrorMessage] =
    useState<WorkoutMessage>("");

  const [isEditingCompletedWorkout, setIsEditingCompletedWorkout] =
    useState(false);

  const [isCloseEditModalOpen, setIsCloseEditModalOpen] = useState(false);

  const [isSavingCompletedEdit, setIsSavingCompletedEdit] = useState(false);

  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] =
    useState<WorkoutMessage>("");

  const [workoutActionErrorMessage, setWorkoutActionErrorMessage] =
    useState<WorkoutMessage>("");

  const isBusy =
    savingSetKey !== null ||
    undoingSetKey !== null ||
    isCompletingWorkout ||
    isSavingCompletedEdit ||
    isDeletingWorkout;

  const effectiveWorkout = workout
    ? {
        ...workout,
        exercises: [
          ...workout.exercises.map(
            (exercise) =>
              exerciseOverrides[exercise.routineExerciseId] ?? exercise,
          ),
          ...Object.values(exerciseOverrides).filter(
            (exercise) =>
              !workout.exercises.some(
                (original) =>
                  original.routineExerciseId === exercise.routineExerciseId,
              ),
          ),
        ],
      }
    : null;

  const exerciseEditorDirty =
    exerciseEditor !== null &&
    (exerciseDraftSnapshot(exerciseEditor) !==
      exerciseDraftSnapshot(draftExercise(exerciseEditor.original)) ||
      !workout?.exercises.some(
        (exercise) =>
          exercise.routineExerciseId ===
          exerciseEditor.original.routineExerciseId,
      ));

  function acceptRecordedWorkout(next: Workout): void {
    setWorkout(next);
    setWorkoutNotes(next.notes);
    setEditedWorkoutDate(next.workoutDate);
    setSetDrafts(createSetDrafts(next));
    setExerciseOverrides({});
    setExerciseEditor(null);
    setDeletedExerciseIds([]);
    setDeletedSetKeys([]);
    setEditingSets({});
    setIsEditingNotes(false);
    setWorkoutActionErrorMessage("");
    setSetSaveErrorMessage("");
  }
  function beginExerciseEdit(exercise: WorkoutExercise): void {
    if (
      isBusy ||
      exerciseEditor ||
      isEditingNotes ||
      Object.keys(editingSets).length
    )
      return;
    const surviving = exercise.sets.filter(
      (set) =>
        !deletedSetKeys.includes(
          getSetDraftKey(exercise.routineExerciseId, set.setNumber),
        ),
    );
    const original = {
      ...exercise,
      sets: surviving.map((set) => {
        const draft =
          setDrafts[getSetDraftKey(exercise.routineExerciseId, set.setNumber)];
        return isEditingCompletedWorkout && draft
          ? {
              ...set,
              actualReps: draft.actualReps.trim()
                ? Number(draft.actualReps)
                : null,
              actualWeightKg: draft.actualWeightKg.trim()
                ? Number(draft.actualWeightKg)
                : null,
              isCompleted: draft.isCompleted,
            }
          : set;
      }),
    };
    setWorkoutActionErrorMessage("");
    setExerciseEditor({
      ...draftExercise(original),
      nextSetNumber:
        Math.max(0, ...exercise.sets.map((set) => set.setNumber)) + 1,
    });
  }
  function addRecordedExercise(): void {
    if (
      isBusy ||
      exerciseEditor ||
      Object.keys(editingSets).length ||
      !isEditingCompletedWorkout
    )
      return;
    const exercise: WorkoutExercise = {
      routineExerciseId: crypto.randomUUID(),
      name: "",
      muscleGroups: [],
      restSeconds: 60,
      notes: "",
      routineNotes: "",
      sets: [
        {
          setNumber: 1,
          targetReps: 10,
          targetWeightKg: null,
          actualReps: null,
          actualWeightKg: null,
          isCompleted: false,
        },
      ],
    };
    setExerciseEditor(draftExercise(exercise));
  }
  function cancelExerciseEdit(): void {
    if (isBusy) return;
    setExerciseEditor(null);
    setWorkoutActionErrorMessage("");
  }
  function getParsedExercise(
    draft: RecordExerciseDraft,
  ): WorkoutExercise | null {
    try {
      return parseExerciseDraft(draft);
    } catch (error) {
      const key =
        error instanceof Error
          ? (error.message as TranslationKey)
          : "apiInvalidRequest";
      setWorkoutActionErrorMessage({ translationKey: key });
      return null;
    }
  }
  async function saveExerciseEdit(): Promise<boolean> {
    if (!workout || !exerciseEditor || isBusy || recordSavingRef.current)
      return false;
    const next = getParsedExercise(exerciseEditor);
    if (!next) return false;
    if (isEditingCompletedWorkout) {
      setExerciseOverrides((current) => ({
        ...current,
        [next.routineExerciseId]: next,
      }));
      setSetDrafts((current) => ({
        ...current,
        ...createSetDrafts({ ...workout, exercises: [next] }),
      }));
      setDeletedSetKeys((keys) =>
        keys.filter(
          (key) =>
            ![
              ...exerciseEditor.original.sets,
              ...next.sets,
              ...(workout.exercises.find(
                (exercise) =>
                  exercise.routineExerciseId === next.routineExerciseId,
              )?.sets ?? []),
            ].some(
              (set) =>
                key === getSetDraftKey(next.routineExerciseId, set.setNumber),
            ),
        ),
      );
      setExerciseEditor(null);
      setWorkoutActionErrorMessage("");
      return true;
    }
    recordSavingRef.current = true;
    setIsSavingCompletedEdit(true);
    setWorkoutActionErrorMessage("");
    try {
      const latest = (await getWorkoutById(workout.id)).workout;
      const original = latest.exercises.find(
        (exercise) => exercise.routineExerciseId === next.routineExerciseId,
      );
      if (
        latest.status !== "completed" ||
        !original ||
        JSON.stringify(original) !== JSON.stringify(exerciseEditor.original)
      )
        throw new Error(exerciseCopy.conflict);
      const result = await updateCompletedWorkout(workout.id, {
        notes: latest.notes,
        sets: [],
        deletedExerciseIds: [],
        exerciseUpdates: [next],
        expectedUpdatedAt: latest.updatedAt,
      });
      acceptRecordedWorkout(result.workout);
      showSuccessToast();
      return true;
    } catch (error) {
      setWorkoutActionErrorMessage(
        getWorkoutError(error, "workoutEditSaveFailed"),
      );
      return false;
    } finally {
      recordSavingRef.current = false;
      setIsSavingCompletedEdit(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    setExerciseOverrides({});
    setExerciseEditor(null);
    setEditedWorkoutDate("");
    setIsDeleteConfirmOpen(false);
    setDeleteErrorMessage("");

    async function loadWorkout(): Promise<void> {
      if (!workoutId) {
        setErrorMessage({ translationKey: "workoutIdRequired" });
        setIsLoading(false);
        return;
      }

      try {
        const result = await getWorkoutById(workoutId);

        if (isMounted) {
          setWorkout(result.workout);

          setSetDrafts(createSetDrafts(result.workout));

          setWorkoutNotes(result.workout.notes);
          setEditedWorkoutDate(result.workout.workoutDate);
          setDeletedExerciseIds([]);
          setDeletedSetKeys([]);
          setEditingSets({});
          setIsEditingNotes(false);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(getWorkoutError(error, "workoutLoadFailed"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkout();

    return () => {
      isMounted = false;
    };
  }, [workoutId]);

  const hasExerciseOverrideChanges =
    workout !== null &&
    Object.values(exerciseOverrides).some((exercise) => {
      const original = workout.exercises.find(
        (item) => item.routineExerciseId === exercise.routineExerciseId,
      );

      return (
        original === undefined ||
        exerciseDraftSnapshot(draftExercise(exercise)) !==
          exerciseDraftSnapshot(draftExercise(original))
      );
    });

  const hasUnsavedCompletedEditChanges =
    workout !== null &&
    workout.status === "completed" &&
    isEditingCompletedWorkout &&
    (hasExerciseOverrideChanges ||
      exerciseEditorDirty ||
      editedWorkoutDate !== workout.workoutDate ||
      deletedSetKeys.length > 0 ||
      hasCompletedWorkoutChanges(
        workout,
        setDrafts,
        workoutNotes,
        deletedExerciseIds,
      ));

  const hasUnsavedInProgressSetChanges =
    workout !== null &&
    workout.status === "in_progress" &&
    hasSetDraftChanges(workout, setDrafts);

  const hasUnsavedInProgressChanges =
    hasUnsavedInProgressSetChanges ||
    (workout !== null &&
      workout.status === "in_progress" &&
      workoutNotes !== workout.notes);

  const hasPartialEditSession =
    !isEditingCompletedWorkout &&
    (exerciseEditor !== null ||
      isEditingNotes ||
      Object.keys(editingSets).length > 0);
  const hasUnsavedPartialChanges =
    workout?.status === "completed" &&
    hasPartialEditSession &&
    (exerciseEditorDirty ||
      hasSetDraftChanges(workout, setDrafts) ||
      workoutNotes !== workout.notes);
  const shouldBlockNavigation =
    hasUnsavedPartialChanges ||
    (hasPartialEditSession && isBusy) ||
    hasUnsavedInProgressChanges ||
    (isEditingCompletedWorkout &&
      (hasUnsavedCompletedEditChanges || isSavingCompletedEdit));

  const blocker = useBlocker(shouldBlockNavigation);

  useEffect(() => {
    if (blocker.state === "blocked") {
      setIsCloseEditModalOpen(true);
    }
  }, [blocker.state]);

  useEffect(() => {
    if (blocker.state === "blocked" && !shouldBlockNavigation) {
      blocker.proceed();
    }
  }, [blocker, shouldBlockNavigation]);

  useEffect(() => {
    if (!shouldBlockNavigation) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldBlockNavigation]);

  function handleSetDraftChange(
    key: string,
    field: keyof SetDraft,
    value: string,
  ): void {
    if (
      isBusy ||
      !workout ||
      (workout.status === "completed" &&
        !isEditingCompletedWorkout &&
        !editingSets[key]) ||
      (setDrafts[key]?.isCompleted && !editingSets[key])
    )
      return;
    setSetDrafts((currentDrafts) => ({
      ...currentDrafts,

      [key]: {
        ...currentDrafts[key],
        [field]: value,
      },
    }));
  }

  async function handleSaveSet(
    routineExerciseId: string,
    setNumber: number,
  ): Promise<boolean> {
    if (
      !workoutId ||
      !workout ||
      (workout.status === "completed" &&
        !isEditingCompletedWorkout &&
        !editingSets[getSetDraftKey(routineExerciseId, setNumber)]) ||
      savingSetKey !== null ||
      undoingSetKey !== null ||
      isCompletingWorkout ||
      isSavingCompletedEdit ||
      isDeletingWorkout
    ) {
      return false;
    }
    const key = getSetDraftKey(routineExerciseId, setNumber);

    const draft = setDrafts[key];

    if (!draft) {
      return false;
    }

    const repsText = draft.actualReps.trim();

    const weightText = draft.actualWeightKg.trim();

    if (repsText.length === 0 && workout.status === "in_progress") {
      setSetSaveErrorMessage({ translationKey: "workoutRepsRequired" });
      return false;
    }

    const actualReps = repsText.length === 0 ? null : Number(repsText);

    if (
      actualReps !== null &&
      (!Number.isInteger(actualReps) || actualReps < 0 || actualReps > 1000)
    ) {
      setSetSaveErrorMessage({ translationKey: "workoutRepsInvalid" });
      return false;
    }

    const actualWeightKg = weightText.length === 0 ? null : Number(weightText);

    if (
      actualWeightKg !== null &&
      (!Number.isFinite(actualWeightKg) ||
        actualWeightKg < 0 ||
        actualWeightKg > 1000)
    ) {
      setSetSaveErrorMessage({ translationKey: "workoutWeightInvalid" });
      return false;
    }

    setSetSaveErrorMessage("");

    if (workout.status === "completed" && isEditingCompletedWorkout) {
      setSetDrafts((current) => ({
        ...current,
        [key]: {
          ...current[key],
          isCompleted: actualReps !== null && actualReps > 0,
        },
      }));
      closeSetEditor(key);
      return true;
    }

    setSavingSetKey(key);

    try {
      const result = await updateWorkoutSet(workoutId, {
        routineExerciseId,
        setNumber,
        actualReps,
        actualWeightKg,
        isCompleted:
          workout.status === "completed"
            ? actualReps !== null && actualReps > 0
            : true,
      });

      setWorkout(result.workout);
      closeSetEditor(key);
      if (workout.status === "completed") {
        setSetDrafts(createSetDrafts(result.workout));
        setWorkoutNotes(result.workout.notes);
      }

      const savedDraft = createSetDrafts(result.workout)[key];

      if (savedDraft) {
        setSetDrafts((currentDrafts) => ({
          ...currentDrafts,
          [key]: savedDraft,
        }));
      }
      showSuccessToast();
      return true;
    } catch (error) {
      setSetSaveErrorMessage(getWorkoutError(error, "workoutSetSaveFailed"));
      return false;
    } finally {
      setSavingSetKey(null);
    }
  }

  async function handleSaveNotes(): Promise<boolean> {
    if (!workout || workout.status !== "completed" || !isEditingNotes || isBusy)
      return false;
    setWorkoutActionErrorMessage("");
    setIsSavingCompletedEdit(true);
    try {
      const latest = (await getWorkoutById(workout.id)).workout;
      if (latest.status !== "completed" || latest.notes !== workout.notes) {
        throw new Error(extraLabels.conflict);
      }
      const result = await updateCompletedWorkout(workout.id, {
        notes: workoutNotes.trim(),
        sets: latest.exercises.flatMap((exercise) =>
          exercise.sets.map((set) => ({
            routineExerciseId: exercise.routineExerciseId,
            setNumber: set.setNumber,
            actualReps: set.actualReps,
            actualWeightKg: set.actualWeightKg,
            isCompleted: set.isCompleted,
          })),
        ),
        deletedExerciseIds: [],
        deletedSets: [],
      });
      setWorkout(result.workout);
      setSetDrafts(createSetDrafts(result.workout));
      setWorkoutNotes(result.workout.notes);
      setIsEditingNotes(false);
      showSuccessToast();
      return true;
    } catch (error) {
      setWorkoutActionErrorMessage(
        getWorkoutError(error, "workoutEditSaveFailed"),
      );
      return false;
    } finally {
      setIsSavingCompletedEdit(false);
    }
  }

  async function handleUndoSetCompletion(
    routineExerciseId: string,
    setNumber: number,
    actualReps: number | null,
    actualWeightKg: number | null,
  ): Promise<void> {
    if (
      !workoutId ||
      !workout ||
      (workout.status === "completed" && !isEditingCompletedWorkout) ||
      savingSetKey !== null ||
      undoingSetKey !== null ||
      isCompletingWorkout ||
      isSavingCompletedEdit ||
      isDeletingWorkout
    ) {
      return;
    }

    const key = getSetDraftKey(routineExerciseId, setNumber);

    setSetSaveErrorMessage("");

    if (workout.status === "completed" && isEditingCompletedWorkout) {
      setSetDrafts((currentDrafts) => ({
        ...currentDrafts,

        [key]: {
          ...currentDrafts[key],
          isCompleted: false,
        },
      }));

      return;
    }

    if (actualReps === null) {
      return;
    }

    setUndoingSetKey(key);

    try {
      const result = await updateWorkoutSet(workoutId, {
        routineExerciseId,
        setNumber,
        actualReps,
        actualWeightKg,
        isCompleted: false,
      });

      setWorkout(result.workout);

      const savedDraft = createSetDrafts(result.workout)[key];

      if (savedDraft) {
        setSetDrafts((currentDrafts) => ({
          ...currentDrafts,
          [key]: savedDraft,
        }));
      }
    } catch (error) {
      setSetSaveErrorMessage(getWorkoutError(error, "workoutSetUndoFailed"));
    } finally {
      setUndoingSetKey(null);
    }
  }

  function handleClearSetRecord(
    routineExerciseId: string,
    setNumber: number,
  ): void {
    if (
      !workout ||
      workout.status !== "completed" ||
      !isEditingCompletedWorkout ||
      isSavingCompletedEdit
    ) {
      return;
    }

    const key = getSetDraftKey(routineExerciseId, setNumber);

    setSetSaveErrorMessage("");

    setSetDrafts((currentDrafts) => ({
      ...currentDrafts,

      [key]: {
        actualWeightKg: "",
        actualReps: "",
        isCompleted: false,
      },
    }));
  }

  function markSetForDeletion(
    routineExerciseId: string,
    setNumber: number,
  ): void {
    if (!workout || !isEditingCompletedWorkout || isBusy) return;
    const key = getSetDraftKey(routineExerciseId, setNumber);
    const exercise = effectiveWorkout?.exercises.find(
      (item) => item.routineExerciseId === routineExerciseId,
    );
    if (!exercise || editingSets[key] || deletedSetKeys.includes(key)) return;
    const remaining = exercise.sets.filter(
      (set) =>
        !deletedSetKeys.includes(
          getSetDraftKey(routineExerciseId, set.setNumber),
        ),
    );
    if (remaining.length <= 1) return;
    setDeletedSetKeys((current) => [...current, key]);
  }

  function handleMarkExerciseForDeletion(routineExerciseId: string): void {
    if (
      !workout ||
      workout.status !== "completed" ||
      !isEditingCompletedWorkout ||
      isBusy ||
      exerciseEditor !== null ||
      Object.keys(editingSets).length > 0 ||
      deletedExerciseIds.includes(routineExerciseId)
    ) {
      return;
    }

    const remainingExerciseCount =
      (effectiveWorkout?.exercises.length ?? 0) - deletedExerciseIds.length;

    if (remainingExerciseCount <= 1) {
      setWorkoutActionErrorMessage({
        translationKey: "workoutLastExerciseCannotDelete",
      });

      return;
    }

    setWorkoutActionErrorMessage("");

    setDeletedExerciseIds((currentIds) => [...currentIds, routineExerciseId]);
  }

  function handleUndoExerciseDeletion(routineExerciseId: string): void {
    if (!isEditingCompletedWorkout || isSavingCompletedEdit) {
      return;
    }

    setWorkoutActionErrorMessage("");

    setDeletedExerciseIds((currentIds) =>
      currentIds.filter((exerciseId) => exerciseId !== routineExerciseId),
    );
  }

  function handleOpenCompleteConfirmModal(): void {
    if (
      !workout ||
      workout.status === "completed" ||
      Object.keys(editingSets).length > 0 ||
      isCompletingWorkout ||
      savingSetKey !== null ||
      undoingSetKey !== null ||
      isDeletingWorkout
    ) {
      return;
    }

    setCompletionErrorMessage("");
    setIsCompleteConfirmModalOpen(true);
  }

  function handleCloseCompleteConfirmModal(): void {
    if (isCompletingWorkout) {
      return;
    }

    setIsCompleteConfirmModalOpen(false);
  }

  async function handleCompleteWorkout(): Promise<void> {
    if (
      !workout ||
      workout.status === "completed" ||
      Object.keys(editingSets).length > 0 ||
      isCompletingWorkout ||
      savingSetKey !== null ||
      undoingSetKey !== null ||
      isDeletingWorkout
    ) {
      return;
    }

    setCompletionErrorMessage("");
    setIsCompletingWorkout(true);

    try {
      const result = await completeWorkout(workout.id, {
        notes: workoutNotes.trim(),
      });

      setWorkout(result.workout);

      setSetDrafts(createSetDrafts(result.workout));

      setWorkoutNotes(result.workout.notes);
      setEditingSets({});
      setIsEditingNotes(false);
      setIsCompleteConfirmModalOpen(false);
    } catch (error) {
      setCompletionErrorMessage(
        getWorkoutError(error, "workoutCompleteFailed"),
      );
    } finally {
      setIsCompletingWorkout(false);
    }
  }

  function handleToggleCompletedEdit(): void {
    if (
      !workout ||
      workout.status !== "completed" ||
      isBusy ||
      (!isEditingCompletedWorkout && hasPartialEditSession)
    ) {
      return;
    }

    setWorkoutActionErrorMessage("");
    setSetSaveErrorMessage("");
    setCompletionErrorMessage("");

    if (!isEditingCompletedWorkout) {
      setSetDrafts(createSetDrafts(workout));

      setWorkoutNotes(workout.notes);
      setDeletedExerciseIds([]);
      setExerciseOverrides({});
      setExerciseEditor(null);
      setEditedWorkoutDate(workout.workoutDate);
      setDeletedSetKeys([]);
      setEditingSets({});
      setIsEditingNotes(false);
      setIsEditingCompletedWorkout(true);

      return;
    }

    if (hasUnsavedCompletedEditChanges) {
      setIsCloseEditModalOpen(true);

      return;
    }

    setEditingSets({});
    setExerciseEditor(null);
    setIsEditingCompletedWorkout(false);
  }

  function handleContinueCompletedEdit(): void {
    if (isBusy) {
      return;
    }

    if (blocker.state === "blocked") {
      blocker.reset();
    }

    setIsCloseEditModalOpen(false);
  }

  function handleDiscardCompletedEdit(): void {
    if (!workout || isBusy) {
      return;
    }

    setSetDrafts(createSetDrafts(workout));

    setWorkoutNotes(workout.notes);
    setDeletedExerciseIds([]);
    setExerciseOverrides({});
    setExerciseEditor(null);
    setEditedWorkoutDate(workout.workoutDate);
    setDeletedSetKeys([]);
    setEditingSets({});
    setIsEditingNotes(false);

    setWorkoutActionErrorMessage("");
    setSetSaveErrorMessage("");
    setCompletionErrorMessage("");

    setIsCloseEditModalOpen(false);
    setIsEditingCompletedWorkout(false);
  }

  async function handleSaveCompletedEdit(
    allowOpenEditors = false,
  ): Promise<boolean> {
    if (
      !workout ||
      !effectiveWorkout ||
      !isEditingCompletedWorkout ||
      isBusy ||
      recordSavingRef.current ||
      (!allowOpenEditors && (exerciseEditor || Object.keys(editingSets).length))
    )
      return false;
    setWorkoutActionErrorMessage("");
    setSetSaveErrorMessage("");
    const overrides = { ...exerciseOverrides };
    if (exerciseEditor) {
      const next = getParsedExercise(exerciseEditor);
      if (!next) return false;
      overrides[next.routineExerciseId] = next;
    }
    let exercises = workout.exercises.map(
      (exercise) => overrides[exercise.routineExerciseId] ?? exercise,
    );
    exercises = [
      ...exercises,
      ...Object.values(overrides).filter(
        (exercise) =>
          !workout.exercises.some(
            (original) =>
              original.routineExerciseId === exercise.routineExerciseId,
          ),
      ),
    ];
    const updates: WorkoutExercise[] = [];
    for (const exercise of exercises) {
      if (deletedExerciseIds.includes(exercise.routineExerciseId)) continue;
      const draft = draftExercise({
        ...exercise,
        sets: exercise.sets.filter(
          (set) =>
            !deletedSetKeys.includes(
              getSetDraftKey(exercise.routineExerciseId, set.setNumber),
            ),
        ),
      });
      if (
        exerciseEditor?.original.routineExerciseId !==
        exercise.routineExerciseId
      ) {
        draft.sets = draft.sets.map((set) => {
          const current =
            setDrafts[
              getSetDraftKey(exercise.routineExerciseId, set.setNumber)
            ];
          return current
            ? {
                ...set,
                actualWeightKg: current.actualWeightKg,
                actualReps: current.actualReps,
              }
            : set;
        });
      }
      const next = getParsedExercise(draft);
      if (!next) return false;
      updates.push(next);
    }
    const date = editedWorkoutDate;
    const [year, month, day] = date.split("-").map(Number);
    const checked = new Date(Date.UTC(year, month - 1, day));
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      checked.getUTCFullYear() !== year ||
      checked.getUTCMonth() !== month - 1 ||
      checked.getUTCDate() !== day
    ) {
      setWorkoutActionErrorMessage({ translationKey: "apiInvalidRequest" });
      return false;
    }
    recordSavingRef.current = true;
    setIsSavingCompletedEdit(true);
    try {
      const result = await updateCompletedWorkout(workout.id, {
        notes: workoutNotes.trim(),
        sets: [],
        deletedExerciseIds: deletedExerciseIds.filter((id) =>
          workout.exercises.some(
            (exercise) => exercise.routineExerciseId === id,
          ),
        ),
        exerciseUpdates: updates,
        workoutDate: date,
        expectedUpdatedAt: workout.updatedAt,
      });
      acceptRecordedWorkout(result.workout);
      showSuccessToast();
      setIsEditingCompletedWorkout(false);
      setIsCloseEditModalOpen(false);
      return true;
    } catch (error) {
      setWorkoutActionErrorMessage(
        getWorkoutError(error, "workoutEditSaveFailed"),
      );
      return false;
    } finally {
      recordSavingRef.current = false;
      setIsSavingCompletedEdit(false);
    }
  }

  async function handleSaveAndClose(): Promise<void> {
    if (!workout || workout.status !== "completed" || isBusy) return;
    let saved = false;
    if (isEditingCompletedWorkout) {
      saved = await handleSaveCompletedEdit(true);
    } else if (exerciseEditor) {
      saved = await saveExerciseEdit();
    } else if (isEditingNotes) {
      saved = await handleSaveNotes();
    } else {
      const key = Object.keys(editingSets)[0];
      const exercise = effectiveWorkout?.exercises.find((item) =>
        item.sets.some(
          (set) =>
            getSetDraftKey(item.routineExerciseId, set.setNumber) === key,
        ),
      );
      const set = exercise?.sets.find(
        (item) =>
          getSetDraftKey(exercise.routineExerciseId, item.setNumber) === key,
      );
      if (exercise && set)
        saved = await handleSaveSet(exercise.routineExerciseId, set.setNumber);
    }
    if (saved) setIsCloseEditModalOpen(false);
    // The blocker effect resumes a pending navigation after dirty state clears.
  }

  async function handleDeleteWorkout(): Promise<void> {
    if (
      !workout ||
      isDeletingWorkout ||
      isSavingCompletedEdit ||
      isEditingCompletedWorkout ||
      hasPartialEditSession ||
      isBusy
    ) {
      return;
    }

    if (!isDeleteConfirmOpen) return;
    setDeleteErrorMessage("");
    setIsDeletingWorkout(true);

    try {
      await deleteWorkout(workout.id);

      navigate("/workouts", {
        replace: true,
      });
    } catch (error) {
      setDeleteErrorMessage(getWorkoutError(error, "workoutDeleteFailed"));

      setIsDeletingWorkout(false);
    }
  }

  const totalSetCount =
    effectiveWorkout?.exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0,
    ) ?? 0;

  const completedSetCount =
    effectiveWorkout?.exercises.reduce(
      (total, exercise) =>
        total + exercise.sets.filter((set) => set.isCompleted).length,
      0,
    ) ?? 0;

  const incompleteSetCount = totalSetCount - completedSetCount;

  return (
    <Page>
      <Container>
        <BackButton type="button" onClick={handleBack} disabled={isBusy}>
          <span aria-hidden="true">←</span>
          {backLabel}
        </BackButton>

        {!isLoading && errorMessage && (
          <ErrorMessage role="alert">
            {renderWorkoutMessage(errorMessage)}
          </ErrorMessage>
        )}

        {!isLoading && !errorMessage && workout && (
          <>
            <SummaryCard>
              <Title>{workout.routineDayName}</Title>

              <SummaryGrid>
                <SummaryText>
                  <InfoLabel>{t("calendarRoutineLabel")}</InfoLabel>
                  <InfoValue>{workout.routineName}</InfoValue>
                </SummaryText>

                <SummaryText>
                  <InfoLabel>{t("workoutDateLabel")}</InfoLabel>
                  {isEditingCompletedWorkout ? (
                    <RecordInput
                      aria-label={t("workoutDateLabel")}
                      type="date"
                      value={editedWorkoutDate}
                      disabled={isBusy}
                      onChange={(event) =>
                        setEditedWorkoutDate(event.target.value)
                      }
                    />
                  ) : (
                    <InfoValue>{workout.workoutDate}</InfoValue>
                  )}
                </SummaryText>

                <SummaryText>
                  <InfoLabel>{t("workoutStatusLabel")}</InfoLabel>
                  <StatusText>
                    {workout.status === "completed"
                      ? t("calendarWorkoutCompleted")
                      : t("calendarWorkoutInProgress")}
                  </StatusText>
                </SummaryText>
              </SummaryGrid>
              {workoutActionErrorMessage && (
                <WorkoutActionErrorMessage role="alert">
                  {renderWorkoutMessage(workoutActionErrorMessage)}
                </WorkoutActionErrorMessage>
              )}

              <WorkoutActions>
                {workout.status === "completed" && (
                  <EditWorkoutButton
                    $isEditing={isEditingCompletedWorkout}
                    type="button"
                    onClick={handleToggleCompletedEdit}
                    disabled={
                      isBusy ||
                      (!isEditingCompletedWorkout && hasPartialEditSession)
                    }
                  >
                    {isEditingCompletedWorkout
                      ? t("workoutCloseEdit")
                      : extraLabels.allEdit}
                  </EditWorkoutButton>
                )}

                <DeleteWorkoutButton
                  type="button"
                  onClick={() => {
                    setDeleteErrorMessage("");
                    setIsDeleteConfirmOpen(true);
                  }}
                  disabled={
                    isDeletingWorkout ||
                    isSavingCompletedEdit ||
                    isEditingCompletedWorkout ||
                    hasPartialEditSession ||
                    isBusy
                  }
                >
                  {isDeletingWorkout
                    ? t("workoutDeleting")
                    : isEditingCompletedWorkout
                      ? t("workoutDeleteAfterEdit")
                      : t("workoutDelete")}
                </DeleteWorkoutButton>
              </WorkoutActions>
            </SummaryCard>

            {setSaveErrorMessage && (
              <SetErrorMessage role="alert">
                {renderWorkoutMessage(setSaveErrorMessage)}
              </SetErrorMessage>
            )}

            <ExerciseList>
              {effectiveWorkout?.exercises.map((exercise) => (
                <ExerciseCard key={exercise.routineExerciseId}>
                  <ExerciseHeader>
                    <ExerciseTitle>{exercise.name}</ExerciseTitle>

                    {workout.status === "completed" &&
                      !deletedExerciseIds.includes(
                        exercise.routineExerciseId,
                      ) && (
                        <RecordButton
                          type="button"
                          onClick={() => beginExerciseEdit(exercise)}
                          disabled={
                            isBusy ||
                            exerciseEditor !== null ||
                            isEditingNotes ||
                            Object.keys(editingSets).length > 0
                          }
                        >
                          {exerciseCopy.edit}
                        </RecordButton>
                      )}

                    {workout.status === "completed" &&
                      isEditingCompletedWorkout &&
                      (deletedExerciseIds.includes(
                        exercise.routineExerciseId,
                      ) ? (
                        <RestoreExerciseButton
                          type="button"
                          onClick={() => {
                            handleUndoExerciseDeletion(
                              exercise.routineExerciseId,
                            );
                          }}
                          disabled={isSavingCompletedEdit}
                        >
                          {t("workoutUndoExerciseDeletion")}
                        </RestoreExerciseButton>
                      ) : (
                        <DeleteExerciseButton
                          type="button"
                          onClick={() => {
                            handleMarkExerciseForDeletion(
                              exercise.routineExerciseId,
                            );
                          }}
                          disabled={
                            isBusy ||
                            exerciseEditor !== null ||
                            Object.keys(editingSets).length > 0 ||
                            (effectiveWorkout?.exercises.length ?? 0) -
                              deletedExerciseIds.length <=
                              1
                          }
                        >
                          {t("workoutDeleteExercise")}
                        </DeleteExerciseButton>
                      ))}
                  </ExerciseHeader>

                  {exerciseEditor?.original.routineExerciseId ===
                  exercise.routineExerciseId ? (
                    <RecordExerciseEditor
                      key={exercise.routineExerciseId}
                      draft={exerciseEditor}
                      onChange={setExerciseEditor}
                      onSave={() => void saveExerciseEdit()}
                      onCancel={cancelExerciseEdit}
                      busy={isBusy}
                    />
                  ) : deletedExerciseIds.includes(
                      exercise.routineExerciseId,
                    ) ? (
                    <ExerciseDeletionNotice>
                      {t("workoutExerciseDeletionNotice")}
                    </ExerciseDeletionNotice>
                  ) : (
                    <>
                      <InfoLabel>{t("aiRoutineExerciseMuscles")}</InfoLabel>
                      <MuscleTags>
                        {exercise.muscleGroups.map((group) => (
                          <MuscleTag key={group}>
                            {t(muscleGroupLabels[group])}
                          </MuscleTag>
                        ))}
                      </MuscleTags>
                      <ExerciseInfo>
                        <InfoLabel>{t("workoutRestLabel")}</InfoLabel>
                        <InfoValue>
                          {exercise.restSeconds} {t("workoutSecondsUnit")}
                        </InfoValue>
                      </ExerciseInfo>

                      {exercise.routineNotes && (
                        <RoutineNote>
                          <InfoLabel>{t("workoutRoutineNotesLabel")}</InfoLabel>
                          {exercise.routineNotes}
                        </RoutineNote>
                      )}

                      {exerciseOverrides[exercise.routineExerciseId] && (
                        <RoutineNote role="status">
                          {exerciseCopy.applied}
                        </RoutineNote>
                      )}
                      {exercise.notes && (
                        <RoutineNote>
                          <InfoLabel>{t("routineFormExerciseNotes")}</InfoLabel>
                          {exercise.notes}
                        </RoutineNote>
                      )}
                      <SetList>
                        {exercise.sets.map((set) => {
                          const key = getSetDraftKey(
                            exercise.routineExerciseId,
                            set.setNumber,
                          );

                          if (deletedSetKeys.includes(key)) {
                            return (
                              <SetItem key={set.setNumber} $isCompleted={false}>
                                <SetHeader>
                                  <SetNumber
                                    $isCompleted={false}
                                    aria-label={`${t("workoutSetLabel")} ${set.setNumber}`}
                                  >
                                    {set.setNumber}
                                  </SetNumber>
                                  <UndoSetCompletionButton
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      setDeletedSetKeys((current) =>
                                        current.filter((item) => item !== key),
                                      )
                                    }
                                  >
                                    {setLabels.restore}
                                  </UndoSetCompletionButton>
                                </SetHeader>
                                <SetText>{setLabels.pending}</SetText>
                              </SetItem>
                            );
                          }
                          const draft = setDrafts[key] ?? {
                            actualWeightKg: "",
                            actualReps: "",
                            isCompleted: set.isCompleted,
                          };

                          const hasActualSetRecord =
                            draft.isCompleted ||
                            draft.actualReps.trim().length > 0 ||
                            draft.actualWeightKg.trim().length > 0;

                          const actualWeightText = isEditingCompletedWorkout
                            ? draft.actualWeightKg
                            : set.actualWeightKg === null
                              ? ""
                              : String(set.actualWeightKg);
                          const actualRepsText = isEditingCompletedWorkout
                            ? draft.actualReps
                            : set.actualReps === null
                              ? ""
                              : String(set.actualReps);
                          const isSaving = savingSetKey === key;
                          const isSetEditing = editingSets[key] !== undefined;
                          const canEditSet = true;
                          const showSetForm =
                            canEditSet &&
                            (isSetEditing ||
                              (workout.status === "in_progress" &&
                                !draft.isCompleted));

                          return (
                            <SetItem
                              key={set.setNumber}
                              $isCompleted={draft.isCompleted}
                            >
                              <SetHeader>
                                <SetNumber
                                  $isCompleted={draft.isCompleted}
                                  aria-label={`${t("workoutSetLabel")} ${set.setNumber}`}
                                >
                                  {set.setNumber}
                                </SetNumber>
                                <SetStatus $isCompleted={draft.isCompleted}>
                                  {draft.isCompleted
                                    ? `✓ ${t("calendarWorkoutCompleted")}`
                                    : t("workoutIncomplete")}
                                </SetStatus>
                              </SetHeader>

                              <SetContent $readOnly={!showSetForm}>
                                <SetText>
                                  <InfoLabel>
                                    {t("workoutTargetLabel")}
                                  </InfoLabel>
                                  {set.targetWeightKg === null
                                    ? t("workoutWeightUnspecified")
                                    : `${set.targetWeightKg} kg`}
                                  {" × "}
                                  {set.targetReps} {t("progressRepsUnit")}
                                </SetText>

                                {showSetForm ? (
                                  <SetForm>
                                    <SetField>
                                      {t("workoutActualWeightLabel")}

                                      <SetInput
                                        type="number"
                                        min={0}
                                        max={1000}
                                        step={0.5}
                                        value={draft.actualWeightKg}
                                        onChange={(event) =>
                                          handleSetDraftChange(
                                            key,
                                            "actualWeightKg",
                                            event.target.value,
                                          )
                                        }
                                        disabled={isBusy}
                                        aria-describedby={`${key}-weight-hint`}
                                      />
                                    </SetField>

                                    <SetField>
                                      {t("workoutActualRepsLabel")}

                                      <SetInput
                                        type="number"
                                        min={0}
                                        max={1000}
                                        step={1}
                                        value={draft.actualReps}
                                        onChange={(event) =>
                                          handleSetDraftChange(
                                            key,
                                            "actualReps",
                                            event.target.value,
                                          )
                                        }
                                        disabled={isBusy}
                                      />
                                    </SetField>

                                    <WeightHint id={`${key}-weight-hint`}>
                                      {t("workoutWeightPlaceholder")}
                                    </WeightHint>
                                    <SetButtonGroup>
                                      {showSetForm && (
                                        <SetSaveButton
                                          $isCompleted={draft.isCompleted}
                                          type="button"
                                          onClick={() =>
                                            void handleSaveSet(
                                              exercise.routineExerciseId,
                                              set.setNumber,
                                            )
                                          }
                                          disabled={isBusy}
                                        >
                                          {isSaving
                                            ? t("workoutSavingSet")
                                            : isSetEditing
                                              ? t("workoutSaveSetEdit")
                                              : t("workoutCompleteSet")}
                                        </SetSaveButton>
                                      )}

                                      {isSetEditing && (
                                        <UndoSetCompletionButton
                                          type="button"
                                          onClick={() => cancelSetEditor(key)}
                                          disabled={isBusy}
                                        >
                                          {t("calendarCancel")}
                                        </UndoSetCompletionButton>
                                      )}
                                    </SetButtonGroup>
                                  </SetForm>
                                ) : (
                                  <SetText>
                                    <InfoLabel>
                                      {t("workoutActualLabel")}
                                    </InfoLabel>
                                    {actualRepsText === "" &&
                                    actualWeightText === "" ? (
                                      "—"
                                    ) : (
                                      <>
                                        {actualWeightText === ""
                                          ? t("workoutWeightUnspecified")
                                          : `${actualWeightText} kg`}
                                        {actualWeightText === "" ||
                                        actualRepsText === ""
                                          ? " · "
                                          : " × "}
                                        {actualRepsText === ""
                                          ? t("workoutIncomplete")
                                          : `${actualRepsText} ${t("progressRepsUnit")}`}
                                      </>
                                    )}
                                  </SetText>
                                )}
                              </SetContent>
                              {!showSetForm && canEditSet && (
                                <SetButtonGroup style={{ marginTop: 12 }}>
                                  <UndoSetCompletionButton
                                    type="button"
                                    onClick={() => startSetEditor(key)}
                                    disabled={
                                      isBusy ||
                                      exerciseEditor !== null ||
                                      (!isEditingCompletedWorkout &&
                                        (isEditingNotes ||
                                          Object.keys(editingSets).length > 0))
                                    }
                                  >
                                    {setLabels.edit}
                                  </UndoSetCompletionButton>
                                  {draft.isCompleted &&
                                    workout.status === "in_progress" && (
                                      <UndoSetCompletionButton
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() =>
                                          void handleUndoSetCompletion(
                                            exercise.routineExerciseId,
                                            set.setNumber,
                                            set.actualReps,
                                            set.actualWeightKg,
                                          )
                                        }
                                      >
                                        {undoingSetKey === key
                                          ? t("workoutUndoingSet")
                                          : t("workoutUndoSet")}
                                      </UndoSetCompletionButton>
                                    )}
                                  {isEditingCompletedWorkout && (
                                    <ClearSetRecordButton
                                      type="button"
                                      disabled={
                                        isBusy ||
                                        exerciseEditor !== null ||
                                        exercise.sets.filter(
                                          (item) =>
                                            !deletedSetKeys.includes(
                                              getSetDraftKey(
                                                exercise.routineExerciseId,
                                                item.setNumber,
                                              ),
                                            ),
                                        ).length <= 1
                                      }
                                      onClick={() =>
                                        markSetForDeletion(
                                          exercise.routineExerciseId,
                                          set.setNumber,
                                        )
                                      }
                                    >
                                      {setLabels.delete}
                                    </ClearSetRecordButton>
                                  )}
                                  {isEditingCompletedWorkout &&
                                    hasActualSetRecord && (
                                      <ClearSetRecordButton
                                        type="button"
                                        disabled={
                                          isBusy || exerciseEditor !== null
                                        }
                                        onClick={() =>
                                          handleClearSetRecord(
                                            exercise.routineExerciseId,
                                            set.setNumber,
                                          )
                                        }
                                      >
                                        {setLabels.reset}
                                      </ClearSetRecordButton>
                                    )}
                                </SetButtonGroup>
                              )}
                            </SetItem>
                          );
                        })}
                      </SetList>
                    </>
                  )}
                </ExerciseCard>
              ))}
            </ExerciseList>
            {exerciseEditor &&
              !effectiveWorkout?.exercises.some(
                (exercise) =>
                  exercise.routineExerciseId ===
                  exerciseEditor.original.routineExerciseId,
              ) && (
                <ExerciseCard>
                  <ExerciseTitle>{exerciseCopy.newExercise}</ExerciseTitle>
                  <RecordExerciseEditor
                    key={exerciseEditor.original.routineExerciseId}
                    draft={exerciseEditor}
                    onChange={setExerciseEditor}
                    onSave={() => void saveExerciseEdit()}
                    onCancel={cancelExerciseEdit}
                    busy={isBusy}
                  />
                </ExerciseCard>
              )}
            {workout.status === "completed" && isEditingCompletedWorkout && (
              <RecordButton
                type="button"
                disabled={
                  isBusy ||
                  exerciseEditor !== null ||
                  Object.keys(editingSets).length > 0 ||
                  (effectiveWorkout?.exercises.length ?? 0) >= 100
                }
                onClick={addRecordedExercise}
              >
                {exerciseCopy.addExercise}
              </RecordButton>
            )}

            <CompletionSection>
              <CompletionTitle>{t("workoutFinishTitle")}</CompletionTitle>

              <WorkoutNotesLabel htmlFor="workout-notes">
                {t("workoutNotesLabel")}
              </WorkoutNotesLabel>

              {workout.status === "in_progress" ||
              isEditingCompletedWorkout ||
              isEditingNotes ? (
                <WorkoutNotesInput
                  id="workout-notes"
                  value={workoutNotes}
                  onChange={(event) => setWorkoutNotes(event.target.value)}
                  placeholder={t("workoutNotesPlaceholder")}
                  disabled={isBusy}
                  maxLength={1000}
                />
              ) : (
                <RoutineNote>{workout.notes || "—"}</RoutineNote>
              )}
              {workout.status === "completed" && !isEditingCompletedWorkout && (
                <SetButtonGroup style={{ marginTop: 12 }}>
                  {isEditingNotes ? (
                    <>
                      <ConfirmCompleteButton
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleSaveNotes()}
                      >
                        {isSavingCompletedEdit
                          ? t("workoutSavingEdit")
                          : t("workoutSaveSetEdit")}
                      </ConfirmCompleteButton>
                      <ContinueEditingButton
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setWorkoutNotes(workout.notes);
                          setIsEditingNotes(false);
                          setWorkoutActionErrorMessage("");
                        }}
                      >
                        {t("calendarCancel")}
                      </ContinueEditingButton>
                    </>
                  ) : (
                    <ContinueEditingButton
                      type="button"
                      disabled={isBusy || hasPartialEditSession}
                      onClick={() => {
                        setWorkoutNotes(workout.notes);
                        setWorkoutActionErrorMessage("");
                        setIsEditingNotes(true);
                      }}
                    >
                      {setLabels.edit}
                    </ContinueEditingButton>
                  )}
                </SetButtonGroup>
              )}

              {completionErrorMessage && (
                <SetErrorMessage role="alert">
                  {renderWorkoutMessage(completionErrorMessage)}
                </SetErrorMessage>
              )}

              {workout.status === "in_progress" ? (
                <CompleteWorkoutButton
                  type="button"
                  onClick={handleOpenCompleteConfirmModal}
                  disabled={
                    isBusy ||
                    exerciseEditor !== null ||
                    Object.keys(editingSets).length > 0
                  }
                >
                  {isCompletingWorkout
                    ? t("workoutCompleting")
                    : t("workoutComplete")}
                </CompleteWorkoutButton>
              ) : isEditingCompletedWorkout ? (
                <SaveWorkoutEditButton
                  type="button"
                  onClick={() => void handleSaveCompletedEdit()}
                  disabled={
                    isBusy ||
                    exerciseEditor !== null ||
                    Object.keys(editingSets).length > 0
                  }
                >
                  {isSavingCompletedEdit
                    ? t("workoutSavingEdit")
                    : t("workoutSaveAllEdits")}
                </SaveWorkoutEditButton>
              ) : (
                <CompletionMessage>
                  {t("workoutCompletedNotice")}
                </CompletionMessage>
              )}
            </CompletionSection>
          </>
        )}
      </Container>

      {isDeleteConfirmOpen && workout && (
        <CommonModal
          title={t("workoutDeleteConfirm")}
          description={`${workout.workoutDate} · ${workout.routineName} · ${workout.routineDayName}\n\n${t("workoutDeleteWarning")}`}
          error={renderWorkoutMessage(deleteErrorMessage)}
          isBusy={isDeletingWorkout}
          onClose={() => setIsDeleteConfirmOpen(false)}
          actions={
            <ModalActions>
              <ModalButton
                type="button"
                autoFocus
                disabled={isDeletingWorkout}
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                {t("calendarCancel")}
              </ModalButton>
              <ModalButton
                type="button"
                $tone="danger"
                disabled={isDeletingWorkout}
                onClick={() => void handleDeleteWorkout()}
              >
                {isDeletingWorkout ? t("workoutDeleting") : t("workoutDelete")}
              </ModalButton>
            </ModalActions>
          }
        />
      )}

      {isCloseEditModalOpen && (
        <CommonModal
          title={
            workout?.status === "completed"
              ? extraLabels.closeTitle
              : t("workoutDiscardTitle")
          }
          description={
            workout?.status === "completed"
              ? extraLabels.closeDescription
              : t("workoutDiscardDescription")
          }
          error={renderWorkoutMessage(
            workoutActionErrorMessage || setSaveErrorMessage,
          )}
          isBusy={isBusy}
          onClose={handleContinueCompletedEdit}
          actions={
            <ModalActions $stacked>
              <ModalButton
                type="button"
                autoFocus
                disabled={isBusy}
                onClick={handleContinueCompletedEdit}
              >
                {t("workoutContinueEditing")}
              </ModalButton>
              <ModalButton
                type="button"
                $tone="danger"
                disabled={isBusy}
                onClick={handleDiscardCompletedEdit}
              >
                {t("workoutDiscardAndClose")}
              </ModalButton>
              {workout?.status === "completed" && (
                <ModalButton
                  type="button"
                  $tone="primary"
                  disabled={isBusy}
                  onClick={() => void handleSaveAndClose()}
                >
                  {isBusy ? t("workoutSavingEdit") : extraLabels.saveClose}
                </ModalButton>
              )}
            </ModalActions>
          }
        />
      )}

      {isCompleteConfirmModalOpen && (
        <CommonModal
          title={t("workoutCompleteConfirmTitle")}
          description={
            <>
              {completedSetCount === 0 && (
                <>
                  {t("workoutNoCompletedSets")}
                  <br />
                </>
              )}
              {t("workoutTotalSetsLabel")}: {totalSetCount}
              <br />
              {t("historyCompletedSets")}: {completedSetCount}
              <br />
              {t("workoutIncompleteSetsLabel")}: {incompleteSetCount}
              <br />
              {t("workoutIncompleteSetsNotice")}
            </>
          }
          error={renderWorkoutMessage(completionErrorMessage)}
          isBusy={isCompletingWorkout}
          onClose={handleCloseCompleteConfirmModal}
          actions={
            <ModalActions>
              <ModalButton
                type="button"
                autoFocus
                disabled={isCompletingWorkout}
                onClick={handleCloseCompleteConfirmModal}
              >
                {t("workoutContinueTraining")}
              </ModalButton>
              <ModalButton
                type="button"
                $tone="primary"
                disabled={isCompletingWorkout}
                onClick={() => void handleCompleteWorkout()}
              >
                {isCompletingWorkout
                  ? t("workoutCompleting")
                  : t("workoutCompleteCurrent")}
              </ModalButton>
            </ModalActions>
          }
        >
          {hasUnsavedInProgressSetChanges && (
            <SetErrorMessage role="alert">
              {t("workoutUnsavedSetsNotice")}
            </SetErrorMessage>
          )}
        </CommonModal>
      )}
    </Page>
  );
}

export default WorkoutPage;
