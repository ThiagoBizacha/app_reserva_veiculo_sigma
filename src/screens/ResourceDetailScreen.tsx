import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Card,
  EmptyState,
  ExitHeaderButton,
  Header,
  PrimaryButton,
  ReservationCard,
  ScreenContainer,
  StatusBadge,
} from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, spacing, typography } from "@/theme";
import { formatDateTime } from "@/utils/date";
import { getNextReservation } from "@/utils/reservations";

interface ResourceDetailScreenProps {
  resourceId: string;
}

export function ResourceDetailScreen({ resourceId }: ResourceDetailScreenProps) {
  const { resources, reservations, getResourceStatus } = useReservationStore();
  const resource = resources.find((item) => item.id === resourceId);

  if (!resource) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="alert-circle"
          title="Recurso não encontrado"
          description="Não foi possível localizar o veículo solicitado."
        />
      </ScreenContainer>
    );
  }

  const computedStatus = getResourceStatus(resource.id);
  const relatedReservations = reservations
    .filter((reservation) => reservation.resourceId === resource.id)
    .slice(0, 3);
  const nextReservation = getNextReservation(resource, reservations);

  return (
    <ScreenContainer
      header={
        <Header
          eyebrow={resource.vehicleCategory ?? resource.category}
          title={resource.name}
          rightContent={<ExitHeaderButton />}
          subtitle={`${resource.plate ?? resource.code} | ${resource.rentalCompany ?? "Frota"}`}
        />
      }
    >
      <Card>
        <View style={styles.mainRow}>
          <StatusBadge status={computedStatus} kind="resource" />
          <Text style={styles.description}>{resource.description}</Text>
        </View>

        <MetaBlock label="Cadastro do veículo">
          <Text style={styles.metaValue}>
            Placa {resource.plate ?? "-"} | Marca {resource.brand ?? "-"} | Modelo {resource.model ?? "-"}
          </Text>
          <Text style={styles.metaValue}>
            Ano {resource.year ?? "-"} | Locadora {resource.rentalCompany ?? "-"} | Categoria{" "}
            {resource.vehicleCategory ?? "-"}
          </Text>
          <Text style={styles.metaValue}>Km atual {resource.currentMileage ?? "-"}</Text>
        </MetaBlock>

        <MetaBlock label="Operação">
          {resource.observation ? <Text style={styles.metaValue}>{resource.observation}</Text> : null}
        </MetaBlock>

        <MetaBlock label="Vistoria e manutenção">
          <Text style={styles.metaValue}>
            Última vistoria {resource.lastInspectionDate ? formatDateTime(resource.lastInspectionDate) : "-"}
          </Text>
          <Text style={styles.metaValue}>
            Última manutenção {resource.lastMaintenanceDate ? formatDateTime(resource.lastMaintenanceDate) : "-"} | Km{" "}
            {resource.lastMaintenanceMileage ?? "-"}
          </Text>
          <Text style={styles.metaValue}>
            Próxima manutenção {resource.nextMaintenanceDate ? formatDateTime(resource.nextMaintenanceDate) : "-"} | Km{" "}
            {resource.nextMaintenanceMileage ?? "-"}
          </Text>
        </MetaBlock>

        <MetaBlock label="Anexos mockados">
          <Text style={styles.metaValue}>Documento {resource.vehicleDocumentAttachment ?? "-"}</Text>
          <Text style={styles.metaValue}>
            Fotos {(resource.vehiclePhotoAttachments ?? []).join(", ") || "-"}
          </Text>
        </MetaBlock>

        {nextReservation ? (
          <MetaBlock label="Próxima reserva">
            <Text style={styles.metaValue}>
              {formatDateTime(nextReservation.startDate)} até {formatDateTime(nextReservation.endDate)}
            </Text>
          </MetaBlock>
        ) : null}

        <View style={styles.tags}>
          {resource.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagLabel}>{tag}</Text>
            </View>
          ))}
        </View>
      </Card>

      <PrimaryButton
        label="Ver agenda do veículo"
        onPress={() =>
          router.push({ pathname: "/(tabs)/agenda", params: { resourceId: resource.id } })
        }
      />
      <PrimaryButton
        label="Reservar este veículo"
        onPress={() =>
          router.push({ pathname: "/reservation/new", params: { resourceId: resource.id } })
        }
      />

      <View style={styles.list}>
        {relatedReservations.map((reservation) => (
          <Pressable
            key={reservation.id}
            onPress={() => router.push({ pathname: "/reservation/[id]", params: { id: reservation.id } })}
          >
            <ReservationCard reservation={reservation} resource={resource} />
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

function MetaBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <View style={styles.metaContent}>{children}</View>
    </View>
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
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  metaContent: {
    gap: spacing.xxs,
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


