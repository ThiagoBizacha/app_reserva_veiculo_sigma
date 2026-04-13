import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DriverLicensePreviewModal, ScreenContainer } from "@/components";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import type { User } from "@/types";

export function HomeScreen() {
  const {
    currentUser,
    currentUserName,
    users,
    getActionableReservations,
    getSummary,
  } = useReservationStore();
  const { isSubmitting, signOut } = useAuthSession();
  const insets = useSafeAreaInsets();
  const [licenseUser, setLicenseUser] = useState<User | null>(null);
  const summary = getSummary();
  const myOpenReservations = getActionableReservations().length;
  const requesterDepartment = currentUser.areaDepartamento;
  const requesterCostCenter = currentUser.centroCusto;
  const requesterManagerName =
    users.find((user) => user.id === currentUser.gestorId)?.fullName ?? "Gestor não definido";
  const normalizedCnhStatus = currentUser.cnhStatus
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isLicenseValid = normalizedCnhStatus === "valida";
  const cnhStatusLabel = isLicenseValid ? "CNH válida" : "CNH vencida";

  const handleSignOut = async () => {
    const result = await signOut();

    if (!result.success && result.message) {
      Alert.alert("Falha ao encerrar sessao", result.message);
    }
  };

  const shortcuts = [
    {
      title: "Minhas reservas",
      description: "Acompanhe reservas e inicie a operação quando necessário.",
      icon: "bookmark",
      route: "/(tabs)/reservations",
      badge: myOpenReservations > 0 ? `${myOpenReservations} ativas` : undefined,
    },
    {
      title: "Frota",
      description: "Consulte disponibilidade, cadastro resumido e agenda dos veículos.",
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
      <LinearGradient
        colors={[colors.primaryDark, colors.green700]}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.row}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.headerTitle}>
            Reserva de Veículos
          </Text>
          <View style={styles.userBlock}>
            <Text style={styles.userName} numberOfLines={1}>
              {currentUserName}
            </Text>
            <View style={styles.divider} />
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => void handleSignOut()}
              style={styles.exitButton}
            >
              <Feather name="log-out" size={12} color={colors.white} />
              <Text style={styles.exitLabel}>Sair</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.bodyStack}>
        <View style={styles.tipInline}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={colors.primary} />
          <Text style={styles.tipText}>
            Use a agenda para escolher o veículo e reservar com menos etapas.
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <View style={styles.profileCopy}>
                <Text style={styles.profileName}>{currentUser.fullName}</Text>
                <Text style={styles.profileMeta}>
                  {currentUser.matricula} | {requesterDepartment}
                </Text>
              </View>
            </View>

            <Text style={styles.profileMeta}>
              Centro de custo: {requesterCostCenter} | Gestor: {requesterManagerName}
            </Text>

            <View style={styles.licenseInline}>
              <View
                style={[
                  styles.licenseStatusBadge,
                  isLicenseValid
                    ? styles.licenseStatusBadgeValid
                    : styles.licenseStatusBadgeExpired,
                ]}
              >
                <Text
                  style={[
                    styles.licenseStatusBadgeText,
                    isLicenseValid
                      ? styles.licenseStatusBadgeTextValid
                      : styles.licenseStatusBadgeTextExpired,
                  ]}
                >
                  {cnhStatusLabel}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.licenseAction,
                  !currentUser.cnhAnexo && styles.licenseActionDisabled,
                ]}
                onPress={() => setLicenseUser(currentUser)}
                disabled={!currentUser.cnhAnexo}
              >
                <Text
                  style={[
                    styles.licenseActionText,
                    !currentUser.cnhAnexo && styles.licenseActionTextDisabled,
                  ]}
                >
                  Ver CNH
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.primaryCard} onPress={() => router.push("/(tabs)/agenda")}>
            <View style={styles.primaryCardCopy}>
              <Text style={styles.primaryEyebrow}>Fluxo principal</Text>
              <Text style={styles.primaryTitle}>Reservar veículo</Text>
              <Text style={styles.primaryDescription}>
                Escolha o dia no calendário e siga para a reserva já com contexto preenchido.
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
      </View>

      <DriverLicensePreviewModal user={licenseUser} onClose={() => setLicenseUser(null)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userName: {
    color: "rgba(255,255,255,0.85)",
    fontSize: typography.tiny,
    fontWeight: "600",
    maxWidth: 110,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  exitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  exitLabel: {
    color: colors.white,
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  headerTitle: {
    flex: 1,
    color: colors.white,
    fontSize: typography.title,
    fontWeight: "800",
    lineHeight: 30,
  },
  bodyStack: {
    gap: spacing.lg,
    marginTop: -spacing.lg,
  },
  tipInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  tipText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
    flexShrink: 1,
  },
  content: {
    gap: spacing.lg,
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
  licenseInline: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  licenseStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  licenseStatusBadgeValid: {
    backgroundColor: colors.primarySoft,
  },
  licenseStatusBadgeExpired: {
    backgroundColor: `${colors.danger}12`,
  },
  licenseStatusBadgeText: {
    fontSize: typography.caption,
    fontWeight: "700",
  },
  licenseStatusBadgeTextValid: {
    color: colors.primaryDark,
  },
  licenseStatusBadgeTextExpired: {
    color: colors.danger,
  },
  licenseAction: {
    minHeight: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#C9DDC0",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  licenseActionDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  licenseActionText: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  licenseActionTextDisabled: {
    color: colors.textMuted,
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
