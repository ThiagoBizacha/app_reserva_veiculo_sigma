import { useLocalSearchParams } from "expo-router";
import { NewReservationScreen } from "@/screens/NewReservationScreen";

export default function NewReservationRoute() {
  const params = useLocalSearchParams<{ resourceId?: string; date?: string }>();
  return <NewReservationScreen initialResourceId={params.resourceId} initialDate={params.date} />;
}
