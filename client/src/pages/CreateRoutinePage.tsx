import { useNavigate } from "react-router-dom";
import { createRoutine } from "../api/routines";
import RoutineForm from "../components/routines/RoutineForm";
import { useTranslation } from "../hooks/useTranslation";
import { formDataToCreateRequest } from "../types/routineForm";
import type { RoutineFormData } from "../types/routineForm";
import { showSuccessToast } from "../utils/successToast";

const initialRoutineData: RoutineFormData = {
  name: "",
  goal: "muscle_gain",
  experienceLevel: "beginner",
  weeklyFrequency: 3,
  sessionDurationMinutes: 60,
  location: "gym",
  days: [],
};

function CreateRoutinePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  async function handleCreate(routineData: RoutineFormData): Promise<void> {
    const createRequest = formDataToCreateRequest(routineData);

    await createRoutine(createRequest);
    showSuccessToast();

    navigate("/routines", {
      replace: true,
    });
  }

  return (
    <RoutineForm
      initialData={initialRoutineData}
      title={t("dashboardCreateRoutine")}
      description={t("routineCreateDescription")}
      backTo="/routines"
      backLabel={t("calendarBackToDashboard")}
      submitLabel={t("routineSave")}
      onSubmit={handleCreate}
    />
  );
}

export default CreateRoutinePage;
