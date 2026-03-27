import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Header, ScreenContainer, SectionTitle, StatusBadge } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, spacing, typography } from "@/theme";

export function AdminScreen() {
  const { resources, toggleResourceMaintenance } = useReservationStore();

  return (
    <ScreenContainer
      header={
        <Header eyebrow="Admin" title="Administração simples" subtitle="Visão inicial para escalabilidade, com ajuste visual do status operacional por recurso." />
      }
    >
      <SectionTitle title="Gestão de recursos" subtitle="Alteração local sem persistência externa" />
      <View style={styles.list}>
        {resources.map((resource) => (
          <Card key={resource.id}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={styles.title}>{resource.name}</Text>
                <Text style={styles.subtitle}>{resource.code} • {resource.location}</Text>
              </View>
              <StatusBadge status={resource.status} kind="resource" />
            </View>
            <Pressable style={styles.action} onPress={() => toggleResourceMaintenance(resource.id)}>
              <Feather name={resource.status === "Manutencao" ? "check-circle" : "tool"} size={16} color={colors.primaryDark} />
              <Text style={styles.actionLabel}>
                {resource.status === "Manutencao" ? "Marcar como ativo" : "Enviar para manutenção"}
              </Text>
            </Pressable>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  action: {
    marginTop: spacing.md,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  actionLabel: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
