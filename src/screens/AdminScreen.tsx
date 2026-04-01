import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BackHeaderButton, PageHeader, ScreenContainer } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { formatDate, isWithinRange } from "@/utils/date";
import type { ReservationStatus, Resource } from "@/types";

export function AdminScreen() {
  const { resources, reservations, getResourceStatus, getSummary } = useReservationStore();
  const summary = getSummary();
  const today = new Date();
  const vehicles = resources.filter((resource) => resource.category === "Veiculo");

  const todayReservations = reservations
    .filter(
      (reservation) =>
        reservation.status !== "Cancelada" &&
        isWithinRange(today, reservation.startDate, reservation.endDate)
    )
    .slice(0, 3);
  const reservedReservations = reservations.filter((reservation) =>
    ["Pendente", "Aprovada"].includes(reservation.status)
  );
  const vehiclesInMaintenance = vehicles
    .filter((resource) => getResourceStatus(resource.id, today) === "Manutencao")
    .slice()
    .sort((left, right) => sortByOptionalDate(left.nextAvailableAt, right.nextAvailableAt))
    .slice(0, 3);
  const upcomingMaintenanceVehicles = vehicles
    .filter(
      (resource) =>
        getResourceStatus(resource.id, today) !== "Manutencao" &&
        isDateWithinDays(resource.nextMaintenanceDate, 30)
    )
    .slice()
    .sort((left, right) => sortByOptionalDate(left.nextMaintenanceDate, right.nextMaintenanceDate))
    .slice(0, 3);
  const activeReservations = reservations.filter((reservation) =>
    ["Pendente", "Aprovada", "Em uso", "Em atraso"].includes(reservation.status)
  );
  const lateReservations = reservations.filter(
    (reservation) => reservation.status === "Em atraso"
  );
  const documentsAvailable = vehicles.filter((resource) =>
    Boolean(resource.vehicleDocumentAttachment)
  ).length;
  const upcomingMaintenance = vehicles.filter(
    (resource) =>
      getResourceStatus(resource.id, today) !== "Manutencao" &&
      isDateWithinDays(resource.nextMaintenanceDate, 30)
  ).length;
  const averageMileage = getAverageMileage(vehicles);

  const totalPercent = Math.max(summary.total, 1);
  const availablePercent = Math.round((summary.available / totalPercent) * 100);
  const reservedPercent = Math.round((summary.reserved / totalPercent) * 100);
  const inUsePercent = Math.round((summary.inUse / totalPercent) * 100);
  const maintenancePercent = Math.round((summary.maintenance / totalPercent) * 100);
  const occupancyRate = Math.round(((summary.reserved + summary.inUse) / totalPercent) * 100);

  const indicators: IndicatorCardProps[] = [
    {
      icon: "activity",
      value: `${occupancyRate}%`,
      label: "Ocupação",
      helper: `${summary.reserved + summary.inUse} veículos indisponíveis`,
      accentColor: colors.info,
    },
    {
      icon: "bookmark",
      value: String(activeReservations.length),
      label: "Reservas ativas",
      helper: "Reservadas, em uso e em atraso",
      accentColor: colors.primaryDark,
    },
    {
      icon: "alert-triangle",
      value: String(lateReservations.length),
      label: "Em atraso",
      helper: "Demandam ação da operação",
      accentColor: colors.danger,
    },
    {
      icon: "file-text",
      value: `${documentsAvailable}/${vehicles.length}`,
      label: "PDFs",
      helper: "Documentos cadastrados",
      accentColor: colors.success,
    },
    {
      icon: "tool",
      value: String(upcomingMaintenance),
      label: "Revisão 30d",
      helper: "Manutenções previstas",
      accentColor: colors.warning,
    },
    {
      icon: "bar-chart-2",
      value: averageMileage,
      label: "Km médio",
      helper: "Média da frota ativa",
      accentColor: colors.primary,
    },
  ];

  return (
    <ScreenContainer>
      <PageHeader title="Painel da Frota" leftAction={<BackHeaderButton />} />

      <View style={styles.metricsRow}>
        <MetricCard value={summary.available} label="Disponíveis" color={colors.primaryDark} />
        <MetricCard value={summary.inUse} label="Em uso" color={colors.warning} />
        <MetricCard value={summary.maintenance} label="Manutenção" color={colors.danger} />
      </View>

      <PanelCard title="Indicadores Operacionais">
        <View style={styles.indicatorGrid}>
          {indicators.map((indicator) => (
            <IndicatorCard key={indicator.label} {...indicator} />
          ))}
        </View>
      </PanelCard>

      <PanelCard title="Disponibilidade da Frota">
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressSegment,
              { width: `${availablePercent}%`, backgroundColor: colors.success },
            ]}
          />
          <View
            style={[
              styles.progressSegment,
              { width: `${reservedPercent}%`, backgroundColor: colors.info },
            ]}
          />
          <View
            style={[
              styles.progressSegment,
              { width: `${inUsePercent}%`, backgroundColor: colors.warning },
            ]}
          />
          <View
            style={[
              styles.progressSegment,
              { width: `${maintenancePercent}%`, backgroundColor: colors.danger },
            ]}
          />
        </View>
        <View style={styles.legendRow}>
          <Legend color={colors.success} label={`Disponível ${availablePercent}%`} />
          <Legend color={colors.info} label={`Reservado ${reservedPercent}%`} />
          <Legend color={colors.warning} label={`Em uso ${inUsePercent}%`} />
          <Legend color={colors.danger} label={`Manutenção ${maintenancePercent}%`} />
        </View>
        <Text style={styles.footerText}>
          {summary.total} veículos no total | {summary.reserved} reservado(s) no período atual
        </Text>
      </PanelCard>

      <PanelCard title="Reservas de Hoje">
        {todayReservations.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma reserva em andamento hoje.</Text>
        ) : (
          todayReservations.map((reservation, index) => {
            const resource = resources.find((item) => item.id === reservation.resourceId);
            const dotColor = getReservationStatusColor(reservation.status);

            return (
              <View
                key={reservation.id}
                style={[styles.row, index < todayReservations.length - 1 && styles.rowDivider]}
              >
                <Feather name="truck" size={18} color={colors.textSecondary} />
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{resource?.code ?? reservation.code}</Text>
                  <Text style={styles.rowSubtitle}>{reservation.purpose}</Text>
                </View>
                <View style={styles.inlineStatus}>
                  <View style={[styles.inlineDot, { backgroundColor: dotColor }]} />
                  <Text style={styles.inlineStatusText}>
                    {getReservationStatusLabel(reservation.status)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </PanelCard>

      <PanelCard title="Reservas Agendadas">
        <View style={styles.alertBox}>
          <Feather name="bookmark" size={16} color={colors.white} />
          <Text style={styles.alertText}>
            {reservedReservations.length} reservas aguardando check-in
          </Text>
        </View>
      </PanelCard>

      <PanelCard title="Veículos em Manutenção">
        {vehiclesInMaintenance.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum veículo em manutenção neste momento.</Text>
        ) : (
          vehiclesInMaintenance.map((vehicle, index) => (
            <View
              key={vehicle.id}
              style={[styles.row, index < vehiclesInMaintenance.length - 1 && styles.rowDivider]}
            >
              <Feather name="tool" size={18} color={colors.textSecondary} />
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{vehicle.name}</Text>
                <Text style={styles.rowSubtitle}>
                  Retorno previsto:{" "}
                  {vehicle.nextAvailableAt ? formatDate(vehicle.nextAvailableAt) : "A definir"}
                </Text>
              </View>
            </View>
          ))
        )}
      </PanelCard>

      <PanelCard title="Próximas Manutenções">
        {upcomingMaintenanceVehicles.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhuma manutenção prevista para os próximos 30 dias.
          </Text>
        ) : (
          upcomingMaintenanceVehicles.map((vehicle, index) => (
            <View
              key={vehicle.id}
              style={[
                styles.row,
                index < upcomingMaintenanceVehicles.length - 1 && styles.rowDivider,
              ]}
            >
              <Feather name="calendar" size={18} color={colors.textSecondary} />
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{vehicle.name}</Text>
                <Text style={styles.rowSubtitle}>
                  Prevista para {formatOptionalDate(vehicle.nextMaintenanceDate)} | Km{" "}
                  {vehicle.nextMaintenanceMileage ?? "não informado"}
                </Text>
              </View>
            </View>
          ))
        )}
      </PanelCard>
    </ScreenContainer>
  );
}

function MetricCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={[styles.metricCard, { backgroundColor: color }]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

interface IndicatorCardProps {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  label: string;
  helper: string;
  accentColor: string;
}

function IndicatorCard({ icon, value, label, helper, accentColor }: IndicatorCardProps) {
  return (
    <View style={styles.indicatorCard}>
      <View style={[styles.indicatorIconWrap, { backgroundColor: `${accentColor}14` }]}>
        <Feather name={icon} size={18} color={accentColor} />
      </View>
      <Text style={styles.indicatorValue}>{value}</Text>
      <Text style={styles.indicatorLabel}>{label}</Text>
      <Text style={styles.indicatorHelper}>{helper}</Text>
    </View>
  );
}

function PanelCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.panelCard}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function parseMileage(value?: string) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

function getAverageMileage(resources: Resource[]) {
  const parsed = resources
    .map((resource) => parseMileage(resource.currentMileage))
    .filter((value): value is number => value !== null);

  if (parsed.length === 0) {
    return "-";
  }

  return new Intl.NumberFormat("pt-BR").format(
    Math.round(parsed.reduce((total, value) => total + value, 0) / parsed.length)
  );
}

function isDateWithinDays(value: string | undefined, days: number) {
  if (!value) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);

  const diffInDays = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffInDays >= 0 && diffInDays <= days;
}

function formatOptionalDate(value?: string) {
  return value ? formatDate(value) : "data não informada";
}

function sortByOptionalDate(left?: string, right?: string) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return new Date(left).getTime() - new Date(right).getTime();
}

function getReservationStatusLabel(status: ReservationStatus) {
  if (status === "Pendente" || status === "Aprovada") {
    return "Reservado";
  }

  if (status === "Concluida") {
    return "Concluído";
  }

  return status;
}

function getReservationStatusColor(status: ReservationStatus) {
  if (status === "Em uso") {
    return colors.warning;
  }

  if (status === "Em atraso") {
    return colors.danger;
  }

  if (status === "Pendente" || status === "Aprovada") {
    return colors.info;
  }

  return colors.textMuted;
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: radius.lg,
    minHeight: 92,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  metricValue: {
    color: colors.white,
    fontSize: typography.display,
    fontWeight: "700",
  },
  metricLabel: {
    color: colors.white,
    fontSize: typography.bodySmall,
    fontWeight: "600",
  },
  panelCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.card,
  },
  panelTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "700",
  },
  indicatorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  indicatorCard: {
    width: "48%",
    minHeight: 132,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    gap: spacing.xs,
  },
  indicatorIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorValue: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "800",
  },
  indicatorLabel: {
    color: colors.primaryDark,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  indicatorHelper: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  progressBar: {
    height: 24,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
  },
  progressSegment: {
    height: "100%",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  legendLabel: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  footerText: {
    color: colors.text,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  rowSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  inlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  inlineDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  inlineStatusText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  alertBox: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.info,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  alertText: {
    color: colors.white,
    fontSize: typography.bodySmall,
    fontWeight: "700",
    flex: 1,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
});
