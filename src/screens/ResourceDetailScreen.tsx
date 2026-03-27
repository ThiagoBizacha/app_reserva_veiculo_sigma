import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Header, PrimaryButton, ReservationCard, ScreenContainer, StatusBadge } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, spacing, typography } from "@/theme";
import { formatDateTime } from "@/utils/date";

interface ResourceDetailScreenProps {
  resourceId: string;
}

export function ResourceDetailScreen({ resourceId }: ResourceDetailScreenProps) {
  const { resources, reservations } = useReservationStore();
  const resource = resources.find((item) => item.id === resourceId);

  if (!resource) {
    return (
      <ScreenContainer>
        <Text>Recurso não encontrado.</Text>
      </ScreenContainer>
    );
  }

  const relatedReservations = reservations.filter((reservation) => reservation.resourceId === resource.id).slice(0, 3);

  return (
    <ScreenContainer header={<Header eyebrow={resource.category} title={resource.name} subtitle={`${resource.code} • ${resource.location}`} />}>
      <Card>
        <View style={styles.mainRow}>
          <StatusBadge status={resource.status} kind="resource" />
          <Text style={styles.description}>{resource.description}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>Responsável</Text>
          <Text style={styles.metaValue}>{resource.responsible}</Text>
        </View>
        {resource.nextAvailableAt ? (
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Próxima disponibilidade</Text>
            <Text style={styles.metaValue}>{formatDateTime(resource.nextAvailableAt)}</Text>
          </View>
        ) : null}
        <View style={styles.tags}>
          {resource.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagLabel}>{tag}</Text>
            </View>
          ))}
        </View>
      </Card>

      <PrimaryButton label="Reservar este recurso" onPress={() => router.push(`/reservation/new?resourceId=${resource.id}`)} />

      <View style={styles.list}>
        {relatedReservations.map((reservation) => (
          <Pressable key={reservation.id} onPress={() => router.push(`/reservation/${reservation.id}`)}>
            <ReservationCard reservation={reservation} resource={resource} />
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mainRow: {
    gap: spacing.md,
  },
  description: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  meta: {
    marginTop: spacing.md,
    gap: spacing.xxs,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  metaValue: {
    color: colors.text,
    fontSize: typography.body,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  tagLabel: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  list: {
    gap: spacing.md,
  },
});
