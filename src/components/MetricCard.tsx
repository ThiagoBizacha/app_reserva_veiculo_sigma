import { colors, radius, shadows, spacing, typography } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

interface MetricCardProps {
  label: string;
  value: string | number;
  helper: string;
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <LinearGradient colors={["#F7FCF9", "#FFFFFF"]} style={styles.gradient}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.helper}>{helper}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    minWidth: "47%",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  value: {
    color: colors.primaryDark,
    fontSize: 30,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  helper: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
});
