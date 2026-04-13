import { colors, spacing } from "@/theme";
import { PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useReservationStore } from "@/hooks/useReservationStore";

interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean;
  header?: ReactNode;
}

export function ScreenContainer({ children, scroll = true, header }: ScreenContainerProps) {
  const {
    isBackendConfigured,
    isRefreshing,
    isUsingCachedData,
    lastSyncedAt,
    syncError,
  } = useReservationStore();
  const statusMessage = !isBackendConfigured
    ? "Backend remoto nao configurado."
    : syncError
      ? isUsingCachedData
        ? "Exibindo cache local porque a sincronizacao remota falhou."
        : syncError
      : isRefreshing
        ? "Sincronizando dados com o backend..."
        : isUsingCachedData
          ? "Cache local carregado. Aguardando sincronizacao remota."
          : null;

  const content = (
    <View style={[styles.inner, !scroll && styles.innerFill]}>
      {header}
      {statusMessage ? (
        <View style={[styles.statusBanner, syncError ? styles.statusBannerWarning : styles.statusBannerInfo]}>
          {isRefreshing ? <ActivityIndicator size="small" color={colors.primaryDark} /> : null}
          <View style={styles.statusCopy}>
            <Text style={styles.statusText}>{statusMessage}</Text>
            {lastSyncedAt && !syncError ? (
              <Text style={styles.statusMeta}>Ultima sincronizacao: {new Date(lastSyncedAt).toLocaleString("pt-BR")}</Text>
            ) : null}
          </View>
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  innerFill: {
    flex: 1,
  },
  statusBanner: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  statusBannerInfo: {
    backgroundColor: colors.primarySoft,
  },
  statusBannerWarning: {
    backgroundColor: "#FFF4E8",
  },
  statusCopy: {
    flex: 1,
    gap: 2,
  },
  statusText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  statusMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
