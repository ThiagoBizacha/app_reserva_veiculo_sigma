import { getReservationStatusLabel, getResourceStatusLabel } from "@/utils/reservations";
import { radius, spacing, statusColors, typography } from "@/theme";
import type { ReservationStatus, ResourceStatus } from "@/types";
import { StyleSheet, Text, View } from "react-native";

interface StatusBadgeProps {
  status: ReservationStatus | ResourceStatus;
  kind: "reservation" | "resource";
}

export function StatusBadge({ status, kind }: StatusBadgeProps) {
  const palette =
    kind === "resource"
      ? statusColors.resource[status as ResourceStatus]
      : statusColors.reservation[status as ReservationStatus];
  const label =
    kind === "resource"
      ? getResourceStatusLabel(status as ResourceStatus)
      : getReservationStatusLabel(status as ReservationStatus);

  return (
    <View style={[styles.badge, { backgroundColor: `${palette}18` }]}>
      <View style={[styles.dot, { backgroundColor: palette }]} />
      <Text style={[styles.label, { color: palette }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "700",
  },
});
