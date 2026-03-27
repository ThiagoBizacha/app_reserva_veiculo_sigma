import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { formatDate, isWithinRange } from "@/utils/date";

export function AdminScreen() {
  const { currentUser, resources, reservations, getSummary } = useReservationStore();
  const summary = getSummary();
  const today = new Date();

  const todayReservations = reservations
    .filter(
      (reservation) =>
        reservation.status !== "Cancelada" &&
        isWithinRange(today, reservation.startDate, reservation.endDate)
    )
    .slice(0, 3);
  const pendingReservations = reservations.filter((reservation) => reservation.status === "Pendente");
  const maintenanceVehicles = resources
    .filter((resource) => resource.category === "Veiculo" && resource.status === "Manutencao")
    .slice(0, 2);

  const totalPercent = Math.max(summary.total, 1);
  const availablePercent = Math.round((summary.available / totalPercent) * 100);
  const reservedPercent = Math.round((summary.reserved / totalPercent) * 100);
  const inUsePercent = Math.round((summary.inUse / totalPercent) * 100);
  const maintenancePercent = Math.round((summary.maintenance / totalPercent) * 100);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Painel da Frota</Text>
        <Text style={styles.headerUser}>{currentUser.fullName}</Text>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard value={summary.available} label="Disponíveis" color={colors.primaryDark} />
        <MetricCard value={summary.inUse} label="Em Uso" color={colors.warning} />
        <MetricCard value={summary.maintenance} label="Manutenção" color={colors.danger} />
      </View>

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
            const dotColor =
              reservation.status === "Em uso"
                ? colors.success
                : reservation.status === "Pendente"
                  ? colors.textMuted
                  : colors.warning;

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
                  <Text style={styles.inlineStatusText}>{reservation.status}</Text>
                </View>
              </View>
            );
          })
        )}
      </PanelCard>

      <PanelCard title="Solicitações Pendentes de Aprovação">
        <View style={styles.alertBox}>
          <Feather name="bell" size={16} color={colors.white} />
          <Text style={styles.alertText}>
            {pendingReservations.length} reservas aguardando aprovação do gestor
          </Text>
        </View>
      </PanelCard>

      <PanelCard title="Próximas Manutenções">
        {maintenanceVehicles.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma manutenção programada.</Text>
        ) : (
          maintenanceVehicles.map((vehicle, index) => (
            <View
              key={vehicle.id}
              style={[styles.row, index < maintenanceVehicles.length - 1 && styles.rowDivider]}
            >
              <Feather name="tool" size={18} color={colors.textSecondary} />
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{vehicle.name}</Text>
                <Text style={styles.rowSubtitle}>
                  Retorno: {vehicle.nextAvailableAt ? formatDate(vehicle.nextAvailableAt) : "A definir"}
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
  },
  headerUser: {
    color: colors.primarySoft,
    fontSize: typography.caption,
    maxWidth: 110,
    textAlign: "right",
  },
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
    backgroundColor: colors.warning,
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
