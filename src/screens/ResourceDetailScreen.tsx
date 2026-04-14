import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BackHeaderButton,
  Card,
  EmptyState,
  PageHeader,
  PrimaryButton,
  ReservationCard,
  ScreenContainer,
  SecondaryButton,
  StatusBadge,
} from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, spacing, typography } from "@/theme";
import { canViewReservation } from "@/utils/authorization";
import { formatDateTime } from "@/utils/date";
import { getResourceReservationSnapshot } from "@/utils/reservations";

interface ResourceDetailScreenProps {
  resourceId: string;
}

export function ResourceDetailScreen({ resourceId }: ResourceDetailScreenProps) {
  const {
    resources,
    reservations,
    currentUser,
    currentUserPermissions,
    toggleResourceMaintenance,
    isMutating,
  } = useReservationStore();
  const [maintenanceFeedback, setMaintenanceFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
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

  const snapshot = getResourceReservationSnapshot(resource, reservations);
  const computedStatus = snapshot.resourceStatus;
  const relatedReservations = reservations
    .filter((reservation) => reservation.resourceId === resource.id)
    .filter((reservation) => canViewReservation(currentUser, reservation))
    .slice(0, 3);
  const nextReservation = snapshot.nextReservation;
  const canManageMaintenance =
    currentUserPermissions.canManageMaintenance && resource.category === "Veiculo";
  const isInMaintenance = computedStatus === "Manutencao";

  const handleToggleMaintenance = async () => {
    const result = await toggleResourceMaintenance(resource.id);
    setMaintenanceFeedback({
      tone: result.success ? "success" : "error",
      message: result.message,
    });
  };

  return (
    <ScreenContainer
      header={
        <PageHeader
          eyebrow={resource.vehicleCategory ?? resource.category}
          title={resource.name}
          leftAction={<BackHeaderButton />}
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
            <Text style={styles.metaValue}>Código da reserva: {nextReservation.code}</Text>
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

      {canManageMaintenance ? (
        <Card style={styles.maintenanceCard}>
          <Text style={styles.maintenanceTitle}>Manutenção do veículo</Text>
          <Text style={styles.maintenanceDescription}>
            {isInMaintenance
              ? "O veículo está bloqueado para reserva. Libere a manutenção quando ele voltar para operação."
              : "Use esta ação para bloquear o veículo para manutenção ou bloqueio operacional."}
          </Text>
          {maintenanceFeedback ? (
            <View
              style={[
                styles.feedbackBanner,
                maintenanceFeedback.tone === "success"
                  ? styles.feedbackSuccess
                  : styles.feedbackError,
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  maintenanceFeedback.tone === "success"
                    ? styles.feedbackTextSuccess
                    : styles.feedbackTextError,
                ]}
              >
                {maintenanceFeedback.message}
              </Text>
            </View>
          ) : null}
          <SecondaryButton
            label={isInMaintenance ? "Liberar manutenção" : "Colocar em manutenção"}
            onPress={() => {
              void handleToggleMaintenance();
            }}
            disabled={isMutating}
          />
        </Card>
      ) : null}

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
  maintenanceCard: {
    gap: spacing.sm,
  },
  maintenanceTitle: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: "800",
  },
  maintenanceDescription: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  feedbackBanner: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: "#F2FAF3",
    borderColor: "#B8DEC0",
  },
  feedbackError: {
    backgroundColor: "#FFF4F4",
    borderColor: "#F1C1C1",
  },
  feedbackText: {
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  feedbackTextSuccess: {
    color: colors.success,
  },
  feedbackTextError: {
    color: colors.danger,
  },
});


