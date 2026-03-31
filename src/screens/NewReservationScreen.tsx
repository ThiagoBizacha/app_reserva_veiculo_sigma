import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ExitHeaderButton, ScreenContainer, StatusBadge } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { addHours, formatDate, formatDateTime } from "@/utils/date";
import { getResourceConflicts } from "@/utils/reservations";

interface NewReservationScreenProps {
  initialResourceId?: string;
  initialDate?: string;
}

type PickerField = "date" | "time" | null;

const durationOptions = [1, 2, 3, 4] as const;
const FIXED_BASE = "Araçuaí - MG";

export function NewReservationScreen({
  initialDate,
  initialResourceId,
}: NewReservationScreenProps) {
  const { createReservation, reservations, resources, getResourceStatus } = useReservationStore();
  const seededDate = initialDate ? new Date(initialDate) : new Date(2026, 2, 27, 8, 0, 0);
  const defaultDay = new Date(
    seededDate.getFullYear(),
    seededDate.getMonth(),
    seededDate.getDate(),
    0,
    0,
    0,
    0
  );
  const defaultTime = new Date(seededDate);
  defaultTime.setMinutes(0, 0, 0);

  const vehicleOptions = resources.filter((item) => item.category === "Veiculo");

  const [resourceId, setResourceId] = useState(initialResourceId ?? "");
  const [purpose, setPurpose] = useState("");
  const [base] = useState(FIXED_BASE);
  const [notes, setNotes] = useState("");
  const [reservationDate, setReservationDate] = useState(defaultDay);
  const [pickupTime, setPickupTime] = useState(defaultTime);
  const [durationHours, setDurationHours] = useState<(typeof durationOptions)[number]>(1);
  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(
    null
  );

  const startDate = useMemo(() => {
    const next = new Date(reservationDate);
    next.setHours(pickupTime.getHours(), pickupTime.getMinutes(), 0, 0);
    return next.toISOString();
  }, [pickupTime, reservationDate]);

  const endDate = useMemo(() => addHours(startDate, durationHours).toISOString(), [durationHours, startDate]);

  const selectedResource = vehicleOptions.find((resource) => resource.id === resourceId);
  const conflicts = useMemo(
    () => (resourceId ? getResourceConflicts(reservations, resourceId, startDate, endDate) : []),
    [endDate, reservations, resourceId, startDate]
  );
  const selectedResourceStatus = selectedResource
    ? getResourceStatus(selectedResource.id, new Date(startDate))
    : "Disponivel";
  const isSubmitDisabled = !resourceId || !purpose.trim() || !base.trim() || conflicts.length > 0;

  const onChangeDate =
    (field: PickerField) => (event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === "android") {
        setPickerField(null);
      }

      if (event.type === "dismissed" || !selected || !field) {
        return;
      }

      if (field === "date") {
        const nextDate = new Date(selected);
        nextDate.setHours(0, 0, 0, 0);
        setReservationDate(nextDate);
        return;
      }

      const nextTime = new Date(pickupTime);
      nextTime.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setPickupTime(nextTime);
    };

  const handleSave = () => {
    const result = createReservation({
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Reserva de Veiculo</Text>
        <ExitHeaderButton variant="light" compact />
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Nova Reserva</Text>
        <Text style={styles.heroSubtitle}>
          Escolha o horario de retirada e a duracao de uso. Cada reserva pode ter no minimo 1h e
          no maximo 4h no mesmo dia.
        </Text>
      </View>

      <Section title="Veiculo">
        <Pressable style={styles.selector} onPress={() => setShowResourceModal(true)}>
          <Text style={[styles.selectorText, !selectedResource && styles.selectorPlaceholder]}>
            {selectedResource
              ? `${selectedResource.plate ?? selectedResource.code} | ${selectedResource.brand ?? ""} ${selectedResource.model ?? selectedResource.name}`
              : "Selecionar veiculo"}
          </Text>
          <Feather name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>

        {selectedResource ? (
          <View style={styles.resourceSnapshot}>
            <View style={styles.resourceSnapshotTop}>
              <View style={styles.resourceSnapshotCopy}>
                <Text style={styles.resourceSnapshotTitle}>{selectedResource.name}</Text>
                <Text style={styles.resourceSnapshotMeta}>
                  {selectedResource.plate ?? selectedResource.code} | {selectedResource.location}
                </Text>
                <Text style={styles.resourceSnapshotMeta}>
                  {selectedResource.rentalCompany ?? "-"} | Km {selectedResource.currentMileage ?? "-"} | {selectedResource.responsible}
                </Text>
              </View>
              <StatusBadge status={selectedResourceStatus} kind="resource" />
            </View>
          </View>
        ) : null}
      </Section>

      <Section title="Janela da Reserva">
        <Pressable style={styles.selector} onPress={() => setPickerField("date")}>
          <Text style={styles.selectorText}>{formatDate(reservationDate)}</Text>
          <Feather name="calendar" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.selector} onPress={() => setPickerField("time")}>
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
          <Text style={styles.periodSummaryTitle}>Previsao de uso</Text>
          <Text style={styles.periodSummaryText}>Retirada: {formatDateTime(startDate)}</Text>
          <Text style={styles.periodSummaryText}>Previsao de devolucao: {formatDateTime(endDate)}</Text>
          <Text style={styles.periodSummaryText}>Duracao planejada: {durationHours} hora(s)</Text>
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
          value={base}
          onChangeText={() => undefined}
          placeholder={"Ara\u00E7ua\u00ED - MG"}
          editable={false}
        />
        <Field
          label="Observacoes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Detalhes adicionais, passageiros e instrucoes."
          multiline
        />
      </Section>

      <Section title="Bloqueios por Horario">
        {conflicts.length === 0 ? (
          <View style={styles.freeState}>
            <Feather name="check-circle" size={18} color={colors.success} />
            <Text style={styles.freeStateText}>
              Nao ha bloqueio neste horario. O sistema preve devolucao em {formatDateTime(endDate)}.
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
        style={[styles.primaryButton, isSubmitDisabled && styles.primaryButtonDisabled]}
        onPress={handleSave}
        disabled={isSubmitDisabled}
      >
        <Text style={styles.primaryButtonText}>Salvar reserva</Text>
      </Pressable>

      <Modal
        visible={showResourceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResourceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar veiculo</Text>
            <View style={styles.modalList}>
              {vehicleOptions.map((resource) => {
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
                          {resource.plate ?? resource.code} | {resource.brand ?? "-"} {resource.model ?? ""} | {resource.location}
                        </Text>
                        <Text style={styles.modalItemMeta}>
                          {resource.rentalCompany ?? "-"} | Km {resource.currentMileage ?? "-"}
                        </Text>
                      </View>
                      <StatusBadge status={optionStatus} kind="resource" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.secondaryButton} onPress={() => setShowResourceModal(false)}>
              <Text style={styles.secondaryButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {pickerField ? (
        <DateTimePicker
          value={pickerField === "date" ? reservationDate : pickupTime}
          mode={pickerField}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangeDate(pickerField)}
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
