import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { getRoutineById, updateRoutine } from "../api/routines";
import { ApiRequestError } from "../api/translatedRequest";
import RoutineForm from "../components/routines/RoutineForm";
import { useTranslation } from "../hooks/useTranslation";
import type { TranslationKey } from "../i18n/translations";
import {
  formDataToUpdateRequest,
  routineToFormData,
} from "../types/routineForm";
import type { Routine } from "../types/routine";
import type { RoutineFormData } from "../types/routineForm";
import { showSuccessToast } from "../utils/successToast";
import { usePageLoading } from "../hooks/usePageLoading";

const Page = styled.main`
  min-height: 100dvh;
  padding: var(--section-gap) var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
`;

const Container = styled.div`
  width: 100%;
  min-width: 0;
  max-width: var(--app-max-width);
  margin: 0 auto;
`;

const ErrorMessage = styled.p`
  padding: var(--card-padding);
  color: var(--color-error);
  background: var(--color-surface);
  border: 1px solid rgb(255 133 133 / 25%);
  border-radius: var(--radius-card);
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

type RoutineError =
  | ""
  | { translationKey: TranslationKey }
  | { message: string };

function EditRoutinePage() {
  const { t } = useTranslation();
  const { routineId } = useParams();
  const navigate = useNavigate();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<RoutineError>("");

  usePageLoading(isLoading);

  useEffect(() => {
    let isMounted = true;

    async function loadRoutine(): Promise<void> {
      setIsLoading(true);
      setErrorMessage("");
      setRoutine(null);

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
            translationKey: "routineLoadFailed",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRoutine();

    return () => {
      isMounted = false;
    };
  }, [routineId]);

  async function handleUpdate(routineData: RoutineFormData): Promise<void> {
    if (!routineId) {
      throw new ApiRequestError("routineIdRequired");
    }

    const updateRequest = formDataToUpdateRequest(routineData);

    await updateRoutine(routineId, updateRequest);
    showSuccessToast();

    navigate(`/routines/${routineId}`, {
      replace: true,
    });
  }

  function renderError(error: RoutineError): string {
    if (error === "") {
      return "";
    }

    if ("translationKey" in error) {
      return t(error.translationKey);
    }

    return error.message;
  }

  if (isLoading) {
    return (
      <Page>
        <Container />
      </Page>
    );
  }

  if (errorMessage || !routine) {
    return (
      <Page>
        <Container>
          <ErrorMessage role="alert">
            {renderError(errorMessage) || t("apiResourceNotFound")}
          </ErrorMessage>
        </Container>
      </Page>
    );
  }

  return (
    <RoutineForm
      initialData={routineToFormData(routine)}
      title={t("routineEdit")}
      description={t("routineEditDescription")}
      backTo={`/routines/${routine.id}`}
      backLabel={t("routineEditBack")}
      submitLabel={t("routineEditSave")}
      onSubmit={handleUpdate}
    />
  );
}

export default EditRoutinePage;
