import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, spacing, typography } from "@/theme";
import type { Reservation, Resource } from "@/types";
import { formatDateTime } from "@/utils/date";
import { StyleSheet, Text, View } from "react-native";

interface ReservationCardProps {
  reservation: Reservation;
  resource?: Resource;
}

export function ReservationCard({ reservation, resource }: ReservationCardProps) {
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{reservation.title}</Text>
          <Text style={styles.code}>{reservation.code}</Text>
        </View>
        <StatusBadge status={reservation.status} kind="reservation" />
      </View>
      <View style={styles.block}>
        <Text style={styles.label}>Recurso</Text>
        <Text style={styles.value}>{resource?.name ?? "Recurso não encontrado"}</Text>
      </View>
      <View style={styles.block}>
        <Text style={styles.label}>Período</Text>
        <Text style={styles.value}>
          {formatDateTime(reservation.startDate)} até {formatDateTime(reservation.endDate)}
        </Text>
      </View>
      <View style={styles.block}>
        <Text style={styles.label}>Base</Text>
        <Text style={styles.value}>{reservation.base}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: "800",
  },
  code: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  block: {
    marginTop: spacing.md,
    gap: spacing.xxs,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  value: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
