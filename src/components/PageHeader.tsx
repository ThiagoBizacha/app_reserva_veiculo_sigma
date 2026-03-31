import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  leftAction?: ReactNode;
  rightContent?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  leftAction,
  rightContent,
}: PageHeaderProps) {
  return (
    <LinearGradient colors={[colors.primaryDark, colors.green700]} style={styles.container}>
      <View style={styles.row}>
        {leftAction ? <View style={styles.leading}>{leftAction}</View> : null}

        <View style={styles.copy}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? (
            <Text numberOfLines={2} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightContent ? <View style={styles.trailing}>{rightContent}</View> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  leading: {
    paddingTop: 2,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  eyebrow: {
    color: "#DDEED6",
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: "800",
  },
  subtitle: {
    color: "#E3F7EE",
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: 2,
  },
});
