import { Feather } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { useAuthSession } from "@/hooks/useAuthSession";
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
  const { isSubmitting, signOut } = useAuthSession();

  const handleSignOut = async () => {
    const result = await signOut();

    if (!result.success && result.message) {
      Alert.alert("Falha ao encerrar sessao", result.message);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isSubmitting}
      onPress={() => void handleSignOut()}
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
