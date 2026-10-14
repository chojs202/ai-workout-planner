import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styled, { css } from "styled-components";
import { getWorkouts } from "../api/workouts";
import {
  getLatestWorkoutDate,
  getUniqueExerciseCount,
  getWorkoutPeriodSummary,
} from "../utils/workoutProgress";
import WorkoutProgressSection from "../components/workout/WorkoutProgressSection";
import { generateWorkoutFeedback } from "../api/aiFeedback";
import type { Workout } from "../types/workout";
import type { AiWorkoutFeedback } from "../types/aiFeedback";
import { useTranslation } from "../hooks/useTranslation";
import type { TranslationKey } from "../i18n/translations";
import { ApiRequestError } from "../api/translatedRequest";
type HistoryPeriod = "all" | "7" | "30" | "90";
type HistorySort = "latest" | "oldest" | "completed_sets";
const HISTORY_PAGE_SIZE = 3;
function isHistoryPeriod(value: string | null): value is HistoryPeriod {
  return value === "all" || value === "7" || value === "30" || value === "90";
}
function isHistorySort(value: string | null): value is HistorySort {
  return value === "latest" || value === "oldest" || value === "completed_sets";
}
const panelStyle = css`
  min-width: 0;
  padding: var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;
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
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  &::placeholder {
    color: var(--color-text-muted);
    opacity: 1;
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
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const Page = styled.main`
  width: 100%;
  min-width: 0;
  padding: 24px var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
`;
const Container = styled.div`
  width: 100%;
  min-width: 0;
`;

const Header = styled.header`
  margin-bottom: var(--section-gap);
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
  line-height: 1.7;
  overflow-wrap: anywhere;
`;
const ProgressGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: var(--section-gap);
`;
const ProgressCard = styled.article`
  ${panelStyle} padding:14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const ProgressLabel = styled.p`
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;
const ProgressValue = styled.p`
  color: var(--color-text);
  font-size: clamp(22px, 6vw, 26px);
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
`;
const PeriodProgressSection = styled.section`
  ${panelStyle} margin-bottom:var(--section-gap);
`;
const PeriodProgressTitle = styled.h2`
  margin-bottom: 8px;
  font-size: var(--font-section-title);
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
const PeriodProgressDescription = styled.p`
  margin-bottom: 16px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.7;
  overflow-wrap: anywhere;
`;
const PeriodProgressGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  > article {
    padding: 12px;
    background: var(--color-input);
  }
`;
const PeriodProgressNotice = styled.p`
  margin-top: 16px;
  padding: 12px;
  color: var(--color-text-muted);
  background: var(--color-input);
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.7;
  overflow-wrap: anywhere;
`;
const FeedbackSection = styled.section`
  ${panelStyle} margin-bottom:var(--section-gap);
`;
const FeedbackHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  > div {
    min-width: 0;
  }
`;
const FeedbackTitle = styled.h2`
  font-size: var(--font-section-title);
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
const FeedbackDescription = styled.p`
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.7;
  overflow-wrap: anywhere;
`;
const FeedbackButton = styled.button`
  ${buttonStyle} color:var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
  font-weight: 700;
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
`;
const FeedbackResult = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
`;
const FeedbackSummary = styled.p`
  padding: 12px;
  color: var(--color-text);
  background: var(--color-input);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 10px 10px 0;
  font-size: var(--font-caption);
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;
const FeedbackGroup = styled.section`
  margin-top: 20px;
`;
const FeedbackGroupTitle = styled.h3`
  margin-bottom: 10px;
  color: var(--color-primary);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;
const FeedbackList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 20px;
  color: var(--color-text);
  font-size: var(--font-caption);
  line-height: 1.8;
  list-style: disc;
  > li {
    overflow-wrap: anywhere;
  }
  > li::marker {
    color: var(--color-text-muted);
  }
`;
const FeedbackNotice = styled.p`
  margin-top: 20px;
  padding: 12px;
  color: var(--color-text-muted);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;
`;
const FeedbackErrorMessage = styled.p`
  margin-top: 16px;
  padding: 12px;
  color: var(--color-error);
  background: var(--color-input);
  border: 1px solid var(--color-error);
  border-radius: 10px;
  font-size: var(--font-caption);
  line-height: 1.7;
  overflow-wrap: anywhere;
`;
const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const HistoryFilter = styled.div`
  ${panelStyle} margin-bottom:20px;
`;
const FilterLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
`;
const PeriodSelect = styled.select`
  ${controlStyle}
`;
const ExerciseSearchLabel = styled(FilterLabel)`
  margin-top: 16px;
`;
const SortLabel = styled(FilterLabel)`
  margin-top: 16px;
`;
const ExerciseSearchInput = styled.input`
  ${controlStyle}
`;
const ExerciseSearchForm = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
  @media (max-width: 359px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const ExerciseSearchButton = styled.button`
  ${buttonStyle} color:var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
`;
const FilterResult = styled.p`
  min-width: 0;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const FilterFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
`;
const FilterResetButton = styled.button`
  ${buttonStyle} color:var(--color-text-muted);
  background: var(--color-input);
  &:hover:not(:disabled) {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
`;
const Pagination = styled.nav`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 0 64px;
`;

const PageButton = styled.button`
  ${buttonStyle}
  width: 44px;
  padding: 0;
  color: var(--color-primary);
  background: var(--color-input);
  font-size: 24px;
  line-height: 1;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
  }
`;

const PageInformation = styled.span`
  min-width: 0;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const HistoryCard = styled(Link)`
  ${panelStyle} display:block;
  color: var(--color-text);
  &:hover {
    border-color: var(--color-primary);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }
`;
const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const RoutineName = styled.h2`
  min-width: 0;
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
const WorkoutDate = styled.span`
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
`;
const DayName = styled.p`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 14px;
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const WorkoutInfo = styled.p`
  min-width: 0;
  padding: 12px;
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const WorkoutNotes = styled.p`
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

const NotePreview = styled.span`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const StatusMessage = styled.p`
  ${panelStyle} color:var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.7;
  text-align: center;
  overflow-wrap: anywhere;
`;
const ErrorMessage = styled.p`
  ${panelStyle} color:var(--color-error);
  border-color: var(--color-error);
  font-size: var(--font-caption);
  line-height: 1.7;
  overflow-wrap: anywhere;
`;
const DateValue = styled(ProgressValue)`
  font-size: clamp(16px, 4.5vw, 20px);
`;
const InfoLabel = styled.span`
  display: block;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.6;
`;
const InfoValue = styled.strong`
  display: block;
  color: var(--color-text);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const CardDateRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
`;
const CompletedBadge = styled.span`
  padding: 4px 8px;
  color: var(--color-primary);
  background: rgb(121 226 190 / 10%);
  border: 1px solid rgb(121 226 190 / 25%);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
`;
const CardMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
`;

function getSetCount(workout: Workout): {
  completed: number;
  total: number;
} {
  let completed = 0;
  let total = 0;
  workout.exercises.forEach((exercise) => {
    exercise.sets.forEach((set) => {
      total += 1;
      if (set.isCompleted) {
        completed += 1;
      }
    });
  });
  return {
    completed,
    total,
  };
}
function getExerciseCount(workout: Workout): {
  completed: number;
  total: number;
} {
  const completed = workout.exercises.filter((exercise) =>
    exercise.sets.some((set) => set.isCompleted),
  ).length;
  return {
    completed,
    total: workout.exercises.length,
  };
}
function WorkoutHistoryPage() {
  const { t, language } = useTranslation();
  const locale = {
    ko: "ko-KR",
    ja: "ja-JP",
    en: "en-US",
  }[language];
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<TranslationKey | "">("");
  const [feedback, setFeedback] = useState<AiWorkoutFeedback | null>(null);
  const [feedbackWorkoutCount, setFeedbackWorkoutCount] = useState(0);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedbackErrorMessage, setFeedbackErrorMessage] = useState<
    { translationKey: TranslationKey } | { message: string } | null
  >(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get("period");
  const exerciseParam = searchParams.get("exercise");
  const sortParam = searchParams.get("sort");
  const pageParam = searchParams.get("page");
  const historyPeriod: HistoryPeriod = isHistoryPeriod(periodParam)
    ? periodParam
    : "all";
  const exerciseSearch = exerciseParam ?? "";
  const [exerciseSearchInput, setExerciseSearchInput] =
    useState(exerciseSearch);
  const historySort: HistorySort = isHistorySort(sortParam)
    ? sortParam
    : "latest";
  const parsedPage = Number(pageParam);
  const requestedPage =
    Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  function updateFilterQuery(
    key: "period" | "exercise" | "sort",
    value: string,
    defaultValue: string,
  ): void {
    const nextParams = new URLSearchParams(searchParams);
    if (value.trim() === "" || value === defaultValue) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    nextParams.delete("page");
    setSearchParams(nextParams);
  }
  function handleExerciseSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const normalizedSearch = exerciseSearchInput.trim();
    setExerciseSearchInput(normalizedSearch);
    updateFilterQuery("exercise", normalizedSearch, "");
  }
  function updatePageQuery(page: number): void {
    const nextParams = new URLSearchParams(searchParams);
    if (page <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(page));
    }
    setSearchParams(nextParams);
  }
  useEffect(() => {
    setExerciseSearchInput(exerciseSearch);
  }, [exerciseSearch]);
  useEffect(() => {
    let isMounted = true;
    async function loadWorkouts(): Promise<void> {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const result = await getWorkouts();
        if (isMounted) {
          setWorkouts(result.workouts);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(
          error instanceof ApiRequestError
            ? error.translationKey
            : "workoutListFailed",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    void loadWorkouts();
    return () => {
      isMounted = false;
    };
  }, []);
  const uniqueExerciseCount = getUniqueExerciseCount(workouts);
  const totalCompletedSetCount = workouts.reduce(
    (total, workout) => total + getSetCount(workout).completed,
    0,
  );
  const latestWorkoutDate = getLatestWorkoutDate(workouts);
  const periodSummary = getWorkoutPeriodSummary(workouts);
  async function handleGenerateFeedback(): Promise<void> {
    if (workouts.length === 0 || isGeneratingFeedback) {
      return;
    }
    setFeedbackErrorMessage(null);
    setIsGeneratingFeedback(true);
    try {
      const result = await generateWorkoutFeedback(language);
      setFeedback(result.feedback);
      setFeedbackWorkoutCount(result.basedOnWorkoutCount);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFeedbackErrorMessage({
          translationKey: error.translationKey,
        });
      } else if (error instanceof Error) {
        setFeedbackErrorMessage({
          message: error.message,
        });
      } else {
        setFeedbackErrorMessage({
          translationKey: "historyFeedbackFailed",
        });
      }
    } finally {
      setIsGeneratingFeedback(false);
    }
  }
  const filteredWorkouts = useMemo(() => {
    const normalizedSearch = exerciseSearch.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = historyPeriod === "all" ? null : new Date(today);
    if (startDate) {
      startDate.setDate(today.getDate() - (Number(historyPeriod) - 1));
    }
    const matchedWorkouts = workouts.filter((workout) => {
      const workoutDate = new Date(`${workout.workoutDate}T00:00:00`);
      const matchesPeriod =
        startDate === null ||
        (workoutDate >= startDate && workoutDate <= today);
      const matchesExercise =
        normalizedSearch.length === 0 ||
        workout.exercises.some(
          (exercise) =>
            exercise.name.trim().toLowerCase().includes(normalizedSearch) &&
            exercise.sets.some((set) => set.isCompleted),
        );
      return matchesPeriod && matchesExercise;
    });
    return [...matchedWorkouts].sort((first, second) => {
      if (historySort === "completed_sets") {
        const firstCompletedSets = getSetCount(first).completed;
        const secondCompletedSets = getSetCount(second).completed;
        const setDifference = secondCompletedSets - firstCompletedSets;
        if (setDifference !== 0) {
          return setDifference;
        }
      }
      const dateComparison = first.workoutDate.localeCompare(
        second.workoutDate,
      );
      if (historySort === "oldest") {
        return dateComparison;
      }
      return -dateComparison;
    });
  }, [workouts, historyPeriod, exerciseSearch, historySort]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredWorkouts.length / HISTORY_PAGE_SIZE),
  );
  const currentPage = Math.min(requestedPage, totalPages);
  useEffect(() => {
    if (isLoading) {
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    let hasChanged = false;
    if (periodParam !== null && !isHistoryPeriod(periodParam)) {
      nextParams.delete("period");
      hasChanged = true;
    }
    if (sortParam !== null && !isHistorySort(sortParam)) {
      nextParams.delete("sort");
      hasChanged = true;
    }
    if (exerciseParam !== null && exerciseParam.trim() === "") {
      nextParams.delete("exercise");
      hasChanged = true;
    }
    if (pageParam !== null) {
      if (!Number.isInteger(parsedPage) || parsedPage <= 1) {
        nextParams.delete("page");
        hasChanged = true;
      } else if (parsedPage > totalPages) {
        if (totalPages <= 1) {
          nextParams.delete("page");
        } else {
          nextParams.set("page", String(totalPages));
        }
        hasChanged = true;
      }
    }
    if (hasChanged) {
      setSearchParams(nextParams, {
        replace: true,
      });
    }
  }, [
    isLoading,
    searchParams,
    setSearchParams,
    periodParam,
    exerciseParam,
    sortParam,
    pageParam,
    parsedPage,
    totalPages,
  ]);
  const paginatedWorkouts = useMemo(() => {
    const startIndex = (currentPage - 1) * HISTORY_PAGE_SIZE;
    return filteredWorkouts.slice(startIndex, startIndex + HISTORY_PAGE_SIZE);
  }, [filteredWorkouts, currentPage]);
  return (
    <Page>
      <Container>
        <Header>
          <Title>{t("historyTitle")}</Title>
          <Description>{t("historyDescription")}</Description>
        </Header>
        {!isLoading && !errorMessage && workouts.length > 0 && (
          <ProgressGrid>
            <ProgressCard>
              <ProgressLabel>{t("historyCompletedWorkouts")}</ProgressLabel>
              <ProgressValue>{workouts.length}</ProgressValue>
            </ProgressCard>
            <ProgressCard>
              <ProgressLabel>{t("historyCompletedSets")}</ProgressLabel>
              <ProgressValue>{totalCompletedSetCount}</ProgressValue>
            </ProgressCard>
            <ProgressCard>
              <ProgressLabel>{t("historyExerciseCount")}</ProgressLabel>
              <ProgressValue>{uniqueExerciseCount}</ProgressValue>
            </ProgressCard>
            <ProgressCard>
              <ProgressLabel>{t("historyLatestWorkoutDate")}</ProgressLabel>
              <DateValue>{latestWorkoutDate}</DateValue>
            </ProgressCard>
          </ProgressGrid>
        )}
        {!isLoading && !errorMessage && workouts.length > 0 && (
          <PeriodProgressSection>
            <PeriodProgressTitle>
              {t("historyRecentProgress")}
            </PeriodProgressTitle>
            <PeriodProgressDescription>
              {t("historyRecentProgressDescription")}
            </PeriodProgressDescription>
            <PeriodProgressGrid>
              <ProgressCard>
                <ProgressLabel>{t("historyLast7DaysWorkouts")}</ProgressLabel>
                <ProgressValue>
                  {periodSummary.last7DaysWorkoutCount}
                </ProgressValue>
              </ProgressCard>
              <ProgressCard>
                <ProgressLabel>{t("historyLast30DaysWorkouts")}</ProgressLabel>
                <ProgressValue>
                  {periodSummary.last30DaysWorkoutCount}
                </ProgressValue>
              </ProgressCard>
              <ProgressCard>
                <ProgressLabel>{t("historyLast30DaysSets")}</ProgressLabel>
                <ProgressValue>
                  {periodSummary.last30DaysCompletedSetCount}
                </ProgressValue>
              </ProgressCard>
              <ProgressCard>
                <ProgressLabel>{t("historyLast30DaysVolume")}</ProgressLabel>
                <ProgressValue>
                  {periodSummary.last30DaysVolumeKg.toLocaleString(locale, {
                    maximumFractionDigits: 1,
                  })}{" "}
                  kg
                </ProgressValue>
              </ProgressCard>
            </PeriodProgressGrid>
            <PeriodProgressNotice>
              {t("historyVolumeNotice")}
            </PeriodProgressNotice>
          </PeriodProgressSection>
        )}
        {!isLoading && !errorMessage && workouts.length > 0 && (
          <WorkoutProgressSection workouts={workouts} />
        )}
        {!isLoading && !errorMessage && workouts.length > 0 && (
          <FeedbackSection>
            <FeedbackHeader>
              <div>
                <FeedbackTitle>{t("historyFeedbackTitle")}</FeedbackTitle>
                <FeedbackDescription>
                  {t("historyFeedbackDescription")}
                </FeedbackDescription>
              </div>
              <FeedbackButton
                type="button"
                onClick={handleGenerateFeedback}
                disabled={isGeneratingFeedback}
              >
                {isGeneratingFeedback
                  ? t("historyFeedbackGenerating")
                  : feedback
                    ? t("historyFeedbackRegenerate")
                    : t("historyFeedbackGenerate")}
              </FeedbackButton>
            </FeedbackHeader>
            {feedbackErrorMessage && (
              <FeedbackErrorMessage role="alert">
                {"translationKey" in feedbackErrorMessage
                  ? t(feedbackErrorMessage.translationKey)
                  : feedbackErrorMessage.message}
              </FeedbackErrorMessage>
            )}
            {feedback && (
              <FeedbackResult>
                <FeedbackSummary>{feedback.summary}</FeedbackSummary>
                <FeedbackGroup>
                  <FeedbackGroupTitle>
                    {t("historyFeedbackAchievements")}
                  </FeedbackGroupTitle>
                  <FeedbackList>
                    {feedback.achievements.map((achievement, index) => (
                      <li key={`${achievement}-${index}`}>{achievement}</li>
                    ))}
                  </FeedbackList>
                </FeedbackGroup>
                <FeedbackGroup>
                  <FeedbackGroupTitle>
                    {t("historyFeedbackImprovements")}
                  </FeedbackGroupTitle>
                  <FeedbackList>
                    {feedback.improvements.map((improvement, index) => (
                      <li key={`${improvement}-${index}`}>{improvement}</li>
                    ))}
                  </FeedbackList>
                </FeedbackGroup>
                <FeedbackGroup>
                  <FeedbackGroupTitle>
                    {t("historyFeedbackTips")}
                  </FeedbackGroupTitle>
                  <FeedbackList>
                    {feedback.nextWorkoutTips.map((tip, index) => (
                      <li key={`${tip}-${index}`}>{tip}</li>
                    ))}
                  </FeedbackList>
                </FeedbackGroup>
                <FeedbackNotice>
                  {t("historyFeedbackRecordCount")}: {feedbackWorkoutCount}
                  <br />
                  {feedback.dataNotice}
                </FeedbackNotice>
              </FeedbackResult>
            )}
          </FeedbackSection>
        )}
        {!isLoading && errorMessage && (
          <ErrorMessage role="alert">{t(errorMessage)}</ErrorMessage>
        )}
        {!isLoading && !errorMessage && workouts.length > 0 && (
          <HistoryFilter>
            <FilterLabel htmlFor="history-period">
              {t("historyPeriod")}
            </FilterLabel>
            <PeriodSelect
              id="history-period"
              value={historyPeriod}
              onChange={(event) => {
                updateFilterQuery("period", event.target.value, "all");
              }}
            >
              <option value="all">{t("historyPeriodAll")}</option>
              <option value="7">{t("historyPeriod7")}</option>
              <option value="30">{t("historyPeriod30")}</option>
              <option value="90">{t("historyPeriod90")}</option>
            </PeriodSelect>
            <ExerciseSearchLabel htmlFor="exercise-search">
              {t("historyExerciseSearch")}
            </ExerciseSearchLabel>
            <ExerciseSearchForm role="search" onSubmit={handleExerciseSearch}>
              <ExerciseSearchInput
                id="exercise-search"
                type="search"
                value={exerciseSearchInput}
                placeholder={t("historySearchPlaceholder")}
                onChange={(event) => {
                  setExerciseSearchInput(event.target.value);
                }}
              />
              <ExerciseSearchButton type="submit">
                {t("historySearch")}
              </ExerciseSearchButton>
            </ExerciseSearchForm>
            <SortLabel htmlFor="history-sort">{t("historySort")}</SortLabel>
            <PeriodSelect
              id="history-sort"
              value={historySort}
              onChange={(event) => {
                updateFilterQuery("sort", event.target.value, "latest");
              }}
            >
              <option value="latest">{t("historySortLatest")}</option>
              <option value="oldest">{t("historySortOldest")}</option>
              <option value="completed_sets">
                {t("historySortCompletedSets")}
              </option>
            </PeriodSelect>
            <FilterFooter>
              <FilterResult>
                {t("historySearchResultCount")}: {filteredWorkouts.length}
              </FilterResult>
              <FilterResetButton
                type="button"
                disabled={
                  historyPeriod === "all" &&
                  exerciseSearch.trim().length === 0 &&
                  exerciseSearchInput.trim().length === 0 &&
                  historySort === "latest"
                }
                onClick={() => {
                  setExerciseSearchInput("");
                  setSearchParams(new URLSearchParams());
                }}
              >
                {t("historyResetFilters")}
              </FilterResetButton>
            </FilterFooter>
          </HistoryFilter>
        )}
        {!isLoading && !errorMessage && workouts.length === 0 && (
          <StatusMessage>{t("historyNoWorkouts")}</StatusMessage>
        )}
        {!isLoading &&
          !errorMessage &&
          workouts.length > 0 &&
          filteredWorkouts.length === 0 && (
            <StatusMessage>{t("historyNoMatchingWorkouts")}</StatusMessage>
          )}
        {!isLoading && !errorMessage && filteredWorkouts.length > 0 && (
          <>
            <HistoryList>
              {paginatedWorkouts.map((workout) => {
                const setCount = getSetCount(workout);
                const exerciseCount = getExerciseCount(workout);
                return (
                  <HistoryCard key={workout.id} to={`/workouts/${workout.id}`}>
                    <CardHeader>
                      <CardDateRow>
                        <WorkoutDate>{workout.workoutDate}</WorkoutDate>
                        <CompletedBadge>
                          ✓ {t("calendarWorkoutCompleted")}
                        </CompletedBadge>
                      </CardDateRow>
                      <RoutineName>{workout.routineName}</RoutineName>
                    </CardHeader>
                    <DayName>
                      <InfoLabel>{t("calendarWorkoutDayLabel")}</InfoLabel>
                      <InfoValue>{workout.routineDayName}</InfoValue>
                    </DayName>
                    <CardMetrics>
                      <WorkoutInfo>
                        <InfoLabel>{t("historyPerformedExercises")}</InfoLabel>
                        <InfoValue>
                          {exerciseCount.completed} / {exerciseCount.total}
                        </InfoValue>
                      </WorkoutInfo>
                      <WorkoutInfo>
                        <InfoLabel>{t("historyCompletedSets")}</InfoLabel>
                        <InfoValue>
                          {setCount.completed} / {setCount.total}
                        </InfoValue>
                      </WorkoutInfo>
                    </CardMetrics>
                    {workout.notes && (
                      <WorkoutNotes>
                        <InfoLabel>{t("calendarNotesLabel")}</InfoLabel>
                        <NotePreview>{workout.notes}</NotePreview>
                      </WorkoutNotes>
                    )}
                  </HistoryCard>
                );
              })}
            </HistoryList>
            {totalPages > 1 && (
              <Pagination aria-label={t("historyPagination")}>
                <PageButton
                  type="button"
                  aria-label={t("historyPreviousPage")}
                  disabled={currentPage === 1}
                  onClick={() => updatePageQuery(currentPage - 1)}
                >
                  <span aria-hidden="true">‹</span>
                </PageButton>

                <PageInformation>
                  {currentPage} / {totalPages}
                </PageInformation>

                <PageButton
                  type="button"
                  aria-label={t("historyNextPage")}
                  disabled={currentPage === totalPages}
                  onClick={() => updatePageQuery(currentPage + 1)}
                >
                  <span aria-hidden="true">›</span>
                </PageButton>
              </Pagination>
            )}
          </>
        )}
      </Container>
    </Page>
  );
}
export default WorkoutHistoryPage;
