import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface FieldSelectProps {
  label: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
  helper?: string;
  error?: string;
}

export function FieldSelect({
  label,
  value,
  placeholder = "Selecionar",
  onPress,
  helper,
  error,
}: FieldSelectProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={onPress}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value || placeholder}</Text>
        <Feather name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: {
    color: colors.text,
    fontSize: typography.body,
  },
  placeholder: {
    color: colors.textMuted,
  },
  helper: {
    color: colors.textMuted,
    fontSize: typography.tiny,
  },
  error: {
    color: colors.danger,
    fontSize: typography.tiny,
  },
});
