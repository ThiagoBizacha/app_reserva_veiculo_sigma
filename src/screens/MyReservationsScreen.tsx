import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState, PageHeader, ScreenContainer, StatusBadge } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { canCancelReservation, canExecuteReservationOperation } from "@/utils/authorization";
import { formatDateTime } from "@/utils/date";
import { getResourceById, isScheduledReservationActive } from "@/utils/reservations";
import type { ReservationStatus } from "@/types";

type ReservationFilter = "Ativas" | "Em uso" | "Concluídas" | "Canceladas";

export function MyReservationsScreen() {
  const { currentUser, currentUserId, reservations, resources, cancelReservation, isMutating } =
    useReservationStore();
  const [filter, setFilter] = useState<ReservationFilter>("Ativas");
  const [feedback, setFeedback] = useState<string | null>(null);
  const referenceDate = new Date();

  const myReservations = useMemo(
    () =>
      reservations
        .filter((reservation) => reservation.userId === currentUserId)
        .sort((left, right) => new Date(right.startDate).getTime() - new Date(left.startDate).getTime()),
    [currentUserId, reservations]
  );

  const filteredReservations = useMemo(
    () =>
      myReservations.filter((reservation) =>
        matchesReservationFilter(reservation, filter, referenceDate)
      ),
    [filter, myReservations, referenceDate]
  );

  const counts = {
    Ativas: myReservations.filter((reservation) =>
      matchesReservationFilter(reservation, "Ativas", referenceDate)
    ).length,
    "Em uso": myReservations.filter((reservation) =>
      matchesReservationFilter(reservation, "Em uso", referenceDate)
    ).length,
    Concluídas: myReservations.filter((reservation) =>
      matchesReservationFilter(reservation, "Concluídas", referenceDate)
    ).length,
    Canceladas: myReservations.filter((reservation) =>
      matchesReservationFilter(reservation, "Canceladas", referenceDate)
    ).length,
  };

  const openOperation = (reservationId: string, mode: "checkin" | "checkout") => {
    router.push({
      pathname: "/operation/[id]",
      params: { id: reservationId, mode },
    });
  };

  const openDetail = (reservationId: string) => {
    router.push({
      pathname: "/reservation/[id]",
      params: { id: reservationId },
    });
  };

  const handleReservationAction = async (reservationId: string, status: ReservationStatus) => {
    const reservation = reservations.find((item) => item.id === reservationId);

    if (!reservation) {
      return;
    }

    if (status === "Reservado" && canExecuteReservationOperation(currentUser, reservation)) {
      openOperation(reservationId, "checkin");
      return;
    }

    if (status === "Em uso" && canExecuteReservationOperation(currentUser, reservation)) {
      openOperation(reservationId, "checkout");
      return;
    }

    if (!canCancelReservation(currentUser, reservation)) {
      return;
    }

    const result = await cancelReservation(reservationId);
    setFeedback(result.message);
  };

  return (
    <ScreenContainer>
      <PageHeader title="Minhas Reservas" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
        {(["Ativas", "Em uso", "Concluídas", "Canceladas"] as ReservationFilter[]).map((item) => {
          const active = item === filter;

          return (
            <Pressable key={item} style={styles.filterTab} onPress={() => setFilter(item)}>
              <View style={styles.filterLabelRow}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
                {counts[item] > 0 ? (
                  <View style={[styles.countBadge, active && styles.countBadgeActive]}>
                    <Text style={[styles.countBadgeText, active && styles.countBadgeTextActive]}>
                      {counts[item]}
                    </Text>
                  </View>
                ) : null}
              </View>
              {active ? <View style={styles.filterUnderline} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {feedback ? (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {filteredReservations.length === 0 ? (
          <EmptyState
            icon="bookmark"
            title="Nenhuma reserva neste filtro"
            description="Selecione outro grupo ou inicie uma nova reserva pela agenda."
          />
        ) : (
          filteredReservations.map((reservation) => {
            const resource = getResourceById(resources, reservation.resourceId);
            const canOperateReservation = canExecuteReservationOperation(currentUser, reservation);
            const canCancelCurrentReservation = canCancelReservation(currentUser, reservation);
            const actionLabel =
              reservation.status === "Reservado" && canOperateReservation
                ? "Iniciar vistoria de saída"
                : reservation.status === "Em uso" && canOperateReservation
                  ? "Registrar devolução"
                  : reservation.status === "Reservado" && canCancelCurrentReservation
                    ? "Cancelar reserva"
                  : undefined;

            return (
              <View key={reservation.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderCopy}>
                    <Text style={styles.cardTitle}>{reservation.code}</Text>
                    <Text style={styles.cardSubtitle}>
                      {resource?.name ?? reservation.title}
                      {resource?.plate ? ` | ${resource.plate}` : ""}
                    </Text>
                  </View>
                  <StatusBadge status={reservation.status} kind="reservation" />
                </View>

                <InfoRow
                  icon="calendar"
                  text={`${formatDateTime(reservation.startDate)} -> ${formatDateTime(reservation.endDate)}`}
                />
                {reservation.plannedDurationHours ? (
                  <InfoRow icon="clock" text={`Duração planejada: ${reservation.plannedDurationHours}h`} />
                ) : null}
                <InfoRow icon="map-pin" text={reservation.base} />
                <InfoRow icon="briefcase" text={reservation.purpose} />

                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.actionButton, styles.secondaryAction]}
                    onPress={() => openDetail(reservation.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Ver detalhes</Text>
                  </Pressable>

                  {actionLabel ? (
                    <Pressable
                      style={[styles.actionButton, styles.primaryAction]}
                      onPress={() => {
                        void handleReservationAction(reservation.id, reservation.status);
                      }}
                      disabled={isMutating}
                    >
                      <Text style={styles.actionButtonText}>
                        {isMutating ? "Processando..." : actionLabel}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>

      <Pressable style={styles.fab} onPress={() => router.push("/(tabs)/agenda")}>
        <Feather name="calendar" size={22} color={colors.white} />
      </Pressable>
    </ScreenContainer>
  );
}

function matchesReservationFilter(
  reservation: { endDate: string; startDate: string; status: ReservationStatus },
  filter: ReservationFilter,
  referenceDate: Date
) {
  if (filter === "Ativas") {
    return isScheduledReservationActive(reservation, referenceDate);
  }

  if (filter === "Em uso") {
    return reservation.status === "Em uso" || reservation.status === "Em atraso";
  }

  if (filter === "Concluídas") {
    return reservation.status === "Concluida";
  }

  return reservation.status === "Cancelada";
}

function InfoRow({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={18} color={colors.primaryDark} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  headerUser: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  filterTabs: {
    gap: spacing.lg,
    paddingRight: spacing.lg,
  },
  filterTab: {
    paddingBottom: spacing.xs,
  },
  filterLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: "600",
  },
  filterTextActive: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeActive: {
    backgroundColor: colors.primaryDark,
  },
  countBadgeText: {
    color: colors.textSecondary,
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  countBadgeTextActive: {
    color: colors.white,
  },
  filterUnderline: {
    marginTop: spacing.xs,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
  },
  feedback: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  feedbackText: {
    color: colors.primaryDark,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  list: {
    gap: spacing.md,
    paddingBottom: 96,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  cardHeaderCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  cardTitle: {
    color: colors.primaryDark,
    fontSize: typography.cardTitle,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoText: {
    color: colors.text,
    fontSize: typography.body,
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  primaryAction: {
    backgroundColor: colors.primaryDark,
  },
  secondaryAction: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerAction: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: `${colors.danger}33`,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.bodySmall,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryActionText: {
    color: colors.textSecondary,
  },
  dangerActionText: {
    color: colors.danger,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
});

