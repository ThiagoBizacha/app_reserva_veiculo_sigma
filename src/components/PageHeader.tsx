import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  leftAction?: ReactNode;
  rightContent?: ReactNode;
}

export function PageHeader({
  title,
  eyebrow,
  leftAction,
  rightContent,
}: PageHeaderProps) {
  return (
    <LinearGradient colors={[colors.primaryDark, colors.green700]} style={styles.container}>
      <View style={styles.row}>
        <View style={styles.sideSlot}>{leftAction}</View>

        <View style={styles.copy}>
          {eyebrow ? (
            <Text numberOfLines={1} style={styles.eyebrow}>
              {eyebrow}
            </Text>
          ) : null}
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
        </View>

        <View style={styles.sideSlot}>{rightContent}</View>
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
    minHeight: 112,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sideSlot: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
  },
  eyebrow: {
    color: "#DDEED6",
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  title: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: "800",
    lineHeight: 30,
    textAlign: "center",
  },
});
