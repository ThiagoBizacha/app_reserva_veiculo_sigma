import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer, StatusBadge } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, spacing, typography } from "@/theme";
import { formatDateTime } from "@/utils/date";
import { getResourceById } from "@/utils/reservations";

export function MyReservationsScreen() {
  const { currentUserId, reservations, resources } = useReservationStore();
  const myReservations = reservations.filter((reservation) => reservation.userId === currentUserId);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Reservas</Text>
        <Pressable style={styles.newButton} onPress={() => router.push("/reservation/new")}>
          <Feather name="plus" size={20} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Gerencie suas solicitações</Text>
        <Text style={styles.heroSubtitle}>
          Acompanhe pendências, períodos reservados e o andamento operacional de cada veículo.
        </Text>
      </View>

      <View style={styles.list}>
        {myReservations.map((reservation) => {
          const resource = getResourceById(resources, reservation.resourceId);

          return (
            <Pressable key={reservation.id} style={styles.reservationCard} onPress={() => router.push(`/reservation/${reservation.id}`)}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleBlock}>
                  <Text style={styles.cardTitle}>{resource?.name ?? reservation.title}</Text>
                  <Text style={styles.cardCode}>{reservation.code}</Text>
                </View>
                <StatusBadge status={reservation.status} kind="reservation" />
              </View>
              <Text style={styles.cardLine}>Período: {formatDateTime(reservation.startDate)} até {formatDateTime(reservation.endDate)}</Text>
              <Text style={styles.cardLine}>Finalidade: {reservation.purpose}</Text>
              <Text style={styles.cardLine}>Base: {reservation.base}</Text>
              <Text style={styles.cardAction}>Ver detalhes</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
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
    fontSize: 24,
    fontWeight: "800",
  },
  newButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2DA13B",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    backgroundColor: "#F0F7EE",
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.xs,
  },
  heroTitle: {
    color: "#1F1F1F",
    fontSize: typography.section,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#5D5D5D",
    fontSize: typography.body,
    lineHeight: 22,
  },
  list: {
    gap: spacing.md,
  },
  reservationCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  cardTitleBlock: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: "#242424",
    fontSize: typography.cardTitle,
    fontWeight: "800",
  },
  cardCode: {
    color: "#2C6A20",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  cardLine: {
    color: "#595959",
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  cardAction: {
    marginTop: spacing.md,
    textAlign: "right",
    color: "#2C6A20",
    fontSize: typography.body,
    fontWeight: "700",
  },
});
