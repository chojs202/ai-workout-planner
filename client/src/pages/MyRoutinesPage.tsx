import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { getRoutines } from "../api/routines";
import { useAuth } from "../contexts/AuthContext";
import type { Routine, RoutineGoal } from "../types/routine";
import { useTranslation } from "../hooks/useTranslation";
import type { TranslationKey } from "../i18n/translations";
import { ApiRequestError } from "../api/translatedRequest";
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
const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 20px;
  > div {
    min-width: 0;
    width: 100%;
  }
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
const HeaderActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;
const ActionLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 12px;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: var(--font-caption);
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  overflow-wrap: anywhere;
  &:hover {
    background: var(--color-input);
    border-color: var(--color-primary);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;
const NewRoutineLink = styled(ActionLink)`
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
  &:hover {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }
`;
const AiRoutineLink = styled(ActionLink)`
  color: var(--color-primary);
`;
const RoutineSection = styled.section`
  margin-top: var(--section-gap);
`;
const RoutineGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
`;
const RoutineCard = styled(Link)`
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
const RoutineName = styled.h3`
  margin-bottom: 12px;
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
`;
const RoutineMetaGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
`;
const RoutineMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 5px;
  padding: 12px;
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: 10px;
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
  margin-top: 16px;
  padding: var(--card-padding);
  color: var(--color-error);
  background: var(--color-surface);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-card);
  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const routineGoalKeys: Record<RoutineGoal, TranslationKey> = {
  muscle_gain: "routineGoalMuscleGain",
  strength: "routineGoalStrength",
  weight_loss: "routineGoalWeightLoss",
  general_fitness: "routineGoalGeneralFitness",
};
function MyRoutinesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(true);
  const [routineErrorMessage, setRoutineErrorMessage] = useState<
    TranslationKey | ""
  >("");
  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setRoutines([]);
      setIsLoadingRoutines(false);
      return () => {
        isMounted = false;
      };
    }
    async function loadRoutines(): Promise<void> {
      setIsLoadingRoutines(true);
      setRoutineErrorMessage("");
      try {
        const result = await getRoutines();
        if (isMounted) {
          setRoutines(result.routines);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setRoutineErrorMessage(
          error instanceof ApiRequestError
            ? error.translationKey
            : "routineListFailed",
        );
      } finally {
        if (isMounted) {
          setIsLoadingRoutines(false);
        }
      }
    }
    void loadRoutines();
    return () => {
      isMounted = false;
    };
  }, [user]);
  if (!user) {
    return null;
  }
  return (
    <Page>
      <Container>
        <Header>
          <div>
            <Title>{t("dashboardMyRoutines")}</Title>
          </div>
          <HeaderActions>
            <NewRoutineLink to="/routines/new">
              {t("dashboardCreateRoutine")}
            </NewRoutineLink>
            <AiRoutineLink to="/routines/ai">
              {t("dashboardAiRoutine")}
            </AiRoutineLink>
          </HeaderActions>
        </Header>
        <RoutineSection>
          {!isLoadingRoutines && routineErrorMessage && (
            <ErrorMessage role="alert">{t(routineErrorMessage)}</ErrorMessage>
          )}
          {!isLoadingRoutines &&
            !routineErrorMessage &&
            routines.length === 0 && (
              <StatusMessage>{t("dashboardNoRoutines")}</StatusMessage>
            )}
          {!isLoadingRoutines &&
            !routineErrorMessage &&
            routines.length > 0 && (
              <RoutineGrid>
                {routines.map((routine) => (
                  <RoutineCard key={routine.id} to={`/routines/${routine.id}`}>
                    <RoutineName>{routine.name}</RoutineName>
                    <RoutineMetaGrid>
                      <RoutineMeta>
                        <MetaLabel>{t("dashboardGoal")}</MetaLabel>
                        <MetaValue>
                          {t(routineGoalKeys[routine.goal])}
                        </MetaValue>
                      </RoutineMeta>
                      <RoutineMeta>
                        <MetaLabel>{t("dashboardWeeklyFrequency")}</MetaLabel>
                        <MetaValue>
                          {t("routineWeeklyFrequencyValue").replace(
                            "{count}",
                            String(routine.weeklyFrequency),
                          )}
                        </MetaValue>
                      </RoutineMeta>
                      <RoutineMeta>
                        <MetaLabel>{t("dashboardEstimatedDuration")}</MetaLabel>
                        <MetaValue>
                          {routine.sessionDurationMinutes}{" "}
                          {t("dashboardMinuteUnit")}
                        </MetaValue>
                      </RoutineMeta>
                      <RoutineMeta>
                        <MetaLabel>{t("dashboardTrainingDays")}</MetaLabel>
                        <MetaValue>{routine.days.length}</MetaValue>
                      </RoutineMeta>
                    </RoutineMetaGrid>
                  </RoutineCard>
                ))}
              </RoutineGrid>
            )}
        </RoutineSection>
      </Container>
    </Page>
  );
}
export default MyRoutinesPage;
