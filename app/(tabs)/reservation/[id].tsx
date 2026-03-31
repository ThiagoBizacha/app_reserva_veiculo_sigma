import { useLocalSearchParams } from "expo-router";
import { ReservationDetailScreen } from "@/screens/ReservationDetailScreen";

export default function ReservationDetailTabRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  return <ReservationDetailScreen reservationId={params.id} />;
}
