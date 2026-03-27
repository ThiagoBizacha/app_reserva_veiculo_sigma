import { StyleSheet, Text, View } from "react-native";
import { Card, Header, ScreenContainer, SecondaryButton, StatusBadge } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, spacing, typography } from "@/theme";
import { formatDateTime } from "@/utils/date";

interface ReservationDetailScreenProps {
  reservationId: string;
}

export function ReservationDetailScreen({ reservationId }: ReservationDetailScreenProps) {
  const { reservations, resources } = useReservationStore();
  const reservation = reservations.find((item) => item.id === reservationId);

  if (!reservation) {
    return (
      <ScreenContainer>
        <Text>Reserva não encontrada.</Text>
      </ScreenContainer>
    );
  }

  const resource = resources.find((item) => item.id === reservation.resourceId);

  return (
    <ScreenContainer
      header={
        <Header eyebrow={reservation.code} title="Detalhe da reserva" subtitle="Resumo completo do ciclo operacional e histórico básico do item." />
      }
    >
      <Card>
        <StatusBadge status={reservation.status} kind="reservation" />
        <Info label="Recurso" value={resource?.name ?? "Recurso não encontrado"} />
        <Info label="Período" value={`${formatDateTime(reservation.startDate)} até ${formatDateTime(reservation.endDate)}`} />
        <Info label="Finalidade" value={reservation.purpose} />
        <Info label="Base" value={reservation.base} />
        <Info label="Observações" value={reservation.notes || "Sem observações registradas."} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Histórico</Text>
        <View style={styles.historyList}>
          {reservation.history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyDot} />
              <View style={styles.historyCopy}>
                <Text style={styles.historyLabel}>{item.label}</Text>
                <Text style={styles.historyMeta}>{item.actor} • {formatDateTime(item.timestamp)}</Text>
                {item.note ? <Text style={styles.historyNote}>{item.note}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.actions}>
        <SecondaryButton label="Cancelar reserva" onPress={() => {}} disabled />
        <SecondaryButton label="Editar futuramente" onPress={() => {}} disabled />
      </View>
    </ScreenContainer>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: "800",
  },
  infoRow: {
    marginTop: spacing.md,
    gap: spacing.xxs,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  historyList: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  historyItem: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primaryDark,
    marginTop: 6,
  },
  historyCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  historyLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  historyMeta: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  historyNote: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.sm,
  },
});
