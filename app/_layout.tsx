import { Stack, usePathname, useRootNavigationState, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { AuthSessionProvider, useAuthSession } from "@/hooks/useAuthSession";
import { ReservationStoreProvider } from "@/hooks/useReservationStore";
import { colors, radius, spacing, typography } from "@/theme";

function AuthNavigationGate() {
  const { isAuthenticated, isReady } = useAuthSession();
  const pathname = usePathname();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!isReady || !rootNavigationState?.key) {
      return;
    }

    const isOnLoginRoute = pathname === "/";

    if (!isAuthenticated && !isOnLoginRoute) {
      router.replace("/");
      return;
    }

    if (isAuthenticated && isOnLoginRoute) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, isReady, pathname, rootNavigationState?.key, router]);

  return null;
}

function AuthBootstrapScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bootstrapShell}>
        <View style={styles.bootstrapCard}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
          <Text style={styles.bootstrapTitle}>Restaurando sessao</Text>
          <Text style={styles.bootstrapDescription}>
            Validando a sessao persistida do Supabase antes de liberar o app.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function RootNavigation() {
  const { isReady } = useAuthSession();

  if (!isReady) {
    return <AuthBootstrapScreen />;
  }

  return (
    <>
      <AuthNavigationGate />
      <StatusBar style="dark" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <ReservationStoreProvider>
        <RootNavigation />
      </ReservationStoreProvider>
    </AuthSessionProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bootstrapShell: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  bootstrapCard: {
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  bootstrapTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "700",
  },
  bootstrapDescription: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
});
