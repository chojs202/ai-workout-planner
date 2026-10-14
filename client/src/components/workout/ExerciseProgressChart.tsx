import styled from "styled-components";
import type { ExerciseProgressRecord } from "../../utils/workoutProgress";
import { useTranslation } from "../../hooks/useTranslation";

const ChartSection = styled.section`
  min-width: 0;
  margin-top: var(--section-gap);
`;

const ChartTitle = styled.h3`
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: clamp(17px, 4.5vw, 19px);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;

const ChartDescription = styled.p`
  margin-bottom: 16px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const ChartList = styled.ul`
  display: grid;
  gap: 12px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ChartRow = styled.li`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 10px 12px;
  min-width: 0;
  padding: 12px;
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
`;

const ChartDate = styled.time`
  min-width: 0;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const BarTrack = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  height: 12px;
  overflow: hidden;
  background: var(--color-border);
  border-radius: 999px;
`;

const Bar = styled.div<{
    $widthPercentage: number;
}>`
  width: ${({ $widthPercentage }) => `${$widthPercentage}%`};
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-primary),
    var(--color-primary-hover)
  );
  border-radius: 999px;
`;

const ChartValue = styled.strong`
  min-width: 0;
  color: var(--color-primary);
  font-size: var(--font-body);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
  text-align: right;
  overflow-wrap: anywhere;
`;

const EmptyMessage = styled.p`
  padding: var(--card-padding);
  color: var(--color-text-muted);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: var(--font-caption);
  line-height: 1.6;
  text-align: center;
  overflow-wrap: anywhere;
`;

interface ExerciseProgressChartProps {
    records: ExerciseProgressRecord[];
    mode: "weight" | "reps";
}

function ExerciseProgressChart({ records, mode }: ExerciseProgressChartProps) {
    const { t, language } = useTranslation();

    const locale = {
        ko: "ko-KR",
        ja: "ja-JP",
        en: "en-US",
    }[language];

    const chartRecords = (
        mode === "weight"
            ? records.filter((record) => record.maxWeightKg !== null)
            : records
    )
        .slice(0, 10)
        .reverse();

    const chartTitle =
        mode === "weight"
            ? t("progressChartWeightTitle")
            : t("progressChartRepsTitle");

    if (chartRecords.length < 2) {
        return (
            <ChartSection>
                <ChartTitle>{chartTitle}</ChartTitle>

                <EmptyMessage>
                    {mode === "weight"
                        ? t("progressChartWeightEmpty")
                        : t("progressChartRepsEmpty")}
                </EmptyMessage>
            </ChartSection>
        );
    }

    const highestValue = Math.max(
        ...chartRecords.map((record) =>
            mode === "weight" ? (record.maxWeightKg ?? 0) : record.totalReps,
        ),
    );

    return (
        <ChartSection>
            <ChartTitle>{chartTitle}</ChartTitle>

            <ChartDescription>
                {mode === "weight"
                    ? t("progressChartWeightDescription")
                    : t("progressChartRepsDescription")}
            </ChartDescription>

            <ChartList>
                {chartRecords.map((record) => {
                    const value =
                        mode === "weight" ? (record.maxWeightKg ?? 0) : record.totalReps;

                    const widthPercentage =
                        highestValue > 0 ? Math.max((value / highestValue) * 100, 4) : 4;

                    return (
                        <ChartRow key={record.workoutId}>
                            <ChartDate dateTime={record.workoutDate}>
                                {record.workoutDate}
                            </ChartDate>

                            <ChartValue>
                                {value.toLocaleString(locale, {
                                    maximumFractionDigits: mode === "weight" ? 1 : 0,
                                })}{" "}
                                {mode === "weight" ? "kg" : t("progressRepsUnit")}
                            </ChartValue>

                            <BarTrack aria-hidden="true">
                                <Bar $widthPercentage={widthPercentage} />
                            </BarTrack>
                        </ChartRow>
                    );
                })}
            </ChartList>
        </ChartSection>
    );
}

export default ExerciseProgressChart;
