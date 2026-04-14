import { router } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  BackHeaderButton,
  Card,
  EmptyState,
  PageHeader,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  SignatureField,
  StatusBadge,
} from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, spacing, typography } from "@/theme";
import {
  canCancelReservation,
  canExecuteReservationOperation,
  canViewReservation,
} from "@/utils/authorization";
import { formatDateTime } from "@/utils/date";
import {
  formatMileageValue,
  getAllOperationPhotos,
  getTravelDistance,
  requiredPhotoSlots,
} from "@/utils/operation";
import { isScheduledReservationActive } from "@/utils/reservations";
import type { ReservationInspection } from "@/types";

interface ReservationDetailScreenProps {
  reservationId: string;
}

export function ReservationDetailScreen({ reservationId }: ReservationDetailScreenProps) {
  const { reservations, resources, users, currentUser, cancelReservation, isMutating } =
    useReservationStore();
  const [feedback, setFeedback] = useState<string | null>(null);
  const reservation = reservations.find((item) => item.id === reservationId);

  const openOperation = (mode: "checkin" | "checkout") => {
    router.push({
      pathname: "/operation/[id]",
      params: { id: reservationId, mode },
    });
  };

  if (!reservation) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="alert-circle"
          title="Reserva não encontrada"
          description="A reserva solicitada não está disponível."
        />
      </ScreenContainer>
    );
  }

  if (!canViewReservation(currentUser, reservation)) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="lock"
          title="Acesso restrito"
          description="Esta reserva não está disponível para o seu perfil."
        />
      </ScreenContainer>
    );
  }

  const resource = resources.find((item) => item.id === reservation.resourceId);
  const requester = users.find((item) => item.id === reservation.userId);
  const canStartCheckIn =
    reservation.status === "Reservado" &&
    isScheduledReservationActive(reservation) &&
    canExecuteReservationOperation(currentUser, reservation);
  const canStartCheckOut =
    reservation.status === "Em uso" && canExecuteReservationOperation(currentUser, reservation);
  const canCancelCurrentReservation = canCancelReservation(currentUser, reservation);

  const handleCancelReservation = async () => {
    const result = await cancelReservation(reservation.id);
    setFeedback(result.message);
  };

  return (
    <ScreenContainer
      header={
        <PageHeader
          eyebrow={reservation.code}
          title="Detalhe da reserva"
          leftAction={<BackHeaderButton />}
        />
      }
    >
      <Card>
        <StatusBadge status={reservation.status} kind="reservation" />
        <Info label="Recurso" value={resource?.name ?? "Recurso não encontrado"} />
        <Info
          label="Período"
          value={`${formatDateTime(reservation.startDate)} até ${formatDateTime(reservation.endDate)}`}
        />
        {reservation.plannedDurationHours ? (
          <Info label="Duração planejada" value={`${reservation.plannedDurationHours} hora(s)`} />
        ) : null}
        <Info label="Finalidade" value={reservation.purpose} />
        <Info label="Base" value={reservation.base} />
        {requester ? (
          <Info
            label="Solicitante"
            value={`${requester.fullName} | ${requester.matricula} | ${requester.areaDepartamento} | CNH ${requester.cnhStatus}`}
          />
        ) : null}
        <Info label="Observações" value={reservation.notes || "Sem observações registradas."} />
        {reservation.checkInAt ? <Info label="Saída" value={formatDateTime(reservation.checkInAt)} /> : null}
        {reservation.checkOutAt ? <Info label="Devolução" value={formatDateTime(reservation.checkOutAt)} /> : null}
      </Card>

      {reservation.checkInData ? (
        <InspectionCard title="Vistoria de Saída" inspection={reservation.checkInData} />
      ) : null}

      {reservation.checkOutData ? (
        <InspectionCard
          title="Check-in de Devolução"
          inspection={reservation.checkOutData}
          distance={getTravelDistance(reservation.startMileage, reservation.endMileage)}
        />
      ) : null}

      {canStartCheckIn ? (
        <PrimaryButton label="Abrir vistoria de saída" onPress={() => openOperation("checkin")} />
      ) : null}

      {canStartCheckOut ? (
        <PrimaryButton label="Registrar devolução" onPress={() => openOperation("checkout")} />
      ) : null}

      {canCancelCurrentReservation ? (
        <SecondaryButton
          label={isMutating ? "Cancelando..." : "Cancelar reserva"}
          onPress={() => {
            void handleCancelReservation();
          }}
        />
      ) : null}

      {feedback ? (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Histórico</Text>
        <View style={styles.historyList}>
          {reservation.history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyDot} />
              <View style={styles.historyCopy}>
                <Text style={styles.historyLabel}>{item.label}</Text>
                <Text style={styles.historyMeta}>
                  {item.actor} • {formatDateTime(item.timestamp)}
                </Text>
                {item.note ? <Text style={styles.historyNote}>{item.note}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      </Card>
    </ScreenContainer>
  );
}

function InspectionCard({
  title,
  inspection,
  distance,
}: {
  title: string;
  inspection: ReservationInspection;
  distance?: number | null;
}) {
  const photos = getAllOperationPhotos(
    inspection.requiredPhotos,
    inspection.additionalPhotos,
    inspection.damagePhotos
  );

  return (
    <Card>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Info label="Data/Hora" value={formatDateTime(inspection.inspectedAt)} />
      <Info label="Inspecionado por" value={inspection.inspectedBy} />
      <Info label="Contraparte" value={inspection.counterpartyName} />
      <Info label="Quilometragem" value={formatMileageValue(inspection.mileage)} />
      {distance !== undefined ? (
        <Info label="Distância percorrida" value={distance !== null ? `${distance} km` : "Não calculada"} />
      ) : null}
      <Info label="Combustível" value={inspection.fuelLevel} />
      <Info
        label="Avarias"
        value={
          inspection.damageIdentified
            ? inspection.damageDescription || "Avaria identificada sem descrição."
            : "Nenhuma avaria observada"
        }
      />
      {inspection.notes ? <Info label="Observações" value={inspection.notes} /> : null}

      <View style={styles.photoSection}>
        <Text style={styles.photoSectionTitle}>Fotos da vistoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
          {requiredPhotoSlots.map(({ key, label }) => (
            <PhotoPreview key={key} label={label} uri={inspection.requiredPhotos[key]?.uri} />
          ))}
          {inspection.additionalPhotos.map((photo) => (
            <PhotoPreview key={photo.id} label="Adicional" uri={photo.uri} />
          ))}
          {inspection.damagePhotos.map((photo) => (
            <PhotoPreview key={photo.id} label="Avaria" uri={photo.uri} />
          ))}
        </ScrollView>
        <Text style={styles.photoCountText}>{photos.length} foto(s) registradas</Text>
      </View>

      <SignatureField
        value={inspection.signature}
        signerName={inspection.signature.signerName}
        onChange={() => undefined}
        readonly
      />
    </Card>
  );
}

function PhotoPreview({ label, uri }: { label: string; uri?: string }) {
  return (
    <View style={styles.photoPreview}>
      {uri ? <Image source={{ uri }} style={styles.photoPreviewImage} /> : <View style={styles.photoPreviewEmpty} />}
      <Text style={styles.photoPreviewLabel}>{label}</Text>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: "700",
  },
  infoRow: {
    marginTop: spacing.md,
    gap: spacing.xxs,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  historyList: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  historyItem: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primaryDark,
    marginTop: 6,
  },
  historyCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  historyLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  historyMeta: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  historyNote: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  feedback: {
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
  },
  feedbackText: {
    color: colors.primaryDark,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  photoSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  photoSectionTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  photoStrip: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  photoPreview: {
    width: 112,
    gap: spacing.xs,
  },
  photoPreviewImage: {
    width: 112,
    height: 84,
    borderRadius: radius.lg,
  },
  photoPreviewEmpty: {
    width: 112,
    height: 84,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoPreviewLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    textAlign: "center",
  },
  photoCountText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
});


