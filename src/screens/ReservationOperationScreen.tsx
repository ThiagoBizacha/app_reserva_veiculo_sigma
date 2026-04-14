import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { type ReactNode, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BackHeaderButton,
  EmptyState,
  OperationStepper,
  PageHeader,
  PhotoSlotCard,
  SignatureField,
} from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { formatDateTime } from "@/utils/date";
import { getCheckInRuleViolation, getCheckOutRuleViolation } from "@/utils/operationalRules";
import {
  formatMileageValue,
  fuelLevelOptions,
  getRequiredPhotoCount,
  getTravelDistance,
  hasSignature,
  parseMileageValue,
  requiredPhotoSlots,
} from "@/utils/operation";
import { canExecuteReservationOperation } from "@/utils/authorization";
import { getResourceById } from "@/utils/reservations";
import type {
  FuelLevel,
  OperationPhoto,
  OperationRequiredPhotos,
  OperationSignature,
  RequiredPhotoSlot,
  ReservationChecklist,
} from "@/types";

interface ReservationOperationScreenProps {
  reservationId: string;
  mode?: string;
}

type StepKey = "conditions" | "photos" | "confirm";

type PhotoTarget =
  | { kind: "required"; slot: RequiredPhotoSlot }
  | { kind: "additional" }
  | { kind: "damage" }
  | null;

const baseChecklist: ReservationChecklist = {
  vehicleClean: true,
  tankFull: true,
  documentsPresent: true,
  spareTireOk: true,
  damageReported: false,
};

const conditionItems: Array<{
  key: keyof ReservationChecklist;
  label: string;
}> = [
  { key: "vehicleClean", label: "Veículo limpo" },
  { key: "tankFull", label: "Tanque abastecido conforme vistoria" },
  { key: "documentsPresent", label: "Documentos presentes (CRLV / seguro)" },
  { key: "spareTireOk", label: "Estepe e itens obrigatórios conferidos" },
];

export function ReservationOperationScreen({
  reservationId,
  mode,
}: ReservationOperationScreenProps) {
  const {
    reservations,
    resources,
    users,
    currentUser,
    currentUserName,
    checkInReservation,
    checkOutReservation,
    isMutating,
  } = useReservationStore();
  const reservation = reservations.find((item) => item.id === reservationId);
  const resource = reservation ? getResourceById(resources, reservation.resourceId) : undefined;
  const requester = reservation ? users.find((item) => item.id === reservation.userId) : undefined;
  const resolvedMode = useMemo<"checkin" | "checkout">(() => {
    if (mode === "checkin" || mode === "checkout") {
      return mode;
    }

    return reservation?.status === "Em uso" ? "checkout" : "checkin";
  }, [mode, reservation?.status]);

  const existingInspection =
    resolvedMode === "checkin" ? reservation?.checkInData : reservation?.checkOutData;
  const [currentStep, setCurrentStep] = useState(0);
  const [checklist, setChecklist] = useState<ReservationChecklist>(
    existingInspection?.checklist ?? baseChecklist
  );
  const [mileage, setMileage] = useState(existingInspection?.mileage ?? "");
  const [fuelLevel, setFuelLevel] = useState<FuelLevel | null>(
    existingInspection?.fuelLevel ?? null
  );
  const [notes, setNotes] = useState(existingInspection?.notes ?? "");
  const [counterpartyName, setCounterpartyName] = useState(existingInspection?.counterpartyName ?? "");
  const [damageIdentified, setDamageIdentified] = useState(
    existingInspection?.damageIdentified ?? false
  );
  const [damageDescription, setDamageDescription] = useState(
    existingInspection?.damageDescription ?? ""
  );
  const [requiredPhotos, setRequiredPhotos] = useState<OperationRequiredPhotos>(
    existingInspection?.requiredPhotos ?? {}
  );
  const [additionalPhotos, setAdditionalPhotos] = useState<OperationPhoto[]>(
    existingInspection?.additionalPhotos ?? []
  );
  const [damagePhotos, setDamagePhotos] = useState<OperationPhoto[]>(
    existingInspection?.damagePhotos ?? []
  );
  const [signature, setSignature] = useState<OperationSignature | null>(
    existingInspection?.signature ?? null
  );
  const [confirmationChecked, setConfirmationChecked] = useState(
    existingInspection?.confirmationChecked ?? false
  );
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(
    null
  );
  const [photoTarget, setPhotoTarget] = useState<PhotoTarget>(null);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);

  const stepKeys: StepKey[] =
    resolvedMode === "checkin" ? ["conditions", "photos", "confirm"] : ["photos", "conditions", "confirm"];
  const activeStep = stepKeys[currentStep];
  const steps =
    resolvedMode === "checkin"
      ? ["Condições", "Fotos", "Confirmar"]
      : ["Fotos", "Condições", "Encerrar"];
  const title =
    resolvedMode === "checkin" ? "Vistoria de Saída" : "Check-in de Devolução";
  const operationViolation =
    reservation && resource
      ? resolvedMode === "checkin"
        ? getCheckInRuleViolation({
            reservation,
            resource,
            requester,
          })
        : getCheckOutRuleViolation({ reservation })
      : "A operacao solicitada nao esta disponivel.";
  const requiredPhotoCount = getRequiredPhotoCount(requiredPhotos);
  const startMileage = reservation?.startMileage;
  const travelDistance = getTravelDistance(startMileage, mileage);

  if (!reservation || !resource) {
    return (
      <View style={styles.emptyWrapper}>
        <EmptyState
          icon="alert-circle"
          title="Reserva não encontrada"
          description="A operação solicitada não está disponível."
        />
      </View>
    );
  }

  if (!canExecuteReservationOperation(currentUser, reservation)) {
    return (
      <View style={styles.emptyWrapper}>
        <EmptyState
          icon="lock"
          title="Operação restrita"
          description="Check-in e check-out ficam disponíveis apenas para Operação e Administrador."
        />
      </View>
    );
  }

  if (operationViolation) {
    return (
      <View style={styles.emptyWrapper}>
        <EmptyState
          icon="lock"
          title="Operação indisponível"
          description={operationViolation}
        />
      </View>
    );
  }

  const getStepWarning = () => {
    if (activeStep === "conditions") {
      if (!mileage.trim()) {
        return resolvedMode === "checkin"
          ? "Informe a quilometragem de saída para continuar."
          : "Informe a quilometragem de chegada para continuar.";
      }

      if (!fuelLevel) {
        return "Selecione o nível de combustível.";
      }

      if (!counterpartyName.trim()) {
        return resolvedMode === "checkin"
          ? "Informe quem entregou o veículo."
          : "Informe quem recebeu o veículo.";
      }

      if (resolvedMode === "checkout" && startMileage) {
        const parsedStart = parseMileageValue(startMileage);
        const parsedEnd = parseMileageValue(mileage);
        if (parsedStart !== null && parsedEnd !== null && parsedEnd < parsedStart) {
          return "A quilometragem final não pode ser menor que a quilometragem de saída.";
        }
      }

      if (damageIdentified && !damageDescription.trim()) {
        return "Descreva a avaria ou ocorrência para continuar.";
      }

      if (damageIdentified && damagePhotos.length === 0) {
        return "Adicione ao menos uma foto da avaria.";
      }

      return null;
    }

    if (activeStep === "confirm") {
      if (!confirmationChecked) {
        return "Confirme a vistoria para concluir.";
      }

      if (!hasSignature(signature)) {
        return "A assinatura digital é obrigatória para concluir.";
      }
    }

    return null;
  };

  const stepWarning = getStepWarning();
  const footerNotice = feedback ?? (stepWarning ? { type: "error" as const, message: stepWarning } : null);

  const handlePrimaryAction = async () => {
    if (stepWarning) {
      setFeedback({ type: "error", message: stepWarning });
      return;
    }

    if (currentStep < stepKeys.length - 1) {
      setFeedback(null);
      setCurrentStep((value) => value + 1);
      return;
    }

    if (!fuelLevel || !signature) {
      setFeedback({
        type: "error",
        message: "Preencha combustível e assinatura antes de finalizar.",
      });
      return;
    }

    const payload = {
      mileage,
      fuelLevel,
      checklist: { ...checklist, damageReported: damageIdentified },
      notes,
      requiredPhotos,
      additionalPhotos,
      damagePhotos,
      damageIdentified,
      damageDescription,
      confirmationChecked,
      signature,
      counterpartyName,
    };

    const result = await (
      resolvedMode === "checkin"
        ? checkInReservation(reservation.id, payload)
        : checkOutReservation(reservation.id, payload)
    );

    setFeedback({ type: result.success ? "success" : "error", message: result.message });

    if (result.success) {
      setTimeout(() => {
        router.replace({
          pathname: "/reservation/[id]",
          params: { id: reservation.id },
        });
      }, 500);
    }
  };

  const handleBackAction = () => {
    if (currentStep === 0) {
      router.back();
      return;
    }

    setFeedback(null);
    setCurrentStep((value) => value - 1);
  };

  const openPhotoTarget = (target: PhotoTarget) => {
    setPhotoTarget(target);
    setIsPhotoModalVisible(true);
  };

  const savePhoto = (photo: OperationPhoto) => {
    if (!photoTarget) {
      return;
    }

    if (photoTarget.kind === "required") {
      setRequiredPhotos((current) => ({ ...current, [photoTarget.slot]: photo }));
      return;
    }

    if (photoTarget.kind === "additional") {
      setAdditionalPhotos((current) => [...current, photo]);
      return;
    }

    setDamagePhotos((current) => [...current, photo]);
  };

  const handlePickImage = async (source: "camera" | "library") => {
    setIsPhotoModalVisible(false);

    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setFeedback({
            type: "error",
            message: "Permita o acesso à câmera para registrar a vistoria.",
          });
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setFeedback({
            type: "error",
            message: "Permita o acesso às fotos para anexar imagens da vistoria.",
          });
          return;
        }
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.7,
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
            })
          : await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              quality: 0.7,
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
            });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      savePhoto({
        id: `photo-${Date.now()}`,
        uri: asset.uri,
        capturedAt: new Date().toISOString(),
      });
      setFeedback(null);
    } catch {
      setFeedback({
        type: "error",
        message: "Não foi possível anexar a foto da vistoria.",
      });
    }
  };

  const removePhoto = (kind: "additional" | "damage", photoId: string) => {
    if (kind === "additional") {
      setAdditionalPhotos((current) => current.filter((photo) => photo.id !== photoId));
      return;
    }

    setDamagePhotos((current) => current.filter((photo) => photo.id !== photoId));
  };

  const renderVehicleBanner = () => (
    <View style={styles.vehicleBanner}>
      <View style={styles.vehicleBannerIcon}>
        <Feather name="truck" size={26} color={colors.white} />
      </View>
      <View style={styles.vehicleBannerCopy}>
        <Text style={styles.vehicleBannerTitle}>{resource.name}</Text>
        <Text style={styles.vehicleBannerMeta}>
          {resource.plate ?? resource.code} | {resource.brand ?? "-"} {resource.model ?? ""} | Saída {formatDateTime(reservation.startDate)}
        </Text>
        <Text style={styles.vehicleBannerMeta}>
          {resolvedMode === "checkin"
            ? `Previsão de devolução ${formatDateTime(reservation.endDate)}`
            : `Devolução registrada em ${formatDateTime(new Date())}`}
        </Text>
        <Text style={styles.vehicleBannerMeta}>
          {resource.rentalCompany ?? "-"} | Km {resource.currentMileage ?? "-"}
        </Text>
      </View>
    </View>
  );

  const renderChecklist = () => (
    <Section title="Condições do veículo">
      {conditionItems.map((item) => (
        <Pressable
          key={item.key}
          style={styles.checkItem}
          onPress={() =>
            setChecklist((current) => ({ ...current, [item.key]: !current[item.key] }))
          }
        >
          <Feather
            name={checklist[item.key] ? "check-square" : "square"}
            size={22}
            color={checklist[item.key] ? colors.primaryDark : colors.textMuted}
          />
          <Text style={styles.checkLabel}>{item.label}</Text>
        </Pressable>
      ))}
    </Section>
  );

  const renderFuelSelector = () => (
    <Section title="Combustível">
      <Text style={styles.fieldLabel}>
        {resolvedMode === "checkin"
          ? "Nível de combustível na saída"
          : "Nível de combustível na devolução"}
      </Text>
      <View style={styles.fuelRow}>
        {fuelLevelOptions.map((option) => {
          const isActive = fuelLevel === option;
          const optionStyle =
            option === "Vazio"
              ? styles.fuelChipVazio
              : option === "1/4"
                ? styles.fuelChip14
                : option === "1/2"
                  ? styles.fuelChip12
                  : option === "3/4"
                    ? styles.fuelChip34
                    : styles.fuelChipCheio;

          return (
            <Pressable
              key={option}
              style={[styles.fuelChip, optionStyle, isActive && styles.fuelChipActive]}
              onPress={() => setFuelLevel(option)}
            >
              <Text style={[styles.fuelChipText, isActive && styles.fuelChipTextActive]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );

  const renderDamageSection = () => (
    <Section title="Avarias e ocorrências">
      <Pressable
        style={styles.choiceRow}
        onPress={() => {
          setDamageIdentified(false);
          setDamageDescription("");
          setDamagePhotos([]);
        }}
      >
        <Feather
          name={!damageIdentified ? "check-square" : "square"}
          size={22}
          color={!damageIdentified ? colors.primaryDark : colors.textMuted}
        />
        <Text style={styles.choiceText}>Nenhuma avaria observada</Text>
      </Pressable>

      <Pressable style={styles.choiceRow} onPress={() => setDamageIdentified(true)}>
        <Feather
          name={damageIdentified ? "x-square" : "square"}
          size={22}
          color={damageIdentified ? colors.warning : colors.textMuted}
        />
        <Text style={[styles.choiceText, damageIdentified && styles.choiceTextWarning]}>
          Avaria identificada
        </Text>
      </Pressable>

      {damageIdentified ? (
        <>
          <TextInput
            value={damageDescription}
            onChangeText={setDamageDescription}
            placeholder="Descreva a avaria, local e contexto da ocorrência."
            placeholderTextColor={colors.textMuted}
            multiline
            style={[styles.input, styles.notesInput, styles.damageInput]}
          />
          <Text style={styles.fieldLabel}>Fotos da avaria</Text>
          <Pressable
            style={styles.addPhotoButton}
            onPress={() => openPhotoTarget({ kind: "damage" })}
          >
            <Feather name="camera" size={18} color={colors.textSecondary} />
            <Text style={styles.addPhotoButtonText}>Adicionar foto da avaria</Text>
          </Pressable>
          <PhotoStrip photos={damagePhotos} onRemove={(photoId) => removePhoto("damage", photoId)} />
        </>
      ) : null}
    </Section>
  );

  const renderConditionsContent = () => (
    <>
      <Section title={resolvedMode === "checkin" ? "Horímetro inicial" : "Horímetro final"}>
        <Text style={styles.fieldLabel}>
          {resolvedMode === "checkin"
            ? "Km/Horímetro de saída"
            : "Km/Horímetro de chegada"}
        </Text>
        <TextInput
          value={mileage}
          onChangeText={setMileage}
          placeholder={resolvedMode === "checkin" ? "Ex.: 45.230 km" : "Ex.: 45.847 km"}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        {resolvedMode === "checkout" && startMileage ? (
          <Text style={styles.helperText}>
            Saída: {formatMileageValue(startMileage)}
            {travelDistance !== null ? ` | Percorrido: ${travelDistance} km` : ""}
          </Text>
        ) : null}
      </Section>

      {renderFuelSelector()}
      {renderChecklist()}
      {renderDamageSection()}

      <Section title={resolvedMode === "checkin" ? "Entrega do veículo" : "Confirmação operacional"}>
        <Text style={styles.fieldLabel}>
          {resolvedMode === "checkin" ? "Entregue por" : "Recebido por"}
        </Text>
        <TextInput
          value={counterpartyName}
          onChangeText={setCounterpartyName}
          placeholder={
            resolvedMode === "checkin"
              ? "Nome de quem entregou o veículo"
              : "Nome de quem recebeu o veículo"
          }
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Observações adicionais da vistoria."
          placeholderTextColor={colors.textMuted}
          multiline
          style={[styles.input, styles.notesInput]}
        />
      </Section>
    </>
  );

  const renderPhotosContent = () => (
    <>
      <View style={styles.photosIntro}>
        <Text style={styles.photosIntroText}>Fotos do veículo são opcionais nesta demo.</Text>
      </View>

      <View style={styles.photoGrid}>
        {requiredPhotoSlots.map(({ key, label }) => (
          <PhotoSlotCard
            key={key}
            label={label}
            photoUri={requiredPhotos[key]?.uri}
            helperText="Opcional"
            onPress={() => openPhotoTarget({ kind: "required", slot: key })}
          />
        ))}
      </View>

      <Section title="Fotos adicionais (opcional)">
        <Pressable
          style={styles.addPhotoButton}
          onPress={() => openPhotoTarget({ kind: "additional" })}
        >
          <Feather name="camera" size={18} color={colors.textSecondary} />
          <Text style={styles.addPhotoButtonText}>Adicionar fotos de detalhes ou contexto</Text>
        </Pressable>
        <PhotoStrip
          photos={additionalPhotos}
          onRemove={(photoId) => removePhoto("additional", photoId)}
        />
      </Section>
    </>
  );

  const renderConfirmContent = () => (
    <>
      <Section title="Resumo da vistoria">
        <View style={styles.summaryCard}>
          <SummaryRow label="Reserva" value={reservation.code} />
          <SummaryRow label="Veículo" value={resource.name} />
          <SummaryRow label="Quilometragem" value={formatMileageValue(mileage)} />
          <SummaryRow label="Combustível" value={fuelLevel ?? "-"} />
          <SummaryRow
            label={resolvedMode === "checkin" ? "Entregue por" : "Recebido por"}
            value={counterpartyName || "-"}
          />
          <SummaryRow label="Fotos registradas" value={`${requiredPhotoCount}/4`} />
          <SummaryRow
            label="Avarias"
            value={damageIdentified ? "Identificada" : "Nenhuma ocorrência"}
          />
        </View>
      </Section>

      <Section title="Confirmação">
        <Pressable
          style={styles.choiceRow}
          onPress={() => setConfirmationChecked((value) => !value)}
        >
          <Feather
            name={confirmationChecked ? "check-square" : "square"}
            size={22}
            color={confirmationChecked ? colors.primaryDark : colors.textMuted}
          />
          <Text style={[styles.choiceText, styles.choiceTextStrong]}>
            {resolvedMode === "checkin"
              ? "Confirmo a saída do veículo nas condições descritas"
              : "Confirmo a devolução do veículo nas condições descritas"}
          </Text>
        </Pressable>

        <View style={styles.metaList}>
          <MetaRow
            icon="user"
            label={resolvedMode === "checkin" ? "Condutor" : "Recebido por"}
            value={resolvedMode === "checkin" ? currentUserName : counterpartyName || "-"}
          />
          <MetaRow icon="clock" label="Data/Hora" value={formatDateTime(new Date())} />
        </View>
      </Section>

      <Section title="Assinatura">
        <SignatureField value={signature} signerName={currentUserName} onChange={setSignature} />
      </Section>
    </>
  );

  const renderStepContent = () => {
    if (activeStep === "conditions") {
      return renderConditionsContent();
    }

    if (activeStep === "photos") {
      return renderPhotosContent();
    }

    return renderConfirmContent();
  };

  const primaryLabel =
    currentStep === stepKeys.length - 1
      ? resolvedMode === "checkin"
        ? "Confirmar Saída"
        : "Encerrar Reserva"
      : currentStep === 1 && resolvedMode === "checkin"
        ? "Próximo: Confirmar"
        : "Próximo";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerFrame}>
        <PageHeader
          eyebrow={reservation.code}
          title={title}
          leftAction={<BackHeaderButton />}
        />
      </View>

      <View style={styles.stepperContainer}>
        <OperationStepper steps={steps} currentStep={currentStep} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {renderVehicleBanner()}
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footerStack}>
        {footerNotice ? (
          <View
            style={[
              styles.feedback,
              styles.footerFeedback,
              footerNotice.type === "error" ? styles.feedbackWarning : styles.feedbackSuccess,
            ]}
          >
            <Feather
              name={footerNotice.type === "error" ? "alert-triangle" : "check-circle"}
              size={18}
              color={footerNotice.type === "error" ? colors.warning : colors.success}
            />
            <Text
              style={[
                styles.feedbackText,
                footerNotice.type === "error"
                  ? styles.feedbackWarningText
                  : styles.feedbackSuccessText,
              ]}
            >
              {footerNotice.message}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Pressable style={styles.secondaryFooterAction} onPress={handleBackAction}>
            <Text style={styles.secondaryFooterActionText}>Voltar</Text>
          </Pressable>
          <Pressable
            style={[
              styles.primaryFooterAction,
              (stepWarning || isMutating) && styles.primaryFooterActionDisabled,
            ]}
            onPress={() => {
              void handlePrimaryAction();
            }}
            disabled={Boolean(stepWarning) || isMutating}
          >
            <Text style={styles.primaryFooterActionText}>
              {isMutating ? "Salvando..." : primaryLabel}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={isPhotoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adicionar foto</Text>
            <Pressable style={styles.modalAction} onPress={() => void handlePickImage("camera")}>
              <Feather name="camera" size={18} color={colors.primaryDark} />
              <Text style={styles.modalActionText}>Usar câmera</Text>
            </Pressable>
            <Pressable style={styles.modalAction} onPress={() => void handlePickImage("library")}>
              <Feather name="image" size={18} color={colors.primaryDark} />
              <Text style={styles.modalActionText}>Escolher da galeria</Text>
            </Pressable>
            <Pressable style={styles.modalCancel} onPress={() => setIsPhotoModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionBar} />
      <View style={styles.sectionContent}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      <Feather name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.metaText}>
        {label}: {value}
      </Text>
    </View>
  );
}

function PhotoStrip({
  photos,
  onRemove,
}: {
  photos: OperationPhoto[];
  onRemove: (photoId: string) => void;
}) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
      {photos.map((photo) => (
        <View key={photo.id} style={styles.photoThumbWrapper}>
          <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
          <Pressable style={styles.photoRemove} onPress={() => onRemove(photo.id)}>
            <Feather name="x" size={12} color={colors.white} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerFrame: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  emptyWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  headerMeta: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  headerCode: {
    color: colors.white,
    fontSize: typography.body,
  },
  stepperContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  vehicleBanner: {
    borderRadius: radius.xl,
    backgroundColor: colors.primaryDark,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    ...shadows.card,
  },
  vehicleBannerIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleBannerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  vehicleBannerTitle: {
    color: colors.white,
    fontSize: typography.cardTitle,
    fontWeight: "700",
  },
  vehicleBannerMeta: {
    color: colors.primarySoft,
    fontSize: typography.bodySmall,
  },
  section: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  sectionBar: {
    width: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
  },
  sectionContent: {
    flex: 1,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.primaryDark,
    fontSize: typography.section,
    fontWeight: "700",
  },
  fieldLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.body,
  },
  notesInput: {
    minHeight: 104,
    paddingTop: spacing.sm,
    textAlignVertical: "top",
  },
  damageInput: {
    borderColor: colors.warning,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  fuelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  fuelChip: {
    minWidth: 68,
    minHeight: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  fuelChipVazio: {
    backgroundColor: "#F35B5B",
  },
  fuelChip14: {
    backgroundColor: "#FFA543",
  },
  fuelChip12: {
    backgroundColor: "#FFD75A",
  },
  fuelChip34: {
    backgroundColor: "#B8E273",
  },
  fuelChipCheio: {
    backgroundColor: colors.primaryDark,
  },
  fuelChipActive: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  fuelChipText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  fuelChipTextActive: {
    color: colors.white,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkLabel: {
    color: colors.text,
    fontSize: typography.body,
    flex: 1,
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  choiceText: {
    color: colors.text,
    fontSize: typography.body,
    flex: 1,
  },
  choiceTextWarning: {
    color: colors.warning,
    fontWeight: "700",
  },
  choiceTextStrong: {
    fontWeight: "700",
  },
  photosIntro: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photosIntroText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    fontStyle: "italic",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  addPhotoButton: {
    minHeight: 52,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  addPhotoButtonText: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  photoStrip: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  photoThumbWrapper: {
    position: "relative",
  },
  photoThumb: {
    width: 92,
    height: 92,
    borderRadius: radius.lg,
  },
  photoRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.bodySmall,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  metaList: {
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaText: {
    color: colors.text,
    fontSize: typography.body,
    flex: 1,
  },
  feedback: {
    minHeight: 56,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  feedbackWarning: {
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#F3C766",
  },
  feedbackSuccess: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.success,
  },
  feedbackText: {
    fontSize: typography.body,
    flex: 1,
  },
  feedbackWarningText: {
    color: "#8A5A00",
  },
  feedbackSuccessText: {
    color: colors.primaryDark,
  },
  footerStack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: spacing.xs,
  },
  footerFeedback: {
    marginHorizontal: spacing.lg,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
  },
  secondaryFooterAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  secondaryFooterActionText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: "700",
  },
  primaryFooterAction: {
    flex: 1.6,
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryFooterActionDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryFooterActionText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  modalAction: {
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  modalActionText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  modalCancel: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: "700",
  },
});


