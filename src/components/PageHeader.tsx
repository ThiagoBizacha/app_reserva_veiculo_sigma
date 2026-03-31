import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReservationStore } from "@/hooks/useReservationStore";
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
  const { currentUserName } = useReservationStore();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.primaryDark, colors.green700]}
      style={[styles.container, { paddingTop: insets.top + spacing.sm }]}
    >
      {eyebrow ? (
        <Text numberOfLines={1} style={styles.eyebrow}>{eyebrow}</Text>
      ) : null}
      <View style={styles.row}>
        {leftAction ? <View style={styles.leftSlot}>{leftAction}</View> : null}
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
          {title}
        </Text>
        <View style={styles.rightSlot}>
          {rightContent ?? (
            <View style={styles.userBlock}>
              <Text style={styles.userName} numberOfLines={1}>{currentUserName}</Text>
              <View style={styles.divider} />
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace("/")}
                style={styles.exitButton}
              >
                <Feather name="log-out" size={12} color={colors.white} />
                <Text style={styles.exitLabel}>Sair</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  leftSlot: {
    minWidth: 40,
  },
  userBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userName: {
    color: "rgba(255,255,255,0.80)",
    fontSize: typography.tiny,
    fontWeight: "600",
    maxWidth: 130,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  exitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  exitLabel: {
    color: colors.white,
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.65)",
    fontSize: typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    flex: 1,
    color: colors.white,
    fontSize: typography.title,
    fontWeight: "800",
    lineHeight: 30,
  },
  rightSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
});
