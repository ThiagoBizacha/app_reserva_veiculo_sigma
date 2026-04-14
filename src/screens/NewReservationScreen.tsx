import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BackHeaderButton, EmptyState, PageHeader, ScreenContainer, StatusBadge } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import {
  APP_TIME_ZONE,
  addHours,
  createDateInAppTimeZone,
  formatAppDate,
  formatDateTime,
  formatTime,
  getAppDateTimeParts,
  isPastDateTime,
  mergeDateAndTimeInAppTimeZone,
  startOfDay,
} from "@/utils/date";
import {
  getAvailablePickupHours,
  getNextOperationalReservationStart,
  getRequesterReservationEligibilityViolation,
  getReservationCreationRuleViolation,
} from "@/utils/operationalRules";
import { getResourceConflicts } from "@/utils/reservations";

interface NewReservationScreenProps {
  initialResourceId?: string;
  initialDate?: string;
}

type PickerField = "date" | null;

const durationOptions = [1, 2, 3, 4] as const;
const INVALID_PAST_TIME_MESSAGE = "Escolha um horário futuro para continuar.";
const NO_PICKUP_HOURS_MESSAGE = "Nao ha mais horarios de retirada disponiveis para esta data. Escolha outro dia.";

function buildPickupTime(hour: number) {
  return createDateInAppTimeZone({
    year: 2000,
    month: 1,
    day: 1,
    hour,
  });
}

export function NewReservationScreen({
  initialDate,
  initialResourceId,
}: NewReservationScreenProps) {
  const { createReservation, currentUser, reservations, resources, getResourceStatus, isMutating } =
    useReservationStore();
  const now = new Date();
  const initialReservationStart = getNextOperationalReservationStart(
    initialDate ? new Date(initialDate) : undefined,
    now
  );
  const defaultDay = startOfDay(initialReservationStart);
  const defaultTime = initialReservationStart;

  const vehicleOptions = resources.filter((item) => item.category === "Veiculo");
  const hasVehicleOptions = vehicleOptions.length > 0;
  const base = currentUser.matriz?.trim() ?? "";
  const baseLabel = base || "Base não informada";

  const [resourceId, setResourceId] = useState(initialResourceId ?? "");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [reservationDate, setReservationDate] = useState(defaultDay);
  const [pickupTime, setPickupTime] = useState(defaultTime);
  const [durationHours, setDurationHours] = useState<(typeof durationOptions)[number]>(1);
  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showHourModal, setShowHourModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(
    null
  );

  const startDate = useMemo(() => {
    return mergeDateAndTimeInAppTimeZone(reservationDate, pickupTime).toISOString();
  }, [pickupTime, reservationDate]);

  const endDate = useMemo(() => addHours(startDate, durationHours).toISOString(), [durationHours, startDate]);
  const availablePickupHours = useMemo(
    () => getAvailablePickupHours(reservationDate),
    [reservationDate]
  );

  const selectedResource = vehicleOptions.find((resource) => resource.id === resourceId);
  const conflicts = useMemo(
    () => (resourceId ? getResourceConflicts(reservations, resourceId, startDate, endDate) : []),
    [endDate, reservations, resourceId, startDate]
  );
  const selectedResourceStatus = selectedResource
    ? getResourceStatus(selectedResource.id, new Date(startDate))
    : "Disponivel";
  const selectedPickupHourLabel = formatTime(pickupTime);
  const requesterEligibilityViolation = getRequesterReservationEligibilityViolation(currentUser);
  const noPickupHoursForDay = availablePickupHours.length === 0 ? NO_PICKUP_HOURS_MESSAGE : null;
  const reservationRuleViolation =
    noPickupHoursForDay ??
    requesterEligibilityViolation ??
    (selectedResource
      ? getReservationCreationRuleViolation({
          requester: currentUser,
          resource: selectedResource,
          reservations,
          startDate,
          endDate,
        })
      : null);
  const todayStart = startOfDay(new Date());
  const isSubmitDisabled =
    !resourceId ||
    !purpose.trim() ||
    !base.trim() ||
    conflicts.length > 0 ||
    Boolean(reservationRuleViolation);

  useEffect(() => {
    if (availablePickupHours.length === 0) {
      return;
    }

    const pickupHour = getAppDateTimeParts(pickupTime).hour;
    if (availablePickupHours.includes(pickupHour)) {
      return;
    }

    setPickupTime(buildPickupTime(availablePickupHours[0]));
  }, [availablePickupHours, pickupTime]);

  const applyPastTimeFeedback = (nextStart: Date) => {
    const currentDate = new Date();

    if (isPastDateTime(nextStart, currentDate)) {
      setFeedback({
        type: "error",
        message: INVALID_PAST_TIME_MESSAGE,
      });
      return;
    }

    setFeedback((current) => (current?.message === INVALID_PAST_TIME_MESSAGE ? null : current));
  };

  const onChangeDate = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setPickerField(null);
    }

    if (event.type === "dismissed" || !selected) {
      return;
    }

    const nextDate = startOfDay(selected);
    const nextStart = mergeDateAndTimeInAppTimeZone(nextDate, pickupTime);

    setReservationDate(nextDate);
    applyPastTimeFeedback(nextStart);
  };

  const handleSelectHour = (hour: number) => {
    const nextTime = buildPickupTime(hour);
    const nextStart = mergeDateAndTimeInAppTimeZone(reservationDate, nextTime);

    setPickupTime(nextTime);
    setShowHourModal(false);
    applyPastTimeFeedback(nextStart);
  };

  const handleSave = async () => {
    if (reservationRuleViolation) {
      setFeedback({
        type: "error",
        message: reservationRuleViolation,
      });
      return;
    }

    const result = await createReservation({
      resourceId,
      startDate,
      endDate,
      durationHours,
      purpose,
      base,
      notes,
    });

    setFeedback({ type: result.success ? "success" : "error", message: result.message });

    if (result.success && result.reservation) {
      const createdReservation = result.reservation;
      setTimeout(() => {
        router.replace({
          pathname: "/reservation/[id]",
          params: { id: createdReservation.id },
        });
      }, 500);
    }
  };

  return (
    <ScreenContainer>
      <PageHeader title="Nova reserva" leftAction={<BackHeaderButton />} />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Nova Reserva</Text>
        <Text style={styles.heroSubtitle}>
          Escolha a retirada entre 08h e 18h. Cada reserva pode ter de 1h a 4h e precisa prever
          devolucao ate 19h no mesmo dia.
        </Text>
      </View>

      <Section title="Veículo">
        <Pressable
          style={[styles.selector, !hasVehicleOptions && styles.selectorDisabled]}
          onPress={() => setShowResourceModal(true)}
          disabled={!hasVehicleOptions}
        >
          <Text style={[styles.selectorText, !selectedResource && styles.selectorPlaceholder]}>
            {selectedResource
              ? `${selectedResource.plate ?? selectedResource.code} | ${selectedResource.brand ?? ""} ${selectedResource.model ?? selectedResource.name}`
              : hasVehicleOptions
                ? "Selecionar veículo"
                : "Nenhum veículo disponível"}
          </Text>
          <Feather name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>

        {!hasVehicleOptions ? (
          <EmptyState
            icon="truck"
            title="Nenhum veículo cadastrado"
            description="Cadastre veículos na frota para conseguir criar uma nova reserva."
          />
        ) : null}

        {selectedResource ? (
          <View style={styles.resourceSnapshot}>
            <View style={styles.resourceSnapshotTop}>
              <View style={styles.resourceSnapshotCopy}>
                <Text style={styles.resourceSnapshotTitle}>{selectedResource.name}</Text>
                <Text style={styles.resourceSnapshotMeta}>
                  {selectedResource.plate ?? selectedResource.code} | {selectedResource.vehicleCategory ?? "-"}
                </Text>
                <Text style={styles.resourceSnapshotMeta}>
                  {selectedResource.rentalCompany ?? "-"} | Km {selectedResource.currentMileage ?? "-"}
                </Text>
              </View>
              <StatusBadge status={selectedResourceStatus} kind="resource" />
            </View>
          </View>
        ) : null}
      </Section>

      <Section title="Janela da Reserva">
        <Pressable style={styles.selector} onPress={() => setPickerField("date")}>
          <Text style={styles.selectorText}>{formatAppDate(reservationDate)}</Text>
          <Feather name="calendar" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={[styles.selector, availablePickupHours.length === 0 && styles.selectorDisabled]}
          onPress={() => setShowHourModal(true)}
          disabled={availablePickupHours.length === 0}
        >
          <Text style={styles.selectorText}>Retirada: {formatDateTime(startDate)}</Text>
          <Feather name="clock" size={18} color={colors.textMuted} />
        </Pressable>

        <View style={styles.durationBlock}>
          <Text style={styles.fieldLabel}>Tempo de uso</Text>
          <View style={styles.durationRow}>
            {durationOptions.map((option) => {
              const active = durationHours === option;

              return (
                <Pressable
                  key={option}
                  style={[styles.durationChip, active && styles.durationChipActive]}
                  onPress={() => setDurationHours(option)}
                >
                  <Text style={[styles.durationChipText, active && styles.durationChipTextActive]}>
                    {option}h
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.periodSummary}>
          <Text style={styles.periodSummaryTitle}>Previsão de uso</Text>
          <Text style={styles.periodSummaryText}>Retirada: {formatDateTime(startDate)}</Text>
          <Text style={styles.periodSummaryText}>Previsão de devolução: {formatDateTime(endDate)}</Text>
          <Text style={styles.periodSummaryText}>Duração planejada: {durationHours} hora(s)</Text>
        </View>
      </Section>

      <Section title="Dados Operacionais">
        <Field
          label="Finalidade"
          value={purpose}
          onChangeText={setPurpose}
          placeholder="Ex.: Visita tecnica em unidade operacional"
        />
        <Field
          label="Local / Base"
          value={baseLabel}
          onChangeText={() => undefined}
          placeholder="Base do usuário"
          editable={false}
        />
        <Field
          label="Observações"
          value={notes}
          onChangeText={setNotes}
          placeholder="Detalhes adicionais, passageiros e instruções."
          multiline
        />
      </Section>

      <Section title="Bloqueios Operacionais">
        {reservationRuleViolation && conflicts.length === 0 ? (
          <View style={styles.conflictCard}>
            <Text style={styles.conflictTitle}>Reserva bloqueada</Text>
            <Text style={styles.conflictLine}>{reservationRuleViolation}</Text>
          </View>
        ) : conflicts.length === 0 ? (
          <View style={styles.freeState}>
            <Feather name="check-circle" size={18} color={colors.success} />
            <Text style={styles.freeStateText}>
              Não há bloqueio neste horário. O sistema prevê devolução em {formatDateTime(endDate)}.
            </Text>
          </View>
        ) : (
          conflicts.map((conflict) => (
            <View key={conflict.id} style={styles.conflictCard}>
              <Text style={styles.conflictTitle}>{conflict.code}</Text>
              <Text style={styles.conflictLine}>
                Bloqueado de {formatDateTime(conflict.startDate)} ate {formatDateTime(conflict.endDate)}
              </Text>
              <Text style={styles.conflictLine}>{conflict.purpose}</Text>
            </View>
          ))
        )}
      </Section>

      {feedback ? (
        <View
          style={[
            styles.feedback,
            feedback.type === "error" ? styles.feedbackError : styles.feedbackSuccess,
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              feedback.type === "error" ? styles.feedbackTextError : styles.feedbackTextSuccess,
            ]}
          >
            {feedback.message}
          </Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.primaryButton, (isSubmitDisabled || isMutating) && styles.primaryButtonDisabled]}
        onPress={() => {
          void handleSave();
        }}
        disabled={isSubmitDisabled || isMutating}
      >
        <Text style={styles.primaryButtonText}>
          {isMutating ? "Salvando..." : "Salvar reserva"}
        </Text>
      </Pressable>

      <Modal
        visible={showResourceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResourceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar veículo</Text>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {vehicleOptions.length === 0 ? (
                <EmptyState
                  icon="truck"
                  title="Nenhum veículo disponível"
                  description="Cadastre um veículo primeiro para habilitar a criação de reservas."
                />
              ) : (
                vehicleOptions.map((resource) => {
                  const optionStatus = getResourceStatus(resource.id, new Date(startDate));

                  return (
                    <Pressable
                      key={resource.id}
                      style={[styles.modalItem, resource.id === resourceId && styles.modalItemActive]}
                      onPress={() => {
                        setResourceId(resource.id);
                        setShowResourceModal(false);
                      }}
                    >
                      <View style={styles.modalItemTop}>
                        <View style={styles.modalItemCopy}>
                          <Text style={styles.modalItemTitle}>{resource.name}</Text>
                          <Text style={styles.modalItemMeta}>
                            {resource.plate ?? resource.code} | {resource.brand ?? "-"}{" "}
                            {resource.model ?? ""}
                          </Text>
                          <Text style={styles.modalItemMeta}>
                            {resource.rentalCompany ?? "-"} | Km {resource.currentMileage ?? "-"}
                          </Text>
                        </View>
                        <StatusBadge status={optionStatus} kind="resource" />
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
            <Pressable style={styles.secondaryButton} onPress={() => setShowResourceModal(false)}>
              <Text style={styles.secondaryButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showHourModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHourModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar horário</Text>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.hourList}
              showsVerticalScrollIndicator={false}
            >
              {availablePickupHours.map((hour) => {
                const hourLabel = `${String(hour).padStart(2, "0")}:00`;
                const isSelected = selectedPickupHourLabel === hourLabel;

                return (
                  <Pressable
                    key={hour}
                    style={[styles.hourItem, isSelected && styles.hourItemActive]}
                    onPress={() => handleSelectHour(hour)}
                  >
                    <Text style={[styles.hourItemText, isSelected && styles.hourItemTextActive]}>
                      {hourLabel}
                    </Text>
                  </Pressable>
                );
              })}
              {availablePickupHours.length === 0 ? (
                <View style={styles.hourEmptyState}>
                  <Text style={styles.hourEmptyStateText}>{NO_PICKUP_HOURS_MESSAGE}</Text>
                </View>
              ) : null}
            </ScrollView>
            <Pressable style={styles.secondaryButton} onPress={() => setShowHourModal(false)}>
              <Text style={styles.secondaryButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {pickerField ? (
        <DateTimePicker
          value={reservationDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={pickerField === "date" ? todayStart : undefined}
          timeZoneName={APP_TIME_ZONE}
          onChange={onChangeDate}
        />
      ) : null}
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[styles.textInput, multiline && styles.textInputMultiline, !editable && styles.textInputDisabled]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.white,
    fontSize: typography.section,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 24,
  },
  heroCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  heroTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.primaryDark,
    fontSize: typography.cardTitle,
    fontWeight: "700",
  },
  sectionContent: {
    gap: spacing.sm,
  },
  selector: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    color: colors.text,
    fontSize: typography.body,
    flex: 1,
  },
  selectorDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  selectorPlaceholder: {
    color: colors.textMuted,
  },
  resourceSnapshot: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  resourceSnapshotTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  resourceSnapshotCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  resourceSnapshotTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  resourceSnapshotMeta: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  durationBlock: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  durationRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  durationChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  durationChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  durationChipText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  durationChipTextActive: {
    color: colors.white,
  },
  periodSummary: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  periodSummaryTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  periodSummaryText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  fieldWrap: {
    gap: spacing.xs,
  },
  textInput: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.body,
  },
  textInputMultiline: {
    minHeight: 104,
    paddingTop: spacing.sm,
    textAlignVertical: "top",
  },
  textInputDisabled: {
    backgroundColor: colors.surfaceAlt,
    color: colors.textSecondary,
  },
  freeState: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  freeStateText: {
    color: colors.success,
    fontSize: typography.body,
    flex: 1,
  },
  conflictCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.danger}33`,
    backgroundColor: `${colors.danger}10`,
    padding: spacing.md,
    gap: spacing.xs,
  },
  conflictTitle: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: "700",
  },
  conflictLine: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  feedback: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  feedbackError: {
    backgroundColor: `${colors.danger}10`,
  },
  feedbackSuccess: {
    backgroundColor: colors.primarySoft,
  },
  feedbackText: {
    fontSize: typography.caption,
    fontWeight: "700",
  },
  feedbackTextError: {
    color: colors.danger,
  },
  feedbackTextSuccess: {
    color: colors.primaryDark,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.md,
    maxHeight: "85%",
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "700",
  },
  modalScroll: {
    maxHeight: 420,
  },
  modalList: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  modalItem: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  modalItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  modalItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
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
  hourList: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  hourEmptyState: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  hourEmptyStateText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    textAlign: "center",
  },
  hourItem: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  hourItemActive: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primarySoft,
  },
  hourItemText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  hourItemTextActive: {
    color: colors.primaryDark,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
});


