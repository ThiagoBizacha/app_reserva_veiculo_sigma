import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";

export function HomeScreen() {
  const { currentUser, currentUserName, reservations, users, getActionableReservations, getSummary } =
    useReservationStore();
  const summary = getSummary();
  const actionableReservations = getActionableReservations();
  const myOpenReservations = reservations.filter(
    (reservation) =>
      reservation.userId === currentUser.id &&
      ["Pendente", "Aprovada", "Em uso", "Em atraso"].includes(reservation.status)
  ).length;
  const managerName =
    users.find((user) => user.id === currentUser.gestorId)?.fullName ?? "Sem gestor definido";

  const shortcuts = [
    {
      title: "Minhas reservas",
      description: "Acompanhe reservas e inicie a operacao quando necessario.",
      icon: "bookmark",
      route: "/(tabs)/reservations",
      badge: myOpenReservations > 0 ? `${myOpenReservations} ativas` : undefined,
    },
    {
      title: "Frota",
      description: "Consulte disponibilidade, cadastro resumido e agenda dos veiculos.",
      icon: "truck",
      route: "/(tabs)/resources",
      badge: `${summary.available} livres`,
    },
    {
      title: "Painel da frota",
      description: "Veja indicadores consolidados e alertas operacionais.",
      icon: "bar-chart-2",
      route: "/(tabs)/admin",
    },
  ];

  return (
    <ScreenContainer>
      <LinearGradient colors={[colors.primaryDark, colors.green700]} style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>SIGMA LITHIUM</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{currentUserName}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Reserva de Veiculos</Text>
          <Text style={styles.headerSubtitle}>
            Entre pela agenda para escolher o veiculo e reservar com menos passos.
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>{currentUser.fullName}</Text>
              <Text style={styles.profileMeta}>
                {currentUser.matricula} | {currentUser.areaDepartamento}
              </Text>
            </View>
            <View
              style={[
                styles.cnhBadge,
                currentUser.cnhStatus === "Valida" ? styles.cnhBadgeValid : styles.cnhBadgeExpired,
              ]}
            >
              <Text
                style={[
                  styles.cnhBadgeText,
                  currentUser.cnhStatus === "Valida"
                    ? styles.cnhBadgeTextValid
                    : styles.cnhBadgeTextExpired,
                ]}
              >
                CNH {currentUser.cnhStatus}
              </Text>
            </View>
          </View>
          <Text style={styles.profileMeta}>
            Centro de custo {currentUser.centroCusto} | Gestor {managerName}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard label="Reservas ativas" value={myOpenReservations} />
          <SummaryCard label="Veiculos livres" value={summary.available} />
          <SummaryCard label="Operacoes" value={actionableReservations.length} />
        </View>

        <Pressable style={styles.primaryCard} onPress={() => router.push("/(tabs)/agenda")}>
          <View style={styles.primaryCardCopy}>
            <Text style={styles.primaryEyebrow}>Fluxo principal</Text>
            <Text style={styles.primaryTitle}>Reservar veiculo</Text>
            <Text style={styles.primaryDescription}>
              Escolha o dia no calendario e siga para a reserva ja com contexto preenchido.
            </Text>
          </View>
          <View style={styles.primaryIcon}>
            <Feather name="calendar" size={26} color={colors.primaryDark} />
          </View>
        </Pressable>

        <View style={styles.shortcuts}>
          {shortcuts.map((item) => (
            <Pressable
              key={item.title}
              style={styles.shortcutCard}
              onPress={() => router.push(item.route as never)}
            >
              <View style={styles.shortcutIcon}>
                <Feather
                  name={item.icon as keyof typeof Feather.glyphMap}
                  size={20}
                  color={colors.primaryDark}
                />
              </View>
              <View style={styles.shortcutCopy}>
                <View style={styles.shortcutTitleRow}>
                  <Text style={styles.shortcutTitle}>{item.title}</Text>
                  {item.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.shortcutDescription}>{item.description}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.primaryDark} />
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
    letterSpacing: 1,
  },
  userInfo: {
    alignItems: "flex-end",
    gap: 4,
  },
  userName: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: "#5EF26D",
  },
  onlineText: {
    color: colors.primarySoft,
    fontSize: typography.caption,
  },
  headerCopy: {
    gap: spacing.xs,
  },
  headerTitle: {
    color: colors.white,
    fontSize: typography.display,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#E3F7EE",
    fontSize: typography.body,
    lineHeight: 22,
  },
  content: {
    gap: spacing.lg,
    marginTop: -spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    ...shadows.card,
  },
  profileTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  profileName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  profileMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  cnhBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  cnhBadgeValid: {
    backgroundColor: colors.primarySoft,
  },
  cnhBadgeExpired: {
    backgroundColor: `${colors.danger}12`,
  },
  cnhBadgeText: {
    fontSize: typography.caption,
    fontWeight: "700",
  },
  cnhBadgeTextValid: {
    color: colors.primaryDark,
  },
  cnhBadgeTextExpired: {
    color: colors.danger,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: spacing.xxs,
  },
  summaryValue: {
    color: colors.primaryDark,
    fontSize: typography.section,
    fontWeight: "700",
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    textAlign: "center",
  },
  primaryCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  primaryCardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  primaryEyebrow: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  primaryTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "700",
  },
  primaryDescription: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  primaryIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcuts: {
    gap: spacing.md,
  },
  shortcutCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...shadows.soft,
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  shortcutTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  shortcutTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  shortcutDescription: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  badgeText: {
    color: colors.primaryDark,
    fontSize: typography.tiny,
    fontWeight: "700",
  },
});
