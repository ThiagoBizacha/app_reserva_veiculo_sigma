import { useLocalSearchParams } from "expo-router";
import { AgendaScreen } from "@/screens/AgendaScreen";

export default function AgendaRoute() {
  const params = useLocalSearchParams<{ resourceId?: string }>();
  return <AgendaScreen initialResourceId={params.resourceId} />;
}
