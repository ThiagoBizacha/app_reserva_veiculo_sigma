import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, spacing, typography } from "@/theme";
import { addMonths, formatMonthYear, getMonthMatrix } from "@/utils/date";
import { getCalendarDayState, getMonthlyReservations, getResourceById } from "@/utils/reservations";

const weekLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const stateColors = {
  emUso: "#F08A00",
  manutencao: "#D72828",
  reservado: "#229342",
  disponivel: "#B5B5B5",
};

export function AgendaScreen() {
  const { resources, reservations } = useReservationStore();
  const [month, setMonth] = useState(new Date(2026, 2, 1));
  const matrix = useMemo(() => getMonthMatrix(month), [month]);
  const vehicle = resources.find((item) => item.category === "Veiculo") ?? resources[0];
  const monthlyReservations = useMemo(() => getMonthlyReservations(reservations, month), [month, reservations]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda - {vehicle.code}</Text>
        <View style={styles.availablePill}>
          <Text style={styles.availablePillText}>Disponível</Text>
        </View>
      </View>

      <View style={styles.vehicleBanner}>
        <View style={styles.vehicleRow}>
          <Feather name="truck" size={22} color="#3C6E3C" />
          <Text style={styles.vehicleTitle}>{vehicle.name} | Prata | 2023</Text>
        </View>
        <View style={styles.vehicleRow}>
          <Feather name="map-pin" size={20} color="#3C6E3C" />
          <Text style={styles.vehicleMeta}>Local</Text>
        </View>
        <Text style={styles.vehicleMetaStrong}>Base: {vehicle.location} | Resp: {vehicle.responsible}</Text>
      </View>

      <View style={styles.monthHeader}>
        <Pressable onPress={() => setMonth((current) => addMonths(current, -1))}>
          <Feather name="chevron-left" size={26} color="#202020" />
        </Pressable>
        <Text style={styles.monthTitle}>{formatMonthYear(month)}</Text>
        <Pressable onPress={() => setMonth((current) => addMonths(current, 1))}>
          <Feather name="chevron-right" size={26} color="#202020" />
        </Pressable>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.weekHeader}>
          {weekLabels.map((item) => (
            <Text key={item} style={styles.weekText}>
              {item}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {matrix.map((day) => {
            const state = getCalendarDayState(day, resources, reservations);
            const inMonth = day.getMonth() === month.getMonth();
            return (
              <Pressable key={day.toISOString()} style={styles.dayCell}>
                <Text style={[styles.dayNumber, !inMonth && styles.dayNumberMuted]}>{day.getDate()}</Text>
                {inMonth ? (
                  <>
                    <View style={[styles.dayDot, { backgroundColor: stateColors[state] }]} />
                    {(day.getDate() === 5 || day.getDate() === 6) && state === "emUso" ? (
                      <Text style={[styles.dayStateText, { color: stateColors[state] }]}>Em Uso</Text>
                    ) : null}
                    {day.getDate() === 8 && state === "manutencao" ? (
                      <Text style={[styles.dayStateText, { color: stateColors[state] }]}>Manutenção</Text>
                    ) : null}
                    {day.getDate() === 10 && state === "reservado" ? (
                      <Text style={[styles.dayStateText, { color: stateColors[state] }]}>Reservada</Text>
                    ) : null}
                  </>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.legend}>
        <LegendItem color={stateColors.emUso} label="Em Uso" />
        <LegendItem color={stateColors.manutencao} label="Manutenção" />
        <LegendItem color={stateColors.reservado} label="Reservada" />
        <LegendItem color={stateColors.disponivel} label="Disponível" />
      </View>

      <Text style={styles.sectionTitle}>Reservas do Mês</Text>
      <View style={styles.monthReservations}>
        {monthlyReservations.slice(0, 2).map((reservation, index) => {
          const bg = index === 0 ? "#F08A00" : "#229342";
          const resource = getResourceById(resources, reservation.resourceId);
          return (
            <Pressable
              key={reservation.id}
              style={[styles.reservationBar, { backgroundColor: bg }]}
              onPress={() => router.push(`/reservation/${reservation.id}`)}
            >
              <Text style={styles.reservationBarText}>
                {reservation.startDate.slice(8, 10)}-{reservation.endDate.slice(8, 10)}/{reservation.startDate.slice(5, 7)} | {resource?.name.split(" ")[0]} | {reservation.base} | {reservation.status}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.primaryCta} onPress={() => router.push(`/reservation/new?resourceId=${vehicle.id}`)}>
        <Text style={styles.primaryCtaText}>Nova Reserva para este Veículo</Text>
      </Pressable>
    </ScreenContainer>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
  },
  availablePill: {
    backgroundColor: "#2D9340",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  availablePillText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  vehicleBanner: {
    backgroundColor: "#EAF6E9",
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.xs,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  vehicleTitle: {
    color: "#3C3C3C",
    fontSize: typography.body,
    fontWeight: "700",
  },
  vehicleMeta: {
    color: "#4A4A4A",
    fontSize: typography.body,
  },
  vehicleMetaStrong: {
    color: "#333333",
    fontSize: typography.body,
    fontWeight: "700",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  monthTitle: {
    color: "#202020",
    fontSize: 22,
    fontWeight: "800",
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekText: {
    width: "14.2%",
    textAlign: "center",
    color: "#969696",
    fontSize: typography.caption,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
  },
  dayCell: {
    width: "14.2%",
    minHeight: 52,
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  dayNumber: {
    color: "#4D4D4D",
    fontSize: typography.body,
    fontWeight: "700",
  },
  dayNumberMuted: {
    color: "#BDBDBD",
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  dayStateText: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    color: "#525252",
    fontSize: typography.caption,
  },
  sectionTitle: {
    color: "#242424",
    fontSize: 18,
    fontWeight: "800",
  },
  monthReservations: {
    gap: spacing.sm,
  },
  reservationBar: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  reservationBarText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
  primaryCta: {
    backgroundColor: "#275E16",
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryCtaText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "800",
  },
});
