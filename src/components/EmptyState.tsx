import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { StyleSheet, Text, View } from "react-native";

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={24} color={colors.primaryDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  title: {
    fontSize: typography.cardTitle,
    fontWeight: "800",
    color: colors.text,
  },
  description: {
    fontSize: typography.body,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: "center",
  },
});
