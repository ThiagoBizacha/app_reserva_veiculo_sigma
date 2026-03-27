import { useLocalSearchParams } from "expo-router";
import { ReservationDetailScreen } from "@/screens/ReservationDetailScreen";

export default function ReservationDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  return <ReservationDetailScreen reservationId={params.id} />;
}
