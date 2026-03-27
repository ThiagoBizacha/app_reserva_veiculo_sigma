import { colors, radius, spacing, statusColors, typography } from "@/theme";
import type { CalendarDayState } from "@/utils/reservations";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface CalendarDayCellProps {
  dayNumber: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  state: CalendarDayState;
  onPress: () => void;
}

export function CalendarDayCell({
  dayNumber,
  isCurrentMonth,
  isSelected,
  isToday,
  state,
  onPress,
}: CalendarDayCellProps) {
  const palette = statusColors.calendar[state];
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.cell,
        { backgroundColor: isSelected ? colors.primaryDark : colors.surface },
        !isCurrentMonth && styles.cellOutside,
      ]}
    >
      <Text style={[styles.dayNumber, isSelected && styles.daySelected, !isCurrentMonth && styles.outsideText]}>
        {dayNumber}
      </Text>
      <View style={[styles.dot, { backgroundColor: isSelected ? colors.white : palette }]} />
      {isToday ? <View style={styles.todayRing} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: "13.5%",
    aspectRatio: 0.78,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
    gap: spacing.xxs,
  },
  cellOutside: {
    opacity: 0.45,
  },
  dayNumber: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  outsideText: {
    color: colors.textMuted,
  },
  daySelected: {
    color: colors.white,
  },
  dot: {
    width: 18,
    height: 4,
    borderRadius: radius.pill,
  },
  todayRing: {
    position: "absolute",
    inset: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
