import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";

export default function SplashRoute() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)/home");
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={[colors.primaryDark, "#167858"]} style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>S</Text>
      </View>
      <Text style={styles.title}>Sigma Reserva</Text>
      <Text style={styles.subtitle}>Gestão corporativa de recursos compartilhados</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  logo: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  logoText: {
    color: colors.white,
    fontSize: 40,
    fontWeight: "800",
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: "#E3F7EE",
    fontSize: typography.body,
  },
});
