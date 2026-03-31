import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "@/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: "#799287",
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
            home: "home",
            agenda: "calendar",
            reservations: "bookmark",
            resources: "truck",
            settings: "settings",
            "check-flow": "check-square",
            admin: "settings",
          };

          return <Feather name={iconMap[route.name] ?? "circle"} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="agenda" options={{ title: "Agenda" }} />
      <Tabs.Screen name="reservations" options={{ title: "Reservas" }} />
      <Tabs.Screen name="reservation" options={{ href: null }} />
      <Tabs.Screen name="resources" options={{ title: "Frota" }} />
      <Tabs.Screen name="settings" options={{ title: "Config." }} />
      <Tabs.Screen name="check-flow" options={{ href: null }} />
      <Tabs.Screen name="admin" options={{ href: null }} />
    </Tabs>
  );
}
