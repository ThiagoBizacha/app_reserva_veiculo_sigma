import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ExitHeaderButton, PageHeader, ScreenContainer, VehicleDocumentPreviewModal } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { formatDate, isWithinRange } from "@/utils/date";
import { getNextReservation, getResourceStatusLabel } from "@/utils/reservations";
import type { Resource, ResourceStatus } from "@/types";

type FleetFilter = "Todos" | "Disponivel" | "Reservado" | "Em uso" | "Manutencao";

const filterLabel: Record<FleetFilter, string> = {
  Todos: "Todos",
  Disponivel: "Disponível",
  Reservado: "Reservado",
  "Em uso": "Em uso",
  Manutencao: "Manutenção",
};

const statusMeta: Record<ResourceStatus, { color: string; action: string }> = {
  Disponivel: { color: colors.success, action: "Ver agenda" },
  Reservado: { color: colors.info, action: "Ver reserva" },
  "Em uso": { color: colors.warning, action: "Ver reserva em uso" },
  Manutencao: { color: colors.danger, action: "Ver agenda" },
};

export function ResourcesScreen() {
  const { resources, reservations, getResourceStatus } = useReservationStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FleetFilter>("Todos");
  const [documentResource, setDocumentResource] = useState<Resource | null>(null);

  const vehicles = resources.filter((item) => item.category === "Veiculo");
  const vehicleItems = useMemo(
    () =>
      vehicles.map((resource) => {
        const computedStatus = getResourceStatus(resource.id);
        const nextReservation = getNextReservation(resource, reservations);
        const currentReservation =
          reservations.find(
            (reservation) =>
              reservation.resourceId === resource.id &&
              (reservation.status === "Em uso" || reservation.status === "Em atraso")
          ) ??
          reservations.find(
            (reservation) =>
              reservation.resourceId === resource.id &&
              ["Pendente", "Aprovada"].includes(reservation.status) &&
              isWithinRange(new Date(), reservation.startDate, reservation.endDate)
          );

        return {
          resource,
          computedStatus,
          nextReservation,
          currentReservation,
        };
      }),
    [getResourceStatus, reservations, vehicles]
  );

  const filtered = vehicleItems.filter(({ resource, computedStatus }) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      resource.name.toLowerCase().includes(query) ||
      resource.code.toLowerCase().includes(query) ||
      resource.location.toLowerCase().includes(query) ||
      resource.plate?.toLowerCase().includes(query) ||
      resource.model?.toLowerCase().includes(query) ||
      resource.brand?.toLowerCase().includes(query) ||
      resource.rentalCompany?.toLowerCase().includes(query);
    const matchesFilter = filter === "Todos" || computedStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    Todos: vehicleItems.length,
    Disponivel: vehicleItems.filter((item) => item.computedStatus === "Disponivel").length,
    Reservado: vehicleItems.filter((item) => item.computedStatus === "Reservado").length,
    "Em uso": vehicleItems.filter((item) => item.computedStatus === "Em uso").length,
    Manutencao: vehicleItems.filter((item) => item.computedStatus === "Manutencao").length,
  };

  const handleAction = (status: ResourceStatus, resourceId: string, reservationId?: string) => {
    if ((status === "Em uso" || status === "Reservado") && reservationId) {
      router.push({ pathname: "/reservation/[id]", params: { id: reservationId } });
      return;
    }

    router.push({ pathname: "/(tabs)/agenda", params: { resourceId } });
  };

  const openDetail = (resourceId: string) => {
    router.push({ pathname: "/resource/[id]", params: { id: resourceId } });
  };

  const openDocumentPreview = (resource: Resource) => {
    setDocumentResource(resource);
  };

  return (
    <ScreenContainer>
      <PageHeader
        title="Frota de Veículos"
        subtitle="Consulte a disponibilidade, os documentos e os próximos bloqueios da frota."
        rightContent={
          <View style={styles.headerActions}>
            <ExitHeaderButton variant="light" compact />
            <Pressable
              style={styles.plusButton}
              onPress={() => router.push({ pathname: "/reservation/new" })}
            >
              <Feather name="plus" size={18} color={colors.white} />
            </Pressable>
          </View>
        }
      />

      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar veículo, placa ou locadora"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {(["Todos", "Disponivel", "Reservado", "Em uso", "Manutencao"] as FleetFilter[]).map(
          (item) => {
            const active = filter === item;
            const chipColor =
              item === "Todos"
                ? colors.primaryDark
                : item === "Reservado"
                  ? colors.info
                  : statusMeta[item].color;

            return (
              <Pressable
                key={item}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: `${chipColor}16`, borderColor: chipColor },
                ]}
                onPress={() => setFilter(item)}
              >
                <Text style={[styles.filterChipText, active && { color: chipColor }]}>
                  {filterLabel[item]} ({counts[item]})
                </Text>
              </Pressable>
            );
          }
        )}
      </ScrollView>

      <View style={styles.list}>
        {filtered.map(({ resource, computedStatus, nextReservation, currentReservation }) => (
          <View key={resource.id} style={styles.vehicleCard}>
            <View style={[styles.cardBorder, { backgroundColor: statusMeta[computedStatus].color }]} />

            <View style={styles.cardTop}>
              <View style={styles.titleRow}>
                <Feather name="truck" size={20} color={colors.textMuted} />
                <Text style={styles.vehicleName}>{resource.name}</Text>
              </View>
              <View
                style={[styles.statusPill, { backgroundColor: statusMeta[computedStatus].color }]}
              >
                <Text style={styles.statusPillText}>
                  {getResourceStatusLabel(computedStatus)}
                </Text>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <Text style={styles.metaText}>
                Placa: {resource.plate ?? "-"} | Código: {resource.code}
              </Text>
              <Text style={styles.metaText}>
                {resource.brand ?? "-"} {resource.model ?? ""} | {resource.year ?? "-"} | {resource.vehicleCategory ?? "-"}
              </Text>
              <Text style={styles.metaText}>
                Locadora: {resource.rentalCompany ?? "-"} | Km atual: {resource.currentMileage ?? "-"}
              </Text>
              {computedStatus === "Disponivel" && nextReservation ? (
                <Text style={styles.metaText}>
                  Próxima reserva: {formatDate(nextReservation.startDate)}
                </Text>
              ) : null}
              {computedStatus === "Reservado" && currentReservation ? (
                <Text style={styles.metaText}>
                  Reserva ativa: {formatDate(currentReservation.startDate)} até{" "}
                  {formatDate(currentReservation.endDate)}
                </Text>
              ) : null}
              {computedStatus === "Em uso" && currentReservation ? (
                <Text style={styles.metaText}>Em uso até: {formatDate(currentReservation.endDate)}</Text>
              ) : null}
              {computedStatus === "Manutencao" ? (
                <Text style={styles.metaText}>
                  Retorno previsto: {resource.nextAvailableAt ? formatDate(resource.nextAvailableAt) : "A definir"}
                </Text>
              ) : null}
              {resource.nextMaintenanceDate ? (
                <Text style={styles.metaText}>
                  Próxima manutenção: {formatDate(resource.nextMaintenanceDate)} | Km {resource.nextMaintenanceMileage ?? "-"}
                </Text>
              ) : null}
            </View>

            <View style={styles.utilityActionsRow}>
              <Pressable
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={() => openDetail(resource.id)}
              >
                <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Ver detalhes</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  styles.secondaryAction,
                  !resource.vehicleDocumentAttachment && styles.disabledAction,
                ]}
                onPress={() => openDocumentPreview(resource)}
                disabled={!resource.vehicleDocumentAttachment}
              >
                <View style={styles.inlineActionContent}>
                  <Feather
                    name="file-text"
                    size={16}
                    color={resource.vehicleDocumentAttachment ? colors.textSecondary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      styles.secondaryActionText,
                      !resource.vehicleDocumentAttachment && styles.disabledActionText,
                    ]}
                  >
                    Ver PDF
                  </Text>
                </View>
              </Pressable>
            </View>

            <Pressable
              style={[styles.actionButton, styles.primaryActionButton, { backgroundColor: statusMeta[computedStatus].color }]}
              onPress={() =>
                handleAction(computedStatus, resource.id, currentReservation?.id ?? nextReservation?.id)
              }
            >
              <Text style={styles.actionButtonText}>{statusMeta[computedStatus].action}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <VehicleDocumentPreviewModal
        resource={documentResource}
        onClose={() => setDocumentResource(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primaryDark,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
  },
  filterRow: {
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  list: {
    gap: spacing.md,
  },
  vehicleCard: {
    position: "relative",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.card,
  },
  cardBorder: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 6,
    borderTopRightRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  vehicleName: {
    fontSize: typography.cardTitle,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusPillText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  metaGrid: {
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  utilityActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  inlineActionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  secondaryAction: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryActionText: {
    color: colors.textSecondary,
  },
  disabledAction: {
    backgroundColor: colors.surfaceAlt,
  },
  disabledActionText: {
    color: colors.textMuted,
  },
  primaryActionButton: {
    minHeight: 48,
  },
});


