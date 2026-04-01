import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState, PageHeader, ScreenContainer, StatusBadge } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import {
  addMonths,
  createDateInAppTimeZone,
  formatDate,
  formatDateTime,
  formatMonthYear,
  getAppDateParts,
  getMonthMatrix,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "@/utils/date";
import { getCalendarDayStateForResource } from "@/utils/reservations";
import { CalendarDayCell } from "@/components/CalendarDayCell";

interface AgendaScreenProps {
  initialResourceId?: string;
}

const weekLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

const availabilityCopy = {
  disponivel: {
    title: "Disponível",
    description: "O veículo está livre para uma nova reserva nesta data.",
    color: colors.success,
    backgroundColor: `${colors.success}12`,
  },
  reservado: {
    title: "Reservado",
    description: "Já existe um bloqueio parcial neste dia. Consulte os horários antes de reservar.",
    color: colors.info,
    backgroundColor: `${colors.info}12`,
  },
  emUso: {
    title: "Em uso",
    description: "O veículo possui uso registrado neste dia. Consulte o horário de devolução.",
    color: colors.warning,
    backgroundColor: "#FFF5E8",
  },
  manutencao: {
    title: "Manutenção",
    description: "O veículo está indisponível por manutenção nesta data.",
    color: colors.danger,
    backgroundColor: `${colors.danger}10`,
  },
};

export function AgendaScreen({ initialResourceId }: AgendaScreenProps) {
  const {
    resources,
    getActionableReservations,
    getAvailabilityForDate,
    getReservationsForDay,
    getReservationsForResource,
    getResourceStatus,
  } = useReservationStore();
  const vehicles = resources.filter((resource) => resource.category === "Veiculo");
  const today = new Date();
  const nextActionableReservation = getActionableReservations()[0];
  const initialContextDate = nextActionableReservation
    ? new Date(nextActionableReservation.startDate)
    : today;
  const initialVehicle =
    vehicles.find((resource) => resource.id === initialResourceId) ??
    vehicles.find((resource) => resource.id === nextActionableReservation?.resourceId) ??
    vehicles[0];

  const [selectedResourceId, setSelectedResourceId] = useState(initialVehicle?.id ?? "");
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialContextDate));
  const [selectedDate, setSelectedDate] = useState(startOfDay(initialContextDate));
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  const selectedResource = vehicles.find((resource) => resource.id === selectedResourceId) ?? vehicles[0];
  const selectedResourceStatus = selectedResource
    ? getResourceStatus(selectedResource.id, selectedDate)
    : "Disponivel";
  const currentMonthParts = getAppDateParts(currentMonth);
  const monthMatrix = useMemo(() => getMonthMatrix(currentMonth), [currentMonth]);
  const calendarRows = useMemo(
    () => Array.from({ length: 6 }, (_, index) => monthMatrix.slice(index * 7, index * 7 + 7)),
    [monthMatrix]
  );
  const resourceReservations = selectedResource
    ? getReservationsForResource(selectedResource.id)
    : [];
  const selectedDayReservations = selectedResource
    ? getReservationsForDay(selectedResource.id, selectedDate)
    : [];
  const selectedDayAvailability = selectedResource
    ? getAvailabilityForDate(selectedResource.id, selectedDate)
    : { state: "disponivel" as const, reservations: [], isAvailable: false };
  const dayCard = availabilityCopy[selectedDayAvailability.state];

  const selectedDayStart = startOfDay(selectedDate);
  const todayStart = startOfDay(today);
  const isPastDay = selectedDayStart < todayStart;

  const handleMonthChange = (offset: number) => {
    const nextMonth = addMonths(currentMonth, offset);
    const nextMonthParts = getAppDateParts(nextMonth);
    const selectedDateParts = getAppDateParts(selectedDate);
    const maxDay = getAppDateParts(
      createDateInAppTimeZone({
        year: nextMonthParts.year,
        month: nextMonthParts.month + 1,
        day: 0,
      })
    ).day;
    const targetDay = Math.min(selectedDateParts.day, maxDay);

    setCurrentMonth(nextMonth);
    setSelectedDate(
      createDateInAppTimeZone({
        year: nextMonthParts.year,
        month: nextMonthParts.month,
        day: targetDay,
      })
    );
  };

  const handleOpenNewReservation = () => {
    if (!selectedResource) {
      return;
    }

    router.push({
      pathname: "/reservation/new",
      params: { resourceId: selectedResource.id, date: selectedDate.toISOString() },
    });
  };

  if (vehicles.length === 0) {
    return (
      <ScreenContainer>
        <PageHeader title="Agenda" />
        <EmptyState
          icon="truck"
          title="Nenhum veículo cadastrado"
          description="Cadastre veículos na frota para começar a consultar disponibilidade e criar reservas."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <PageHeader title="Agenda" />

      <View style={styles.selectorBlock}>
        <Text style={styles.selectorLabel}>Veículo</Text>
        <Pressable style={styles.selector} onPress={() => setIsVehicleModalOpen(true)}>
          <Text style={styles.selectorText}>
            {selectedResource
              ? `${selectedResource.name} | ${selectedResource.plate ?? selectedResource.code}`
              : "Selecionar veículo"}
          </Text>
          <Feather name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {selectedResource ? (
        <View style={styles.resourceSummary}>
          <View style={styles.resourceSummaryTop}>
            <View style={styles.resourceTitleRow}>
              <Feather name="truck" size={18} color={colors.primaryDark} />
              <Text style={styles.resourceTitle}>{selectedResource.name}</Text>
            </View>
            <StatusBadge status={selectedResourceStatus} kind="resource" />
          </View>
          <Text style={styles.resourceMeta}>
            {selectedResource.plate ?? selectedResource.code} | {selectedResource.brand ?? "-"}{" "}
            {selectedResource.model ?? ""}
          </Text>
          <Text style={styles.resourceMeta}>
            {selectedResource.location} | {selectedResource.rentalCompany ?? "-"} | Km{" "}
            {selectedResource.currentMileage ?? "-"}
          </Text>
        </View>
      ) : null}

      <View style={styles.monthHeader}>
        <Pressable style={styles.monthButton} onPress={() => handleMonthChange(-1)}>
          <Feather name="chevron-left" size={20} color={colors.primaryDark} />
        </Pressable>
        <Text style={styles.monthTitle}>{formatMonthYear(currentMonth)}</Text>
        <Pressable style={styles.monthButton} onPress={() => handleMonthChange(1)}>
          <Feather name="chevron-right" size={20} color={colors.primaryDark} />
        </Pressable>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.weekHeader}>
          {weekLabels.map((day) => (
            <Text key={day} style={styles.weekLabel}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {calendarRows.map((row, rowIndex) => (
            <View key={`week-${rowIndex}`} style={styles.gridRow}>
              {row.map((day) => (
                <View key={day.toISOString()} style={styles.gridCell}>
                  <CalendarDayCell
                    dayNumber={getAppDateParts(day).day}
                    isCurrentMonth={getAppDateParts(day).month === currentMonthParts.month}
                    isSelected={isSameDay(day, selectedDate)}
                    isToday={isSameDay(day, today)}
                    state={
                      selectedResource
                        ? getCalendarDayStateForResource(day, selectedResource, resourceReservations)
                        : "disponivel"
                    }
                    onPress={() => setSelectedDate(day)}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.dayCard, { backgroundColor: dayCard.backgroundColor, borderColor: dayCard.color }]}>
        <View style={styles.dayCardHeader}>
          <View style={styles.dayCardCopy}>
            <Text style={styles.dayCardTitle}>{formatDate(selectedDate)}</Text>
            <Text style={styles.dayCardDescription}>
              {isPastDay
                ? "A data selecionada está no histórico. Consulte o que aconteceu neste dia."
                : dayCard.description}
            </Text>
          </View>
          <View style={[styles.availabilityPill, { backgroundColor: dayCard.color }]}>
            <Text style={styles.availabilityPillText}>{dayCard.title}</Text>
          </View>
        </View>

        <View style={styles.dayActions}>
          {!isPastDay && selectedDayAvailability.state !== "manutencao" ? (
            <Pressable style={styles.primaryAction} onPress={handleOpenNewReservation}>
              <Text style={styles.primaryActionText}>Escolher horário neste dia</Text>
            </Pressable>
          ) : null}

          {selectedDayAvailability.reservations.length > 0 ? (
            <Pressable
              style={styles.secondaryAction}
              onPress={() =>
                router.push({
                  pathname: "/reservation/[id]",
                  params: { id: selectedDayAvailability.reservations[0].id },
                })
              }
            >
              <Text style={styles.secondaryActionText}>Abrir reserva do dia</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Reservas do dia</Text>
        <Text style={styles.sectionSubtitle}>{selectedDayReservations.length} item(ns)</Text>
      </View>

      <View style={styles.list}>
        {selectedDayReservations.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Nenhuma reserva para este dia"
            description="Se a data estiver livre, siga para a reserva direto pelo card acima."
          />
        ) : (
          selectedDayReservations.map((reservation) => (
            <Pressable
              key={reservation.id}
              style={styles.reservationRow}
              onPress={() =>
                router.push({ pathname: "/reservation/[id]", params: { id: reservation.id } })
              }
            >
              <View style={styles.reservationRowCopy}>
                <Text style={styles.reservationRowTitle}>{reservation.code}</Text>
                <Text style={styles.reservationRowText}>
                  {formatDateTime(reservation.startDate)} até {formatDateTime(reservation.endDate)}
                </Text>
                <Text style={styles.reservationRowText}>{reservation.purpose}</Text>
              </View>
              <StatusBadge status={reservation.status} kind="reservation" />
            </Pressable>
          ))
        )}
      </View>

      <Modal
        visible={isVehicleModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVehicleModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar veículo</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
              {vehicles.map((resource) => {
                const isActive = resource.id === selectedResourceId;
                const resourceStatus = getResourceStatus(resource.id, selectedDate);

                return (
                  <Pressable
                    key={resource.id}
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedResourceId(resource.id);
                      setIsVehicleModalOpen(false);
                    }}
                  >
                    <View style={styles.modalItemCopy}>
                      <Text style={styles.modalItemTitle}>{resource.name}</Text>
                      <Text style={styles.modalItemMeta}>
                        {resource.plate ?? resource.code} | {resource.vehicleCategory ?? resource.category}
                      </Text>
                      <Text style={styles.modalItemMeta}>
                        {resource.rentalCompany ?? "-"} | Km {resource.currentMileage ?? "-"}
                      </Text>
                    </View>
                    <StatusBadge status={resourceStatus} kind="resource" />
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable style={styles.modalClose} onPress={() => setIsVehicleModalOpen(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
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
  selectorBlock: {
    gap: spacing.xs,
  },
  selectorLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  selector: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
  },
  resourceSummary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  resourceSummaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  resourceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  resourceTitle: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: "700",
    flex: 1,
  },
  resourceMeta: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    marginTop: spacing.xs,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  monthTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "700",
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  grid: {
    gap: spacing.xs,
  },
  gridRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  gridCell: {
    flex: 1,
  },
  dayCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  dayCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  dayCardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  dayCardTitle: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: "700",
  },
  dayCardDescription: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  availabilityPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  availabilityPillText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  dayActions: {
    gap: spacing.sm,
  },
  primaryAction: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
  secondaryAction: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  secondaryActionText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  list: {
    gap: spacing.sm,
  },
  reservationRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  reservationRowCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  reservationRowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  reservationRowText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  modalContent: {
    maxHeight: "78%",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.md,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "700",
  },
  modalList: {
    gap: spacing.sm,
  },
  modalItem: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  modalItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  modalItemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  modalItemTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  modalItemMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  modalClose: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
});



