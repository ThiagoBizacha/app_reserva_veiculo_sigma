import { colors, radius, spacing, typography } from "@/theme";
import { Pressable, StyleSheet, Text } from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, disabled }: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    backgroundColor: "#9AB6AC",
  },
  label: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "800",
  },
});
