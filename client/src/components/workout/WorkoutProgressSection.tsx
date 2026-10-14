import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import ExerciseProgressChart from "./ExerciseProgressChart";
import type { Workout } from "../../types/workout";
import { getExerciseProgressList } from "../../utils/workoutProgress";
import { useTranslation } from "../../hooks/useTranslation";
const Section = styled.section`
  min-width: 0;
  margin-bottom: var(--section-gap);
  padding: var(--card-padding);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;
const Title = styled.h2`
  margin-bottom: 8px;
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
const Description = styled.p`
  margin-bottom: 20px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.7;
  overflow-wrap: anywhere;
`;
const SelectLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
`;
const ExerciseSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 11px 12px;
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
`;
const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 20px;
`;
const SummaryCard = styled.article`
  min-width: 0;
  padding: 12px;
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: 10px;
`;
const SummaryLabel = styled.p`
  margin-bottom: 8px;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const SummaryValue = styled.p`
  color: var(--color-text);
  font-size: clamp(18px, 5vw, 22px);
  font-weight: 700;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
`;
const RecordTitle = styled.h3`
  margin-top: var(--section-gap);
  margin-bottom: 12px;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;
const RecordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const RecordCard = styled(Link)`
  display: block;
  min-width: 0;
  padding: 14px;
  color: var(--color-text);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  &:hover {
    border-color: var(--color-primary);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }
`;
const RecordHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
`;
const RecordIdentity = styled.div`
  display: flex;
  flex: 1 1 140px;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;
const RecordRoutineName = styled.strong`
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;
const RecordDayName = styled.span`
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const RecordDate = styled.time`
  margin-top: 2px;
  color: var(--color-text-muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const RecordMetric = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  color: var(--color-primary);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.6;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
`;
const RecordInfo = styled.p`
  min-width: 0;
  padding: 10px;
  background: var(--color-surface);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const Notice = styled.p`
  margin-top: 16px;
  padding: 12px;
  color: var(--color-text-muted);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;
`;
const EmptyMessage = styled.p`
  padding: 20px 12px;
  color: var(--color-text-muted);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: var(--font-caption);
  line-height: 1.7;
  text-align: center;
  overflow-wrap: anywhere;
`;
const InfoLabel = styled.span`
  display: block;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const InfoValue = styled.strong`
  display: block;
  margin-top: 4px;
  color: var(--color-text);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
`;
const RecordMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
  > p:last-child:nth-child(3) {
    grid-column: 1 / -1;
  }
`;
interface WorkoutProgressSectionProps {
    workouts: Workout[];
}
function WorkoutProgressSection({ workouts }: WorkoutProgressSectionProps) {
    const { t, language } = useTranslation();
    const locale = {
        ko: "ko-KR",
        ja: "ja-JP",
        en: "en-US",
    }[language];
    const [selectedExerciseKey, setSelectedExerciseKey] = useState("");
    const workoutTitles = useMemo(
        () =>
            new Map(
                workouts.map((workout) => [
                    workout.id,
                    {
                        routineName: workout.routineName,
                        routineDayName: workout.routineDayName,
                    },
                ]),
            ),
        [workouts],
    );
    const exerciseProgressList = useMemo(
        () => getExerciseProgressList(workouts),
        [workouts],
    );
    const selectedExercise =
        exerciseProgressList.find(
            (exercise) => exercise.key === selectedExerciseKey,
        ) ??
        exerciseProgressList[0] ??
        null;
    function formatWeight(weightKg: number | null): string {
        if (weightKg === null) {
            return t("progressWeightMissing");
        }
        return `${weightKg.toLocaleString(locale, {
            maximumFractionDigits: 1,
        })} kg`;
    }
    function formatWeightChange(weightChangeKg: number | null): string {
        if (weightChangeKg === null) {
            return t("progressNotComparable");
        }
        const formattedWeight = Math.abs(weightChangeKg).toLocaleString(locale, {
            maximumFractionDigits: 1,
        });
        if (weightChangeKg > 0) {
            return `+${formattedWeight} kg`;
        }
        if (weightChangeKg < 0) {
            return `-${formattedWeight} kg`;
        }
        return t("progressNoChange");
    }
    function formatReps(reps: number): string {
        return `${reps.toLocaleString(locale)} ${t("progressRepsUnit")}`;
    }
    function formatRepsChange(repsChange: number): string {
        const formattedReps = Math.abs(repsChange).toLocaleString(locale);
        if (repsChange > 0) {
            return `+${formattedReps} ${t("progressRepsUnit")}`;
        }
        if (repsChange < 0) {
            return `-${formattedReps} ${t("progressRepsUnit")}`;
        }
        return t("progressNoChange");
    }
    if (exerciseProgressList.length === 0) {
        return (
            <Section>
                <Title>{t("progressTitle")}</Title>
                <Description>{t("progressEmptyDescription")}</Description>
                <EmptyMessage>{t("progressEmptyMessage")}</EmptyMessage>
            </Section>
        );
    }
    if (!selectedExercise) {
        return null;
    }
    const weightRecordCount = selectedExercise.records.filter(
        (record) => record.maxWeightKg !== null,
    ).length;
    const showsWeightProgress = weightRecordCount >= 2;
    return (
        <Section>
            <Title>{t("progressTitle")}</Title>
            <Description>{t("progressDescription")}</Description>
            <SelectLabel htmlFor="progress-exercise">
                {t("progressExerciseLabel")}
            </SelectLabel>
            <ExerciseSelect
                id="progress-exercise"
                value={selectedExercise.key}
                onChange={(event) => {
                    setSelectedExerciseKey(event.target.value);
                }}
            >
                {exerciseProgressList.map((exercise) => (
                    <option key={exercise.key} value={exercise.key}>
                        {exercise.name}
                    </option>
                ))}
            </ExerciseSelect>
            <SummaryGrid>
                <SummaryCard>
                    <SummaryLabel>
                        {showsWeightProgress
                            ? t("progressFirstWeight")
                            : t("progressFirstReps")}
                    </SummaryLabel>
                    <SummaryValue>
                        {showsWeightProgress
                            ? formatWeight(selectedExercise.firstWeightKg)
                            : formatReps(selectedExercise.firstTotalReps)}
                    </SummaryValue>
                </SummaryCard>
                <SummaryCard>
                    <SummaryLabel>
                        {showsWeightProgress
                            ? t("progressLatestWeight")
                            : t("progressLatestReps")}
                    </SummaryLabel>
                    <SummaryValue>
                        {showsWeightProgress
                            ? formatWeight(selectedExercise.latestWeightKg)
                            : formatReps(selectedExercise.latestTotalReps)}
                    </SummaryValue>
                </SummaryCard>
                <SummaryCard>
                    <SummaryLabel>
                        {showsWeightProgress
                            ? t("progressBestWeight")
                            : t("progressBestReps")}
                    </SummaryLabel>
                    <SummaryValue>
                        {showsWeightProgress
                            ? formatWeight(selectedExercise.bestWeightKg)
                            : formatReps(selectedExercise.bestTotalReps)}
                    </SummaryValue>
                </SummaryCard>
                <SummaryCard>
                    <SummaryLabel>{t("progressChangeFromFirst")}</SummaryLabel>
                    <SummaryValue>
                        {showsWeightProgress
                            ? formatWeightChange(selectedExercise.weightChangeKg)
                            : formatRepsChange(selectedExercise.totalRepsChange)}
                    </SummaryValue>
                </SummaryCard>
            </SummaryGrid>
            <ExerciseProgressChart
                records={selectedExercise.records}
                mode={showsWeightProgress ? "weight" : "reps"}
            />
            <RecordTitle>{t("progressRecentRecords")}</RecordTitle>
            <RecordList>
                {selectedExercise.records.slice(0, 10).map((record, index) => (
                    <RecordCard
                        key={`${record.workoutId}-${index}`}
                        to={`/workouts/${record.workoutId}`}
                    >
                        <RecordHeader>
                            <RecordIdentity>
                                <RecordRoutineName>
                                    {workoutTitles.get(record.workoutId)?.routineName ||
                                        t("calendarRoutineLabel")}
                                </RecordRoutineName>
                                <RecordDayName>
                                    {workoutTitles.get(record.workoutId)?.routineDayName ||
                                        t("calendarWorkoutDayLabel")}
                                </RecordDayName>
                                <RecordDate dateTime={record.workoutDate}>
                                    {record.workoutDate}
                                </RecordDate>
                            </RecordIdentity>
                            <RecordMetric>
                                <InfoLabel>
                                    {showsWeightProgress
                                        ? t("progressBestWeight")
                                        : t("progressTotalReps")}
                                </InfoLabel>
                                {showsWeightProgress
                                    ? formatWeight(record.maxWeightKg)
                                    : formatReps(record.totalReps)}
                            </RecordMetric>
                        </RecordHeader>
                        <RecordMetrics>
                            <RecordInfo>
                                <InfoLabel>{t("historyCompletedSets")}</InfoLabel>
                                <InfoValue>{record.completedSetCount}</InfoValue>
                            </RecordInfo>
                            <RecordInfo>
                                <InfoLabel>{t("progressTotalReps")}</InfoLabel>
                                <InfoValue>{formatReps(record.totalReps)}</InfoValue>
                            </RecordInfo>
                            {showsWeightProgress && (
                                <RecordInfo>
                                    <InfoLabel>{t("progressVolume")}</InfoLabel>
                                    <InfoValue>
                                        {record.volumeKg.toLocaleString(locale, {
                                            maximumFractionDigits: 1,
                                        })}{" "}
                                        kg
                                    </InfoValue>
                                </RecordInfo>
                            )}
                        </RecordMetrics>
                    </RecordCard>
                ))}
            </RecordList>
            <Notice>
                {showsWeightProgress
                    ? t("progressWeightNotice")
                    : t("progressRepsNotice")}
            </Notice>
        </Section>
    );
}
export default WorkoutProgressSection;
