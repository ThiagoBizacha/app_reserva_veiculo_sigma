import { colors, radius, spacing, typography } from "@/theme";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

interface FormFieldProps extends TextInputProps {
  label: string;
  helper?: string;
  error?: string;
}

export function FormField({ label, helper, error, multiline, style, ...rest }: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline, style]}
        {...rest}
      />
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
    color: colors.text,
    fontSize: typography.body,
  },
  multiline: {
    minHeight: 110,
    paddingTop: spacing.md,
    textAlignVertical: "top",
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
