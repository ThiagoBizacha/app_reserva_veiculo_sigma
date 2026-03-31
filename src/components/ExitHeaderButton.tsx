import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

interface ExitHeaderButtonProps {
  variant?: "light" | "dark";
  compact?: boolean;
}

export function ExitHeaderButton({
  variant = "dark",
  compact = false,
}: ExitHeaderButtonProps) {
  const isLight = variant === "light";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.replace("/")}
      style={[
        styles.button,
        compact && styles.compactButton,
        {
          backgroundColor: isLight ? "rgba(255,255,255,0.10)" : colors.surface,
          borderColor: isLight ? "rgba(255,255,255,0.22)" : colors.border,
        },
      ]}
    >
      <Feather name="log-out" size={16} color={isLight ? colors.white : colors.primaryDark} />
      <Text style={[styles.label, { color: isLight ? colors.white : colors.primaryDark }]}>Sair</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  compactButton: {
    paddingHorizontal: 10,
  },
  label: {
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
});
