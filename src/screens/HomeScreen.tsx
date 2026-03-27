import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, spacing, typography } from "@/theme";

const menu = [
  {
    title: "Nova Reserva",
    description: "Solicitar um veículo corporativo",
    icon: "key",
    route: "/reservation/new",
  },
  {
    title: "Minhas Reservas",
    description: "Ver e gerenciar suas solicitações",
    icon: "calendar",
    route: "/(tabs)/reservations",
    badge: "2 Pendentes",
  },
  {
    title: "Check-out / Check-in",
    description: "Registrar retirada ou devolução",
    icon: "clipboard",
    route: "/(tabs)/check-flow",
  },
  {
    title: "Painel da Frota",
    description: "Disponibilidade e indicadores",
    icon: "trending-up",
    route: "/(tabs)/resources",
  },
];

export function HomeScreen() {
  const { currentUserName } = useReservationStore();

  return (
    <ScreenContainer scroll={false}>
      <LinearGradient colors={[colors.primaryDark, "#2D6B13"]} style={styles.header}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.brand}>SIGMA LITHIUM</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{currentUserName}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statusStrip}>
        <View style={styles.statusIndicator} />
        <Text style={styles.statusLabel}>Status: Online</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Reserva de Veículos</Text>
          <Text style={styles.subtitle}>Selecione uma opção</Text>
        </View>

        <View style={styles.menuList}>
          {menu.map((item) => (
            <Pressable key={item.title} style={styles.menuCard} onPress={() => router.push(item.route as never)}>
              <View style={styles.cardAccent} />
              <View style={styles.cardIconWrap}>
                <Feather name={item.icon as keyof typeof Feather.glyphMap} size={28} color="#2E5F14" />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.cardDescriptionRow}>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                  {item.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Feather name="chevron-right" size={24} color="#2E5F14" />
            </Pressable>
          ))}
        </View>

        <Text style={styles.footer}>Sigma Lithium © 2026</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
    borderRadius: 999,
    backgroundColor: "#5EF26D",
  },
  onlineText: {
    color: "#DDF7E2",
    fontSize: typography.caption,
  },
  statusStrip: {
    marginHorizontal: -spacing.lg,
    backgroundColor: "#EEF8EF",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#31B34F",
  },
  statusLabel: {
    color: "#315D2F",
    fontSize: typography.body,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: spacing.lg,
  },
  titleBlock: {
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    color: "#272727",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#676767",
    fontSize: 18,
    textAlign: "center",
  },
  menuList: {
    gap: spacing.lg,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    minHeight: 108,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 16,
    bottom: 16,
    width: 6,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "#1C9B43",
  },
  cardIconWrap: {
    width: 52,
    alignItems: "center",
  },
  cardCopy: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    color: "#232323",
    fontSize: 30 / 1.6,
    fontWeight: "800",
  },
  cardDescriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  cardDescription: {
    color: "#5E5E5E",
    fontSize: typography.body,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "#FFCB67",
  },
  badgeText: {
    color: "#7A4F00",
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    color: "#6D6D6D",
    fontSize: typography.body,
    paddingBottom: spacing.sm,
  },
});
