import { useLocalSearchParams } from "expo-router";
import { ReservationOperationScreen } from "@/screens/ReservationOperationScreen";

export default function ReservationOperationRoute() {
  const params = useLocalSearchParams<{ id: string; mode?: string }>();

  return <ReservationOperationScreen reservationId={params.id} mode={params.mode} />;
}
