import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { getRoutines } from "../api/routines";
import { getWorkouts, startWorkout } from "../api/workouts";
import type { Workout } from "../types/workout";
import type { Routine } from "../types/routine";
import { useTranslation } from "../hooks/useTranslation";
import { ApiRequestError } from "../api/translatedRequest";
import type { TranslationKey } from "../i18n/translations";

interface CalendarDate {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createCalendarDates(currentMonth: Date): CalendarDate[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, index - firstDay + 1);

    return {
      dateKey: formatDateKey(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

const Page = styled.main`
  width: 100%;
  padding: 24px var(--page-padding);
  background: var(--color-background);
`;

const Container = styled.div`
  width: 100%;
  min-width: 0;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
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

const Description = styled.p`
  margin-bottom: var(--section-gap);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const CalendarCard = styled.section`
  padding: var(--card-padding);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;

const CalendarHeader = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;

  > button {
    padding: 0;
    font-size: 24px;
    line-height: 1;
  }
`;

const MonthButton = styled.button`
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 8px 10px;

  color: var(--color-text);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);

  font-size: var(--font-caption);
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;

  &:hover {
    border-color: var(--color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

const MonthTitle = styled.h2`
  min-width: 0;
  color: var(--color-text);
  font-size: clamp(16px, 4vw, 18px);
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
  overflow-wrap: anywhere;
`;

const MonthPickerArea = styled.div`
  position: relative;
  min-width: 0;
`;

const MonthTitleButton = styled.button`
  width: 100%;
  min-height: var(--control-min-height);
  padding: 8px 4px;

  color: inherit;
  background: transparent;
  border-radius: var(--radius-control);
  font: inherit;

  &:hover {
    background: var(--color-input);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

const MonthPickerPanel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  z-index: 10;

  width: min(320px, calc(100vw - 64px));
  padding: 16px;

  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: 0 12px 30px rgb(0 0 0 / 35%);

  transform: translateX(-50%);
`;

const MiniCalendar = styled.div`
  margin-top: 16px;
`;

const MiniCalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px;
`;

const MiniWeekday = styled.span`
  min-width: 0;
  padding: 6px 0;
  color: var(--color-text-muted);
  font-size: 12px;
  text-align: center;
`;

const MiniDateButton = styled.button<{
  $isSelected: boolean;
  $isToday: boolean;
}>`
  position: relative;
  display: grid;
  place-items: center;

  min-width: 0;
  height: 38px;
  padding: 0 0 4px;

  color: ${({ $isSelected }) =>
    $isSelected ? "var(--color-on-primary)" : "var(--color-text)"};

  background: ${({ $isSelected }) =>
    $isSelected ? "var(--color-primary)" : "transparent"};

  border: 1px solid;
  border-color: ${({ $isToday }) =>
    $isToday ? "var(--color-primary)" : "transparent"};

  border-radius: 8px;
  font-size: 13px;
  font-weight: ${({ $isSelected }) => ($isSelected ? 700 : 500)};

  &:hover {
    background: ${({ $isSelected }) =>
      $isSelected ? "var(--color-primary-hover)" : "var(--color-input)"};
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }
`;

const MiniWorkoutDot = styled.span<{
  $isSelected: boolean;
}>`
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;

  background: ${({ $isSelected }) =>
    $isSelected ? "var(--color-on-primary)" : "var(--color-primary)"};

  border-radius: 50%;
`;

const MiniEmptyDate = styled.span`
  height: 38px;
`;

const MonthPickerFields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
`;

const MonthPickerLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;

  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 600;
`;

const YearInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 10px;

  color: var(--color-text);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);

  font: inherit;
  font-size: var(--font-body);
  color-scheme: dark;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

const MonthSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 10px;

  color: var(--color-text);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);

  font: inherit;
  font-size: var(--font-body);
  color-scheme: dark;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

const MonthPickerActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const MonthPickerError = styled.p`
  margin-top: 12px;
  color: var(--color-error);
  font-size: var(--font-caption);
  line-height: 1.5;
`;

const TodayRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
`;

const WeekdayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 8px;

  @media (max-width: 600px) {
    gap: 4px;
  }
`;

const Weekday = styled.div`
  min-width: 0;
  padding: 8px 0;
  color: var(--color-text-muted);
  font-size: clamp(11px, 3vw, 14px);
  font-weight: 500;
  text-align: center;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;

  @media (max-width: 600px) {
    gap: 4px;
  }
`;

const DateButton = styled.button<{
  $isCurrentMonth: boolean;
  $isSelected: boolean;
  $hasWorkout: boolean;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  min-width: 0;
  min-height: 48px;
  padding: 6px 2px;

  color: ${({ $isSelected, $isCurrentMonth }) =>
    $isSelected
      ? "var(--color-on-primary)"
      : $isCurrentMonth
        ? "var(--color-text)"
        : "var(--color-text-muted)"};

  background: ${({ $isSelected }) =>
    $isSelected ? "var(--color-primary)" : "transparent"};

  border: 1px solid transparent;
  border-radius: 12px;
  font-size: clamp(14px, 3.5vw, 16px);
  font-weight: ${({ $isSelected }) => ($isSelected ? 700 : 500)};
  line-height: 1.3;

  &:hover {
    border-color: var(--color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  > span {
    background: ${({ $isSelected }) =>
      $isSelected ? "var(--color-on-primary)" : "var(--color-primary)"};
  }
`;

const AddWorkoutSection = styled.section`
  margin-top: var(--section-gap);
  padding: var(--card-padding);

  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;

const AddWorkoutTitle = styled.h2`
  margin-bottom: 8px;
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const AddWorkoutDescription = styled.p`
  margin-bottom: 20px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.6;
`;

const AddWorkoutFields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
`;

const AddWorkoutField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AddWorkoutLabel = styled.label`
  color: var(--color-text);
  font-size: var(--font-caption);
  font-weight: 600;
`;

const AddWorkoutSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 12px;

  color: var(--color-text);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);

  font-size: var(--font-body);
  color-scheme: dark;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    color: var(--color-text-muted);
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StartWorkoutButton = styled.button`
  width: 100%;
  min-height: var(--control-min-height);
  margin-top: 20px;
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
    outline-offset: 3px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StartWorkoutError = styled.p`
  margin-top: 14px;
  color: var(--color-error);
  font-size: var(--font-caption);
  line-height: 1.5;
`;

const WorkoutCount = styled.span`
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);

  display: block;
  width: 6px;
  height: 6px;
  overflow: hidden;
  border-radius: 50%;

  font-size: 0;
  line-height: 0;
  pointer-events: none;
`;

const SelectedSection = styled.section`
  margin-top: var(--section-gap);
  color: var(--color-text);
`;

const SelectedTitle = styled.h2`
  margin-bottom: 16px;
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const WorkoutList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const WorkoutCard = styled(Link)`
  display: block;
  min-width: 0;
  padding: var(--card-padding);

  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);

  &:hover {
    border-color: var(--color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

const WorkoutHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
`;

const WorkoutStatusBadge = styled.span<{
  $status: Workout["status"];
}>`
  flex-shrink: 0;
  max-width: 100%;
  padding: 5px 10px;

  color: ${({ $status }) =>
    $status === "in_progress" ? "var(--color-text)" : "var(--color-primary)"};

  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: 999px;

  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const WorkoutName = styled.h3`
  flex: 1 1 160px;
  min-width: 0;
  margin: 0;

  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const WorkoutInfo = styled.p`
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const StatusMessage = styled.p`
  padding: var(--card-padding);

  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);

  font-size: var(--font-caption);
  line-height: 1.6;
  text-align: center;
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

function WorkoutCalendarPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const locale = {
    ko: "ko-KR",
    ja: "ja-JP",
    en: "en-US",
  }[language];

  const weekdayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
  });

  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    weekdayFormatter.format(new Date(2026, 0, 4 + index)),
  );
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(today));
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState("");
  const [pickerMonth, setPickerMonth] = useState("");
  const [hasMonthPickerError, setHasMonthPickerError] = useState(false);

  const monthPickerRef = useRef<HTMLDivElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);

  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const [inProgressWorkouts, setInProgressWorkouts] = useState<Workout[]>([]);

  const [routines, setRoutines] = useState<Routine[]>([]);

  const [selectedRoutineId, setSelectedRoutineId] = useState("");

  const [selectedRoutineDayId, setSelectedRoutineDayId] = useState("");

  const [isStartingWorkout, setIsStartingWorkout] = useState(false);

  const [startWorkoutErrorMessage, setStartWorkoutErrorMessage] = useState<
    TranslationKey | ""
  >("");

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<TranslationKey | "">("");

  useEffect(() => {
    let isMounted = true;

    async function loadCalendarData(): Promise<void> {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [workoutResult, inProgressWorkoutResult, routineResult] =
          await Promise.all([
            getWorkouts("completed"),
            getWorkouts("in_progress"),
            getRoutines(),
          ]);

        if (isMounted) {
          setWorkouts(workoutResult.workouts);

          setInProgressWorkouts(inProgressWorkoutResult.workouts);

          setRoutines(routineResult.routines);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof ApiRequestError
            ? error.translationKey
            : "calendarLoadFailed",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCalendarData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isMonthPickerOpen) {
      return;
    }

    yearInputRef.current?.focus();

    function handleOutsideClick(event: PointerEvent): void {
      if (
        event.target instanceof Node &&
        monthPickerRef.current &&
        !monthPickerRef.current.contains(event.target)
      ) {
        setIsMonthPickerOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsMonthPickerOpen(false);

        monthPickerRef.current
          ?.querySelector<HTMLButtonElement>("button")
          ?.focus();
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMonthPickerOpen]);

  const pickerYearNumber = Number(pickerYear);
  const pickerMonthNumber = Number(pickerMonth);

  const isValidPickerMonth =
    Number.isInteger(pickerYearNumber) &&
    pickerYearNumber >= 1900 &&
    pickerYearNumber <= 2100 &&
    Number.isInteger(pickerMonthNumber) &&
    pickerMonthNumber >= 1 &&
    pickerMonthNumber <= 12;

  const pickerPreviewMonth = isValidPickerMonth
    ? new Date(pickerYearNumber, pickerMonthNumber - 1, 1)
    : null;

  const miniCalendarDates = pickerPreviewMonth
    ? createCalendarDates(pickerPreviewMonth)
    : [];

  const todayDateKey = formatDateKey(today);

  const calendarDates = createCalendarDates(currentMonth);

  const allWorkouts = [...inProgressWorkouts, ...workouts];

  const workoutsByDate = allWorkouts.reduce<Record<string, Workout[]>>(
    (result, workout) => {
      const dateWorkouts = result[workout.workoutDate] ?? [];

      result[workout.workoutDate] = [...dateWorkouts, workout];

      return result;
    },
    {},
  );

  const selectedWorkouts = workoutsByDate[selectedDate] ?? [];

  const selectedRoutine =
    routines.find((routine) => routine.id === selectedRoutineId) ?? null;

  async function handleStartWorkout(): Promise<void> {
    if (!selectedRoutineId || !selectedRoutineDayId || isStartingWorkout) {
      return;
    }

    setStartWorkoutErrorMessage("");
    setIsStartingWorkout(true);

    try {
      const result = await startWorkout({
        routineId: selectedRoutineId,
        routineDayId: selectedRoutineDayId,
        workoutDate: selectedDate,
      });

      navigate(`/workouts/${result.workout.id}`);
    } catch (error) {
      setStartWorkoutErrorMessage(
        error instanceof ApiRequestError
          ? error.translationKey
          : "workoutStartFailed",
      );
    } finally {
      setIsStartingWorkout(false);
    }
  }

  function handleToggleMonthPicker(): void {
    if (isMonthPickerOpen) {
      setIsMonthPickerOpen(false);
      return;
    }

    setPickerYear(String(currentMonth.getFullYear()));
    setPickerMonth(String(currentMonth.getMonth() + 1));
    setHasMonthPickerError(false);
    setIsMonthPickerOpen(true);
  }

  function handleSelectPickerDate(dateKey: string): void {
    const [year, month, day] = dateKey.split("-").map(Number);
    const nextDate = new Date(year, month - 1, day);

    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDate(formatDateKey(nextDate));
    setStartWorkoutErrorMessage("");
    setHasMonthPickerError(false);
    setIsMonthPickerOpen(false);

    monthPickerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }

  function handleMoveToToday(): void {
    const currentDate = new Date();

    setCurrentMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    );
    setSelectedDate(formatDateKey(currentDate));
    setStartWorkoutErrorMessage("");
    setHasMonthPickerError(false);
    setIsMonthPickerOpen(false);
  }

  function moveMonth(amount: number): void {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + amount,
      1,
    );

    setCurrentMonth(nextMonth);
    setSelectedDate(formatDateKey(nextMonth));
    setStartWorkoutErrorMessage("");
    setIsMonthPickerOpen(false);
  }

  return (
    <Page>
      <Container>
        <PageHeader>
          <Title>{t("calendarTitle")}</Title>
        </PageHeader>

        <Description>{t("calendarDescription")}</Description>

        {!isLoading && errorMessage && (
          <ErrorMessage role="alert">{t(errorMessage)}</ErrorMessage>
        )}

        {!isLoading && !errorMessage && (
          <>
            <CalendarCard>
              <CalendarHeader>
                <MonthButton
                  type="button"
                  aria-label={t("calendarPreviousMonth")}
                  onClick={() => moveMonth(-1)}
                >
                  <span aria-hidden="true">‹</span>
                </MonthButton>

                <MonthPickerArea ref={monthPickerRef}>
                  <MonthTitle>
                    <MonthTitleButton
                      type="button"
                      onClick={handleToggleMonthPicker}
                      aria-label={`${t("calendarChooseMonth")}: ${new Intl.DateTimeFormat(
                        locale,
                        { year: "numeric", month: "long" },
                      ).format(currentMonth)}`}
                      aria-expanded={isMonthPickerOpen}
                      aria-controls={
                        isMonthPickerOpen ? "calendar-month-picker" : undefined
                      }
                    >
                      {new Intl.DateTimeFormat(locale, {
                        year: "numeric",
                        month: "long",
                      }).format(currentMonth)}
                      {" ▾"}
                    </MonthTitleButton>
                  </MonthTitle>

                  {isMonthPickerOpen && (
                    <MonthPickerPanel
                      id="calendar-month-picker"
                      role="group"
                      aria-label={t("calendarChooseMonth")}
                    >
                      <MonthPickerFields>
                        <MonthPickerLabel>
                          {t("calendarYear")}

                          <YearInput
                            ref={yearInputRef}
                            type="number"
                            min={1900}
                            max={2100}
                            step={1}
                            value={pickerYear}
                            onChange={(event) => {
                              setPickerYear(event.target.value);
                              setHasMonthPickerError(false);
                            }}
                          />
                        </MonthPickerLabel>

                        <MonthPickerLabel>
                          {t("calendarMonth")}

                          <MonthSelect
                            value={pickerMonth}
                            onChange={(event) => {
                              setPickerMonth(event.target.value);
                              setHasMonthPickerError(false);
                            }}
                          >
                            {Array.from({ length: 12 }, (_, index) => (
                              <option key={index + 1} value={String(index + 1)}>
                                {new Intl.DateTimeFormat(locale, {
                                  month: "long",
                                }).format(new Date(2026, index, 1))}
                              </option>
                            ))}
                          </MonthSelect>
                        </MonthPickerLabel>
                      </MonthPickerFields>

                      {(hasMonthPickerError || !isValidPickerMonth) && (
                        <MonthPickerError role="alert">
                          {t("calendarInvalidMonth")}
                        </MonthPickerError>
                      )}

                      {pickerPreviewMonth && (
                        <MiniCalendar>
                          <MiniCalendarGrid>
                            {weekdayLabels.map((label, index) => (
                              <MiniWeekday key={index}>{label}</MiniWeekday>
                            ))}
                          </MiniCalendarGrid>

                          <MiniCalendarGrid>
                            {miniCalendarDates.map((date) => {
                              if (!date.isCurrentMonth) {
                                return (
                                  <MiniEmptyDate
                                    key={date.dateKey}
                                    aria-hidden="true"
                                  />
                                );
                              }

                              const isSelected = date.dateKey === selectedDate;

                              const hasWorkout =
                                (workoutsByDate[date.dateKey]?.length ?? 0) > 0;

                              const dateLabel = new Intl.DateTimeFormat(
                                locale,
                                {
                                  dateStyle: "full",
                                },
                              ).format(
                                new Date(
                                  pickerYearNumber,
                                  pickerMonthNumber - 1,
                                  date.dayNumber,
                                ),
                              );

                              return (
                                <MiniDateButton
                                  key={date.dateKey}
                                  type="button"
                                  $isSelected={isSelected}
                                  $isToday={date.dateKey === todayDateKey}
                                  aria-label={dateLabel}
                                  aria-pressed={isSelected}
                                  aria-current={
                                    date.dateKey === todayDateKey
                                      ? "date"
                                      : undefined
                                  }
                                  onClick={() => {
                                    handleSelectPickerDate(date.dateKey);
                                  }}
                                >
                                  {date.dayNumber}

                                  {hasWorkout && (
                                    <MiniWorkoutDot
                                      $isSelected={isSelected}
                                      aria-hidden="true"
                                    />
                                  )}
                                </MiniDateButton>
                              );
                            })}
                          </MiniCalendarGrid>
                        </MiniCalendar>
                      )}

                      <MonthPickerActions>
                        <MonthButton type="button" onClick={handleMoveToToday}>
                          {t("calendarToday")}
                        </MonthButton>

                        <MonthButton
                          type="button"
                          onClick={() => {
                            setIsMonthPickerOpen(false);

                            monthPickerRef.current
                              ?.querySelector<HTMLButtonElement>("button")
                              ?.focus();
                          }}
                        >
                          {t("calendarCancel")}
                        </MonthButton>
                      </MonthPickerActions>
                    </MonthPickerPanel>
                  )}
                </MonthPickerArea>

                <MonthButton
                  type="button"
                  aria-label={t("calendarNextMonth")}
                  onClick={() => moveMonth(1)}
                >
                  <span aria-hidden="true">›</span>
                </MonthButton>
              </CalendarHeader>

              <TodayRow>
                <MonthButton type="button" onClick={handleMoveToToday}>
                  {t("calendarToday")}
                </MonthButton>
              </TodayRow>

              <WeekdayGrid>
                {weekdayLabels.map((weekday) => (
                  <Weekday key={weekday}>{weekday}</Weekday>
                ))}
              </WeekdayGrid>

              <CalendarGrid>
                {calendarDates.map((calendarDate) => {
                  const dateWorkouts =
                    workoutsByDate[calendarDate.dateKey] ?? [];

                  return (
                    <DateButton
                      key={calendarDate.dateKey}
                      type="button"
                      $isCurrentMonth={calendarDate.isCurrentMonth}
                      $isSelected={selectedDate === calendarDate.dateKey}
                      $hasWorkout={dateWorkouts.length > 0}
                      onClick={() => {
                        setSelectedDate(calendarDate.dateKey);
                        setStartWorkoutErrorMessage("");
                      }}
                    >
                      {calendarDate.dayNumber}

                      {dateWorkouts.length > 0 && (
                        <WorkoutCount>
                          {dateWorkouts.length} {t("calendarWorkoutCountUnit")}
                        </WorkoutCount>
                      )}
                    </DateButton>
                  );
                })}
              </CalendarGrid>
            </CalendarCard>

            {routines.length > 0 && (
              <AddWorkoutSection>
                <AddWorkoutTitle>
                  {selectedDate} · {t("calendarAddWorkout")}
                </AddWorkoutTitle>

                <AddWorkoutDescription>
                  {t("calendarAddWorkoutDescription")}
                </AddWorkoutDescription>

                <AddWorkoutFields>
                  <AddWorkoutField>
                    <AddWorkoutLabel htmlFor="calendar-routine">
                      {t("calendarRoutineLabel")}
                    </AddWorkoutLabel>

                    <AddWorkoutSelect
                      id="calendar-routine"
                      value={selectedRoutineId}
                      onChange={(event) => {
                        setSelectedRoutineId(event.target.value);

                        setSelectedRoutineDayId("");

                        setStartWorkoutErrorMessage("");
                      }}
                    >
                      <option value="">{t("calendarSelectRoutine")}</option>

                      {routines.map((routine) => (
                        <option key={routine.id} value={routine.id}>
                          {routine.name}
                        </option>
                      ))}
                    </AddWorkoutSelect>
                  </AddWorkoutField>

                  <AddWorkoutField>
                    <AddWorkoutLabel htmlFor="calendar-routine-day">
                      {t("calendarWorkoutDayLabel")}
                    </AddWorkoutLabel>

                    <AddWorkoutSelect
                      id="calendar-routine-day"
                      value={selectedRoutineDayId}
                      onChange={(event) => {
                        setSelectedRoutineDayId(event.target.value);

                        setStartWorkoutErrorMessage("");
                      }}
                      disabled={!selectedRoutine}
                    >
                      <option value="">{t("calendarSelectWorkoutDay")}</option>

                      {selectedRoutine?.days.map((routineDay) => (
                        <option key={routineDay.id} value={routineDay.id}>
                          {t("calendarWorkoutDayLabel")} {routineDay.dayNumber}{" "}
                          - {routineDay.name}
                        </option>
                      ))}
                    </AddWorkoutSelect>
                  </AddWorkoutField>
                </AddWorkoutFields>

                {startWorkoutErrorMessage && (
                  <StartWorkoutError role="alert">
                    {t(startWorkoutErrorMessage)}
                  </StartWorkoutError>
                )}

                <StartWorkoutButton
                  type="button"
                  onClick={handleStartWorkout}
                  disabled={
                    !selectedRoutineId ||
                    !selectedRoutineDayId ||
                    isStartingWorkout
                  }
                >
                  {isStartingWorkout
                    ? t("calendarStartingWorkout")
                    : `${selectedDate} · ${t("calendarStartWorkout")}`}
                </StartWorkoutButton>
              </AddWorkoutSection>
            )}

            {allWorkouts.length > 0 && (
              <SelectedSection>
                <SelectedTitle>
                  {selectedDate} · {t("calendarWorkoutRecords")}
                </SelectedTitle>

                {selectedWorkouts.length === 0 ? (
                  <StatusMessage>{t("calendarNoWorkoutsOnDate")}</StatusMessage>
                ) : (
                  <WorkoutList>
                    {selectedWorkouts.map((workout) => (
                      <WorkoutCard
                        key={workout.id}
                        to={`/workouts/${workout.id}`}
                      >
                        <WorkoutHeader>
                          <WorkoutName>{workout.routineName}</WorkoutName>

                          <WorkoutStatusBadge $status={workout.status}>
                            {workout.status === "in_progress"
                              ? t("calendarWorkoutInProgress")
                              : t("calendarWorkoutCompleted")}
                          </WorkoutStatusBadge>
                        </WorkoutHeader>

                        <WorkoutInfo>
                          {t("calendarWorkoutDayLabel")}:{" "}
                          {workout.routineDayName}
                        </WorkoutInfo>

                        <WorkoutInfo>
                          {t("calendarExerciseCountLabel")}:{" "}
                          {workout.exercises.length}
                        </WorkoutInfo>

                        {workout.notes && (
                          <WorkoutInfo>
                            {t("calendarNotesLabel")}: {workout.notes}
                          </WorkoutInfo>
                        )}
                      </WorkoutCard>
                    ))}
                  </WorkoutList>
                )}
              </SelectedSection>
            )}
          </>
        )}
      </Container>
    </Page>
  );
}

export default WorkoutCalendarPage;
