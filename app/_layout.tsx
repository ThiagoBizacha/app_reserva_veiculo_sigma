import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReservationStoreProvider } from "@/hooks/useReservationStore";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <ReservationStoreProvider>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </ReservationStoreProvider>
  );
}
