import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface QuickActionCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}

export function QuickActionCard({ icon, title, description, onPress }: QuickActionCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={18} color={colors.primaryDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
