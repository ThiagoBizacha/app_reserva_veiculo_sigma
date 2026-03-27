import { useLocalSearchParams } from "expo-router";
import { ResourceDetailScreen } from "@/screens/ResourceDetailScreen";

export default function ResourceDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  return <ResourceDetailScreen resourceId={params.id} />;
}
