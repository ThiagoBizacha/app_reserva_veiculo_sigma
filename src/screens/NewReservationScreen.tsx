import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, spacing, typography } from "@/theme";
import { formatDateTime, toIsoDateTime } from "@/utils/date";
import { getResourceConflicts } from "@/utils/reservations";

interface NewReservationScreenProps {
  initialResourceId?: string;
  initialDate?: string;
}

type PickerField = "start" | "end" | null;

export function NewReservationScreen({ initialDate, initialResourceId }: NewReservationScreenProps) {
  const { createReservation, reservations, resources } = useReservationStore();
  const defaultDate = initialDate ? new Date(initialDate) : new Date(2026, 2, 27, 9, 0, 0);

  const [resourceId, setResourceId] = useState(initialResourceId ?? "");
  const [purpose, setPurpose] = useState("");
  const [base, setBase] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState(toIsoDateTime(defaultDate, 9));
  const [endDate, setEndDate] = useState(toIsoDateTime(defaultDate, 18));
  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  const selectedResource = resources.find((resource) => resource.id === resourceId);
  const conflicts = useMemo(
    () => (resourceId ? getResourceConflicts(reservations, resourceId, startDate, endDate) : []),
    [endDate, reservations, resourceId, startDate]
  );

  const onChangeDate = (field: PickerField) => (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setPickerField(null);
    if (event.type === "dismissed" || !selected || !field) return;
    if (field === "start") setStartDate(selected.toISOString());
    else setEndDate(selected.toISOString());
  };

  const handleSave = () => {
    const result = createReservation({ resourceId, startDate, endDate, purpose, base, notes });
    setFeedback({ type: result.success ? "success" : "error", message: result.message });
    if (result.success && result.reservation) {
      setTimeout(() => router.replace(`/reservation/${result.reservation?.id}`), 500);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Reserva de Veículo</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Nova Solicitação</Text>
        <Text style={styles.heroSubtitle}>Selecione veículo, período e contexto operacional.</Text>
      </View>

      <Section title="Veículo">
        <Pressable style={styles.selector} onPress={() => setShowResourceModal(true)}>
          <Text style={[styles.selectorText, !selectedResource && styles.selectorPlaceholder]}>
            {selectedResource ? `${selectedResource.name} • ${selectedResource.code}` : "Selecionar veículo"}
          </Text>
          <Feather name="chevron-down" size={18} color="#777" />
        </Pressable>
      </Section>

      <Section title="Período da Reserva">
        <Pressable style={styles.selector} onPress={() => setPickerField("start")}>
          <Text style={styles.selectorText}>{formatDateTime(startDate)}</Text>
          <Feather name="calendar" size={18} color="#777" />
        </Pressable>
        <Pressable style={styles.selector} onPress={() => setPickerField("end")}>
          <Text style={styles.selectorText}>{formatDateTime(endDate)}</Text>
          <Feather name="calendar" size={18} color="#777" />
        </Pressable>
        {new Date(endDate) < new Date(startDate) ? (
          <Text style={styles.errorText}>A data final precisa ser posterior à inicial.</Text>
        ) : null}
      </Section>

      <Section title="Dados Operacionais">
        <Field label="Finalidade" value={purpose} onChangeText={setPurpose} placeholder="Ex.: Visita técnica em unidade operacional" />
        <Field label="Local / Base" value={base} onChangeText={setBase} placeholder="Ex.: Sede BH" />
        <Field label="Observações" value={notes} onChangeText={setNotes} placeholder="Detalhes adicionais, passageiros, instruções." multiline />
      </Section>

      <Section title="Conflitos do Período">
        {conflicts.length === 0 ? (
          <View style={styles.freeState}>
            <Feather name="check-circle" size={18} color="#2E8C38" />
            <Text style={styles.freeStateText}>Nenhum conflito encontrado para o período selecionado.</Text>
          </View>
        ) : (
          conflicts.map((conflict) => (
            <View key={conflict.id} style={styles.conflictCard}>
              <Text style={styles.conflictTitle}>{conflict.code}</Text>
              <Text style={styles.conflictLine}>{formatDateTime(conflict.startDate)} até {formatDateTime(conflict.endDate)}</Text>
              <Text style={styles.conflictLine}>{conflict.purpose}</Text>
            </View>
          ))
        )}
      </Section>

      {feedback ? (
        <View style={[styles.feedback, feedback.type === "error" ? styles.feedbackError : styles.feedbackSuccess]}>
          <Text style={[styles.feedbackText, feedback.type === "error" ? styles.feedbackTextError : styles.feedbackTextSuccess]}>
            {feedback.message}
          </Text>
        </View>
      ) : null}

      <Pressable style={styles.primaryButton} onPress={handleSave}>
        <Text style={styles.primaryButtonText}>Salvar Reserva</Text>
      </Pressable>

      <Modal visible={showResourceModal} transparent animationType="slide" onRequestClose={() => setShowResourceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar veículo</Text>
            <View style={styles.modalList}>
              {resources.filter((item) => item.category === "Veiculo").map((resource) => (
                <Pressable
                  key={resource.id}
                  style={[styles.modalItem, resource.id === resourceId && styles.modalItemActive]}
                  onPress={() => {
                    setResourceId(resource.id);
                    setShowResourceModal(false);
                  }}
                >
                  <Text style={styles.modalItemTitle}>{resource.name}</Text>
                  <Text style={styles.modalItemMeta}>{resource.code} • {resource.location}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.secondaryButton} onPress={() => setShowResourceModal(false)}>
              <Text style={styles.secondaryButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {pickerField ? (
        <DateTimePicker
          value={new Date(pickerField === "start" ? startDate : endDate)}
          mode="datetime"
          display={Platform.OS === "ios" ? "inline" : "default"}
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
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#939393"
        multiline={multiline}
        style={[styles.textInput, multiline && styles.textInputMultiline]}
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
    backgroundColor: "#29631B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
  },
  headerSpacer: {
    width: 24,
  },
  heroCard: {
    backgroundColor: "#EEF7EC",
    borderRadius: 18,
    padding: spacing.md,
  },
  heroTitle: {
    color: "#212121",
    fontSize: typography.section,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#666",
    fontSize: typography.body,
    marginTop: 4,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: "#285F1C",
    fontSize: typography.cardTitle,
    fontWeight: "800",
  },
  sectionContent: {
    gap: spacing.sm,
  },
  selector: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    color: "#2C2C2C",
    fontSize: typography.body,
  },
  selectorPlaceholder: {
    color: "#8B8B8B",
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: "#4F4F4F",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  textInput: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: "#2C2C2C",
    fontSize: typography.body,
  },
  textInputMultiline: {
    minHeight: 104,
    paddingTop: spacing.sm,
    textAlignVertical: "top",
  },
  freeState: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#EDF8EF",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  freeStateText: {
    color: "#2E8C38",
    fontSize: typography.body,
    flex: 1,
  },
  conflictCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0C8C8",
    backgroundColor: "#FFF5F5",
    padding: spacing.md,
  },
  conflictTitle: {
    color: "#922B2B",
    fontSize: typography.body,
    fontWeight: "800",
  },
  conflictLine: {
    color: "#6A4545",
    fontSize: typography.caption,
    marginTop: 4,
  },
  feedback: {
    borderRadius: 12,
    padding: spacing.md,
  },
  feedbackError: {
    backgroundColor: "#FCEBEC",
  },
  feedbackSuccess: {
    backgroundColor: "#E7F6EF",
  },
  feedbackText: {
    fontSize: typography.caption,
    fontWeight: "700",
  },
  feedbackTextError: {
    color: colors.danger,
  },
  feedbackTextSuccess: {
    color: colors.success,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#295F16",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: spacing.md,
  },
  modalTitle: {
    color: "#1F1F1F",
    fontSize: typography.section,
    fontWeight: "800",
  },
  modalList: {
    gap: spacing.sm,
  },
  modalItem: {
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    backgroundColor: "#F7FAF7",
  },
  modalItemActive: {
    borderColor: "#2E8C38",
    backgroundColor: "#ECF7EE",
  },
  modalItemTitle: {
    color: "#232323",
    fontSize: typography.body,
    fontWeight: "800",
  },
  modalItemMeta: {
    color: "#666",
    fontSize: typography.caption,
    marginTop: 4,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#2C2C2C",
    fontSize: typography.body,
    fontWeight: "700",
  },
});
