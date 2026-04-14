import { Feather } from "@expo/vector-icons";
import { File as ExpoFile } from "expo-file-system";
import { type ReactNode, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Card,
  FormField,
  MetricCard,
  PageHeader,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
} from "@/components";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { getUserDisplayName } from "@/utils/users";
import type {
  CnhStatus,
  NewUserPayload,
  NewVehiclePayload,
  Resource,
  User,
  UserRole,
  VehicleCategory,
} from "@/types";

type FeedbackState = {
  tone: "success" | "error";
  message: string;
};

const vehicleCategories: VehicleCategory[] = ["Sedan", "SUV", "Pickup"];
const userRoles: UserRole[] = ["Solicitante", "Operação", "Administrador"];
const cnhStatuses: CnhStatus[] = ["Válida", "Vencida"];

const emptyVehicleForm: NewVehiclePayload = {
  name: "",
  code: "",
  plate: "",
  brand: "",
  model: "",
  year: "",
  vehicleCategory: "SUV",
  currentMileage: "",
  description: "",
  rentalCompany: "",
  vehicleDocumentAttachment: "",
  nextMaintenanceDate: "",
  nextMaintenanceMileage: "",
  observation: "",
};

function buildInitialUserForm(matriz: string, gestorId?: string): NewUserPayload {
  return {
    name: "",
    fullName: "",
    cpf: "",
    matricula: "",
    role: "Solicitante",
    areaDepartamento: "",
    centroCusto: "",
    emailCorporativo: "",
    telefone: "",
    cnhNumero: "",
    cnhCategoria: "B",
    cnhUfEmissao: "MG",
    cnhStatus: "Válida",
    matriz,
    gestorId,
    cnhAnexo: "",
    observacao: "",
  };
}

function mapVehicleToForm(resource: Resource): NewVehiclePayload {
  return {
    name: resource.name,
    code: resource.code,
    plate: resource.plate ?? "",
    brand: resource.brand ?? "",
    model: resource.model ?? "",
    year: resource.year ?? "",
    vehicleCategory: resource.vehicleCategory ?? "SUV",
    currentMileage: resource.currentMileage ?? "",
    description: resource.description,
    rentalCompany: resource.rentalCompany ?? "",
    vehicleDocumentAttachment: resource.vehicleDocumentAttachment ?? "",
    nextMaintenanceDate: resource.nextMaintenanceDate ?? "",
    nextMaintenanceMileage: resource.nextMaintenanceMileage ?? "",
    observation: resource.observation ?? "",
  };
}

function mapUserToForm(user: User, users: User[]): NewUserPayload {
  return {
    name: user.name,
    fullName: user.fullName,
    cpf: user.cpf,
    matricula: user.matricula,
    role: user.role,
    areaDepartamento: user.areaDepartamento,
    centroCusto: user.centroCusto,
    emailCorporativo: user.emailCorporativo,
    telefone: user.telefone,
    cnhNumero: user.cnhNumero,
    cnhCategoria: user.cnhCategoria,
    cnhUfEmissao: user.cnhUfEmissao,
    cnhStatus: normalizeCnhStatus(user.cnhStatus),
    matriz: user.matriz,
    gestorId: getUserDisplayName(users, user.gestorId),
    cnhAnexo: user.cnhAnexo,
    observacao: user.observacao ?? "",
  };
}

type PillTone = "success" | "danger" | "warning" | "neutral";

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function normalizeCnhStatus(status: string): CnhStatus {
  return normalizeText(status) === "valida" ? "Válida" : "Vencida";
}

function getVehicleStatusLabel(status: Resource["status"]) {
  switch (status) {
    case "Disponivel":
      return "Disponível";
    case "Manutencao":
      return "Manutenção";
    default:
      return status;
  }
}

function getVehicleStatusTone(status: Resource["status"]): PillTone {
  switch (status) {
    case "Disponivel":
      return "success";
    case "Em uso":
    case "Reservado":
      return "warning";
    case "Manutencao":
      return "danger";
    default:
      return "neutral";
  }
}

function getCnhStatusLabel(status: string) {
  return normalizeText(status) === "valida" ? "CNH válida" : "CNH vencida";
}

function getCnhStatusTone(status: string): PillTone {
  return normalizeText(status) === "valida" ? "success" : "danger";
}

interface ChoiceGroupProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  helper?: string;
}

function ChoiceGroup({ label, value, options, onChange, helper }: ChoiceGroupProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => {
          const active = option === value;

          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[styles.choiceChip, active && styles.choiceChipActive]}
            >
              <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {helper ? <Text style={styles.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

function FeedbackBanner({ feedback }: { feedback: FeedbackState }) {
  return (
    <View
      style={[
        styles.feedbackBanner,
        feedback.tone === "success" ? styles.feedbackSuccess : styles.feedbackError,
      ]}
    >
      <Text
        style={[
          styles.feedbackText,
          feedback.tone === "success" ? styles.feedbackTextSuccess : styles.feedbackTextError,
        ]}
      >
        {feedback.message}
      </Text>
    </View>
  );
}

function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  return (
    <View
      style={[
        styles.statusPill,
        tone === "success" && styles.statusPillSuccess,
        tone === "danger" && styles.statusPillDanger,
        tone === "warning" && styles.statusPillWarning,
        tone === "neutral" && styles.statusPillNeutral,
      ]}
    >
      <Text
        style={[
          styles.statusPillText,
          tone === "success" && styles.statusPillTextSuccess,
          tone === "danger" && styles.statusPillTextDanger,
          tone === "warning" && styles.statusPillTextWarning,
          tone === "neutral" && styles.statusPillTextNeutral,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

interface FormModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}

function FormModal({ visible, title, subtitle, onClose, children }: FormModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>{subtitle}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalContent}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface SettingsActionCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  helper: string;
  buttonLabel: string;
  onPress: () => void;
  secondaryButtonLabel?: string;
  onSecondaryPress?: () => void;
  feedback?: FeedbackState | null;
  children?: ReactNode;
}

function SettingsActionCard({
  icon,
  title,
  subtitle,
  helper,
  buttonLabel,
  onPress,
  secondaryButtonLabel,
  onSecondaryPress,
  feedback,
  children,
}: SettingsActionCardProps) {
  return (
    <Card style={styles.actionCard}>
      <View style={styles.actionCardTopRow}>
        <View style={styles.actionIconBadge}>
          <Feather name={icon} size={20} color={colors.primaryDark} />
        </View>
        <Text style={styles.actionHelper}>{helper}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.actionButtonsStack}>
        <PrimaryButton label={buttonLabel} onPress={onPress} />
        {secondaryButtonLabel && onSecondaryPress ? (
          <SecondaryButton label={secondaryButtonLabel} onPress={onSecondaryPress} />
        ) : null}
      </View>
      {feedback ? <FeedbackBanner feedback={feedback} /> : null}
      {children ? <View style={styles.expandableSection}>{children}</View> : null}
    </Card>
  );
}

interface CatalogItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  meta: string;
  badgeLabel: string;
  badgeTone: PillTone;
  onPress: () => void;
}

function CatalogItem({
  icon,
  title,
  subtitle,
  meta,
  badgeLabel,
  badgeTone,
  onPress,
}: CatalogItemProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.catalogItem, pressed && styles.catalogItemPressed]}>
      <View style={styles.catalogItemIcon}>
        <Feather name={icon} size={18} color={colors.primaryDark} />
      </View>
      <View style={styles.catalogItemCopy}>
        <View style={styles.catalogItemTitleRow}>
          <Text style={styles.catalogItemTitle}>{title}</Text>
          <StatusPill label={badgeLabel} tone={badgeTone} />
        </View>
        <Text style={styles.catalogItemSubtitle}>{subtitle}</Text>
        <Text style={styles.catalogItemMeta}>{meta}</Text>
      </View>
      <View style={styles.catalogItemAction}>
        <Text style={styles.catalogItemActionText}>Editar</Text>
        <Feather name="chevron-right" size={18} color={colors.primaryDark} />
      </View>
    </Pressable>
  );
}

interface AttachmentFieldProps {
  label: string;
  value?: string;
  helper?: string;
  onPick: () => void;
  onClear: () => void;
}

function getAttachmentLabel(value?: string) {
  if (!value) {
    return "Nenhum documento anexado";
  }

  const normalizedValue = value.replace(/\\/g, "/");
  const parts = normalizedValue.split("/");
  return parts[parts.length - 1] || value;
}

function AttachmentField({ label, value, helper, onPick, onClear }: AttachmentFieldProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.attachmentBox}>
        <Feather name="paperclip" size={18} color={colors.textMuted} />
        <Text style={[styles.attachmentValue, !value && styles.attachmentPlaceholder]}>
          {getAttachmentLabel(value)}
        </Text>
      </View>
      <View style={styles.attachmentActions}>
        <Pressable onPress={onPick} style={styles.attachmentButton}>
          <Text style={styles.attachmentButtonText}>Selecionar documento</Text>
        </Pressable>
        {value ? (
          <Pressable onPress={onClear} style={styles.attachmentButtonGhost}>
            <Text style={styles.attachmentButtonGhostText}>Limpar</Text>
          </Pressable>
        ) : null}
      </View>
      {helper ? <Text style={styles.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

async function pickDocumentAttachment(): Promise<string | null> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,.png,.jpg,.jpeg,.doc,.docx";
      input.style.display = "none";
      input.onchange = () => {
        const selectedFile = input.files?.[0];
        input.remove();
        resolve(selectedFile?.name ?? null);
      };
      document.body.appendChild(input);
      input.click();
    });
  }

  const pickedFile = await ExpoFile.pickFileAsync();
  const selectedFile = Array.isArray(pickedFile) ? pickedFile[0] : pickedFile;

  return selectedFile?.uri ?? null;
}

export function SettingsScreen() {
  const {
    resources,
    users,
    reservations,
    currentUser,
    currentUserPermissions,
    createVehicle,
    createUser,
    updateVehicle,
    updateUser,
    exportReservationsReport,
    isMutating,
  } = useReservationStore();
  const { mustChangePassword } = useAuthSession();

  const [vehicleForm, setVehicleForm] = useState<NewVehiclePayload>(emptyVehicleForm);
  const [userForm, setUserForm] = useState<NewUserPayload>(() =>
    buildInitialUserForm(currentUser.matriz, getUserDisplayName(users, currentUser.gestorId))
  );
  const [vehicleFeedback, setVehicleFeedback] = useState<FeedbackState | null>(null);
  const [userFeedback, setUserFeedback] = useState<FeedbackState | null>(null);
  const [exportFeedback, setExportFeedback] = useState<FeedbackState | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isVehicleCatalogOpen, setIsVehicleCatalogOpen] = useState(false);
  const [isUserCatalogOpen, setIsUserCatalogOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const vehicles = resources
    .filter((item) => item.category === "Veiculo")
    .slice()
    .sort((left, right) => left.code.localeCompare(right.code, "pt-BR"));
  const orderedUsers = users
    .slice()
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "pt-BR"));
  const currentManagerDisplayName = getUserDisplayName(orderedUsers, currentUser.gestorId);
  const totalVehicles = vehicles.length;
  const isEditingVehicle = Boolean(editingVehicleId);
  const isEditingUser = Boolean(editingUserId);

  const updateVehicleField = <K extends keyof NewVehiclePayload>(
    field: K,
    value: NewVehiclePayload[K]
  ) => {
    setVehicleForm((current) => ({ ...current, [field]: value }));
  };

  const updateUserField = <K extends keyof NewUserPayload>(field: K, value: NewUserPayload[K]) => {
    setUserForm((current) => ({ ...current, [field]: value }));
  };

  const resetVehicleForm = () => {
    if (editingVehicleId) {
      const vehicleToRestore = vehicles.find((item) => item.id === editingVehicleId);
      if (vehicleToRestore) {
        setVehicleForm(mapVehicleToForm(vehicleToRestore));
      }
    } else {
      setVehicleForm(emptyVehicleForm);
    }

    setVehicleFeedback(null);
  };

  const resetUserForm = () => {
    if (editingUserId) {
      const userToRestore = orderedUsers.find((item) => item.id === editingUserId);
      if (userToRestore) {
        setUserForm(mapUserToForm(userToRestore, orderedUsers));
      }
    } else {
      setUserForm(buildInitialUserForm(currentUser.matriz, currentManagerDisplayName));
    }

    setUserFeedback(null);
  };

  const openVehicleModal = () => {
    setVehicleForm(emptyVehicleForm);
    setEditingVehicleId(null);
    setVehicleFeedback(null);
    setIsVehicleModalOpen(true);
  };

  const openUserModal = () => {
    setUserForm(buildInitialUserForm(currentUser.matriz, currentManagerDisplayName));
    setEditingUserId(null);
    setUserFeedback(null);
    setIsUserModalOpen(true);
  };

  const openVehicleEditModal = (vehicle: Resource) => {
    setIsVehicleCatalogOpen(true);
    setVehicleForm(mapVehicleToForm(vehicle));
    setEditingVehicleId(vehicle.id);
    setVehicleFeedback(null);
    setIsVehicleModalOpen(true);
  };

  const openUserEditModal = (user: User) => {
    setIsUserCatalogOpen(true);
    setUserForm(mapUserToForm(user, orderedUsers));
    setEditingUserId(user.id);
    setUserFeedback(null);
    setIsUserModalOpen(true);
  };

  const closeVehicleModal = () => {
    setIsVehicleModalOpen(false);
    setEditingVehicleId(null);
    setVehicleForm(emptyVehicleForm);
    setVehicleFeedback(null);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUserId(null);
    setUserForm(buildInitialUserForm(currentUser.matriz, currentManagerDisplayName));
    setUserFeedback(null);
  };

  const handleSaveVehicle = async () => {
    const result = await (editingVehicleId
      ? updateVehicle(editingVehicleId, vehicleForm)
      : createVehicle(vehicleForm));
    setVehicleFeedback({
      tone: result.success ? "success" : "error",
      message: result.message,
    });

    if (result.success) {
      closeVehicleModal();
      setVehicleFeedback({
        tone: "success",
        message: result.message,
      });
    }
  };

  const handleSaveUser = async () => {
    const result = await (editingUserId ? updateUser(editingUserId, userForm) : createUser(userForm));
    setUserFeedback({
      tone: result.success ? "success" : "error",
      message: result.message,
    });

    if (result.success) {
      closeUserModal();
      setUserFeedback({
        tone: "success",
        message: result.message,
      });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const result = await exportReservationsReport();
    setExportFeedback({
      tone: result.success ? "success" : "error",
      message: result.message,
    });
    setIsExporting(false);
  };

  const handleVehicleAttachmentPick = async () => {
    try {
      const attachment = await pickDocumentAttachment();
      if (attachment) {
        updateVehicleField("vehicleDocumentAttachment", attachment);
      }
    } catch {
      setVehicleFeedback({
        tone: "error",
        message: "Não foi possível anexar o documento do veículo.",
      });
    }
  };

  const handleUserAttachmentPick = async () => {
    try {
      const attachment = await pickDocumentAttachment();
      if (attachment) {
        updateUserField("cnhAnexo", attachment);
      }
    } catch {
      setUserFeedback({
        tone: "error",
        message: "Não foi possível anexar o documento do usuário.",
      });
    }
  };

  return (
    <>
      <ScreenContainer>
        <PageHeader title="Configurações" />

        <View style={styles.metricsRow}>
          <MetricCard label="Veículos" value={totalVehicles} helper="Base de frota atual" />
          <MetricCard label="Usuários" value={users.length} helper="Cadastro ativo no app" />
          <MetricCard label="Reservas" value={reservations.length} helper="Linhas no CSV" />
        </View>

        <SettingsActionCard
          icon="shield"
          title="Segurança da conta"
          subtitle="Altere sua senha diretamente no app. No primeiro acesso com senha temporária, a troca fica obrigatória."
          helper={mustChangePassword ? "Troca obrigatória pendente" : "Senha ativa"}
          buttonLabel={mustChangePassword ? "Definir senha definitiva" : "Alterar minha senha"}
          onPress={() => router.push("/password-setup")}
        />

        {currentUserPermissions.canManageUsers ? (
          <>
            <SettingsActionCard
              icon="truck"
              title="Gerenciar veículos"
              subtitle="Cadastre um novo veículo ou abra a lista quando quiser editar um cadastro existente."
              helper={`${totalVehicles} veículos cadastrados`}
              buttonLabel="Cadastrar veículo"
              secondaryButtonLabel={
                isVehicleCatalogOpen ? "Ocultar veículos cadastrados" : "Ver veículos cadastrados"
              }
              onSecondaryPress={() => setIsVehicleCatalogOpen((current) => !current)}
              onPress={openVehicleModal}
              feedback={!isVehicleModalOpen ? vehicleFeedback : null}
            >
              {isVehicleCatalogOpen ? (
                <>
                  <View style={styles.catalogHeader}>
                    <View style={styles.catalogHeaderCopy}>
                      <Text style={styles.catalogTitle}>Veículos cadastrados</Text>
                      <Text style={styles.catalogSubtitle}>
                        Toque em um item para abrir a edição com os dados preenchidos.
                      </Text>
                    </View>
                    <View style={styles.catalogHeaderBadge}>
                      <Feather name="chevron-up" size={18} color={colors.primaryDark} />
                    </View>
                  </View>

                  <View style={styles.catalogList}>
                    {vehicles.length > 0 ? (
                      vehicles.map((vehicle) => (
                        <CatalogItem
                          key={vehicle.id}
                          icon="truck"
                          title={`${vehicle.code} · ${vehicle.name}`}
                          subtitle={`${vehicle.plate ?? "Sem placa"} · ${vehicle.brand ?? "-"} ${vehicle.model ?? ""}`.trim()}
                          meta={`Locadora: ${vehicle.rentalCompany ?? "-"} | Km: ${vehicle.currentMileage ?? "-"}`}
                          badgeLabel={getVehicleStatusLabel(vehicle.status)}
                          badgeTone={getVehicleStatusTone(vehicle.status)}
                          onPress={() => openVehicleEditModal(vehicle)}
                        />
                      ))
                    ) : (
                      <Text style={styles.catalogEmptyState}>
                        Nenhum veículo cadastrado no momento.
                      </Text>
                    )}
                  </View>
                </>
              ) : null}
            </SettingsActionCard>

            <SettingsActionCard
              icon="users"
              title="Gerenciar usuários"
              subtitle="Cadastre novas pessoas e abra a lista apenas quando quiser editar um usuário existente."
              helper={`${users.length} usuários cadastrados`}
              buttonLabel="Cadastrar usuário"
              secondaryButtonLabel={
                isUserCatalogOpen ? "Ocultar usuários cadastrados" : "Ver usuários cadastrados"
              }
              onSecondaryPress={() => setIsUserCatalogOpen((current) => !current)}
              onPress={openUserModal}
              feedback={!isUserModalOpen ? userFeedback : null}
            >
              {isUserCatalogOpen ? (
                <>
                  <View style={styles.catalogHeader}>
                    <View style={styles.catalogHeaderCopy}>
                      <Text style={styles.catalogTitle}>Usuários cadastrados</Text>
                      <Text style={styles.catalogSubtitle}>
                        Selecione um cadastro para revisar perfil, CNH, contato e anexos.
                      </Text>
                    </View>
                    <View style={styles.catalogHeaderBadge}>
                      <Feather name="chevron-up" size={18} color={colors.primaryDark} />
                    </View>
                  </View>

                  <View style={styles.catalogList}>
                    {orderedUsers.length > 0 ? (
                      orderedUsers.map((user) => (
                        <CatalogItem
                          key={user.id}
                          icon="user"
                          title={user.fullName}
                          subtitle={`${user.role} · ${user.matricula}`}
                          meta={`${user.areaDepartamento} | ${user.emailCorporativo}`}
                          badgeLabel={getCnhStatusLabel(user.cnhStatus)}
                          badgeTone={getCnhStatusTone(user.cnhStatus)}
                          onPress={() => openUserEditModal(user)}
                        />
                      ))
                    ) : (
                      <Text style={styles.catalogEmptyState}>
                        Nenhum usuário cadastrado no momento.
                      </Text>
                    )}
                  </View>
                </>
              ) : null}
            </SettingsActionCard>

            <Card style={styles.actionCard}>
              <View style={styles.actionCardTopRow}>
                <View style={styles.actionIconBadge}>
                  <Feather name="download" size={20} color={colors.primaryDark} />
                </View>
                <Text style={styles.actionHelper}>{reservations.length} linhas prontas</Text>
              </View>
              <Text style={styles.sectionTitle}>Baixar base CSV</Text>
              <Text style={styles.sectionSubtitle}>
                Gera um arquivo `.csv` com status, solicitante, carro, período, check-in, check-out,
                checklist, histórico e demais dados da reserva para salvar no computador.
              </Text>

              <PrimaryButton
                label={isExporting ? "Preparando CSV..." : "Baixar CSV"}
                onPress={() => {
                  void handleExport();
                }}
                disabled={isExporting}
              />

              {exportFeedback ? <FeedbackBanner feedback={exportFeedback} /> : null}
            </Card>
          </>
        ) : (
          <Card style={styles.actionCard}>
            <View style={styles.actionCardTopRow}>
              <View style={styles.actionIconBadge}>
                <Feather name="lock" size={20} color={colors.primaryDark} />
              </View>
              <Text style={styles.actionHelper}>Acesso restrito</Text>
            </View>
            <Text style={styles.sectionTitle}>Gestão administrativa</Text>
            <Text style={styles.sectionSubtitle}>
              Cadastro de usuários, veículos e exportação da base ficam disponíveis apenas para o perfil Administrador.
            </Text>
          </Card>
        )}
      </ScreenContainer>

      <FormModal
        visible={isVehicleModalOpen}
        title={isEditingVehicle ? "Editar veículo" : "Novo veículo"}
        subtitle={
          isEditingVehicle
            ? "Revise os dados do veículo e salve as alterações no cadastro atual."
            : "Preencha os dados do cadastro e adicione o anexo do documento do veículo."
        }
        onClose={closeVehicleModal}
      >
        {isEditingVehicle ? (
          <View style={styles.editingBanner}>
            <Text style={styles.editingBannerLabel}>Editando cadastro</Text>
            <Text style={styles.editingBannerValue}>
              {vehicleForm.code || "Veículo"} · {vehicleForm.name || "Sem nome"}
            </Text>
          </View>
        ) : null}

        <View style={styles.formStack}>
          <FormField
            label="Nome do veículo"
            placeholder="Ex.: Chevrolet Tracker"
            value={vehicleForm.name}
            onChangeText={(value) => updateVehicleField("name", value)}
          />
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="Código"
                placeholder="VEI-299"
                value={vehicleForm.code}
                onChangeText={(value) => updateVehicleField("code", value)}
              />
            </View>
            <View style={styles.column}>
              <FormField
                label="Placa"
                placeholder="SIG2A99"
                value={vehicleForm.plate}
                onChangeText={(value) => updateVehicleField("plate", value)}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="Marca"
                placeholder="Chevrolet"
                value={vehicleForm.brand}
                onChangeText={(value) => updateVehicleField("brand", value)}
              />
            </View>
            <View style={styles.column}>
              <FormField
                label="Modelo"
                placeholder="Tracker"
                value={vehicleForm.model}
                onChangeText={(value) => updateVehicleField("model", value)}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="Ano"
                placeholder="2026"
                value={vehicleForm.year}
                onChangeText={(value) => updateVehicleField("year", value)}
              />
            </View>
            <View style={styles.column}>
              <FormField
                label="KM atual"
                placeholder="15320"
                value={vehicleForm.currentMileage}
                onChangeText={(value) => updateVehicleField("currentMileage", value)}
              />
            </View>
          </View>
          <ChoiceGroup
            label="Categoria"
            value={vehicleForm.vehicleCategory}
            options={vehicleCategories}
            onChange={(value) => updateVehicleField("vehicleCategory", value as VehicleCategory)}
          />
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="Locadora"
                placeholder="Cadastro interno"
                value={vehicleForm.rentalCompany}
                onChangeText={(value) => updateVehicleField("rentalCompany", value)}
              />
            </View>
            <View style={styles.column}>
              <FormField
                label="Próxima revisão"
                placeholder="2026-08-30"
                value={vehicleForm.nextMaintenanceDate}
                onChangeText={(value) => updateVehicleField("nextMaintenanceDate", value)}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="KM próxima revisão"
                placeholder="30000"
                value={vehicleForm.nextMaintenanceMileage}
                onChangeText={(value) => updateVehicleField("nextMaintenanceMileage", value)}
              />
            </View>
          </View>
          <AttachmentField
            label="Anexo do documento do veículo"
            value={vehicleForm.vehicleDocumentAttachment}
            onPick={() => {
              void handleVehicleAttachmentPick();
            }}
            onClear={() => updateVehicleField("vehicleDocumentAttachment", "")}
            helper="Selecione o documento para vincular ao cadastro do veículo."
          />
          <FormField
            label="Descrição"
            placeholder="Resumo operacional do uso do veículo."
            value={vehicleForm.description}
            onChangeText={(value) => updateVehicleField("description", value)}
            multiline
          />
          <FormField
            label="Observação"
            placeholder="Detalhes adicionais do cadastro."
            value={vehicleForm.observation}
            onChangeText={(value) => updateVehicleField("observation", value)}
            multiline
          />
        </View>

        {vehicleFeedback ? <FeedbackBanner feedback={vehicleFeedback} /> : null}

        <View style={styles.modalActions}>
          <PrimaryButton
            label={
              isMutating
                ? "Salvando..."
                : isEditingVehicle
                  ? "Salvar alterações"
                  : "Salvar veículo"
            }
            onPress={() => {
              void handleSaveVehicle();
            }}
            disabled={isMutating}
          />
          <SecondaryButton
            label={isEditingVehicle ? "Restaurar dados" : "Limpar formulário"}
            onPress={resetVehicleForm}
          />
          <SecondaryButton label="Fechar" onPress={closeVehicleModal} />
        </View>
      </FormModal>

      <FormModal
        visible={isUserModalOpen}
        title={isEditingUser ? "Editar usuário" : "Novo usuário"}
        subtitle={
          isEditingUser
            ? "Revise o cadastro atual, atualize a CNH e salve as alterações do usuário."
            : "Preencha os dados do cadastro e adicione o anexo do documento do usuário."
        }
        onClose={closeUserModal}
      >
        {isEditingUser ? (
          <View style={styles.editingBanner}>
            <Text style={styles.editingBannerLabel}>Editando cadastro</Text>
            <Text style={styles.editingBannerValue}>
              {userForm.fullName || "Usuário"} · {userForm.matricula || "Sem matrícula"}
            </Text>
          </View>
        ) : null}

        <View style={styles.formStack}>
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="Nome curto"
                placeholder="Ex.: Ana Silva"
                value={userForm.name}
                onChangeText={(value) => updateUserField("name", value)}
              />
            </View>
            <View style={styles.column}>
              <FormField
                label="Nome completo"
                placeholder="Ex.: Ana Carolina Silva"
                value={userForm.fullName}
                onChangeText={(value) => updateUserField("fullName", value)}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="CPF"
                placeholder="123.456.789-00"
                value={userForm.cpf}
                onChangeText={(value) => updateUserField("cpf", value)}
              />
            </View>
            <View style={styles.column}>
              <FormField
                label="Matrícula"
                placeholder="SIG-30001"
                value={userForm.matricula}
                onChangeText={(value) => updateUserField("matricula", value)}
              />
            </View>
          </View>
          <ChoiceGroup
            label="Perfil"
            value={userForm.role}
            options={userRoles}
            onChange={(value) => updateUserField("role", value as UserRole)}
          />
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="Área / departamento"
                placeholder="Facilities e Frota"
                value={userForm.areaDepartamento}
                onChangeText={(value) => updateUserField("areaDepartamento", value)}
              />
            </View>
            <View style={styles.column}>
              <FormField
                label="Centro de custo"
                placeholder="CC-FRO-500"
                value={userForm.centroCusto}
                onChangeText={(value) => updateUserField("centroCusto", value)}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="E-mail corporativo"
                placeholder="ana.silva@sigma.local"
                value={userForm.emailCorporativo}
                onChangeText={(value) => updateUserField("emailCorporativo", value)}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.column}>
              <FormField
                label="Telefone"
                placeholder="+55 31 99999-0000"
                value={userForm.telefone}
                onChangeText={(value) => updateUserField("telefone", value)}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="Matriz"
                placeholder="Belo Horizonte"
                value={userForm.matriz}
                onChangeText={(value) => updateUserField("matriz", value)}
              />
            </View>
            <View style={styles.column}>
              <FormField
                label="Superior imediato"
                placeholder={currentManagerDisplayName || currentUser.fullName}
                value={userForm.gestorId}
                onChangeText={(value) => updateUserField("gestorId", value)}
                helper="Opcional. Informe nome, e-mail, matrícula ou ID de um colaborador existente."
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="CNH número"
                placeholder="MG1234567890"
                value={userForm.cnhNumero}
                onChangeText={(value) => updateUserField("cnhNumero", value)}
              />
            </View>
            <View style={styles.column}>
              <FormField
                label="Categoria CNH"
                placeholder="B"
                value={userForm.cnhCategoria}
                onChangeText={(value) => updateUserField("cnhCategoria", value)}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <FormField
                label="UF de emissão"
                placeholder="MG"
                value={userForm.cnhUfEmissao}
                onChangeText={(value) => updateUserField("cnhUfEmissao", value)}
              />
            </View>
            <View style={styles.column}>
              <ChoiceGroup
                label="Status da CNH"
                value={userForm.cnhStatus}
                options={cnhStatuses}
                onChange={(value) => updateUserField("cnhStatus", value as CnhStatus)}
              />
            </View>
          </View>
          <AttachmentField
            label="Anexo do documento do usuário"
            value={userForm.cnhAnexo}
            onPick={() => {
              void handleUserAttachmentPick();
            }}
            onClear={() => updateUserField("cnhAnexo", "")}
            helper="Selecione a CNH ou outro documento para vincular ao cadastro."
          />
          <FormField
            label="Observação"
            placeholder="Observações adicionais do usuário."
            value={userForm.observacao}
            onChangeText={(value) => updateUserField("observacao", value)}
            multiline
          />
        </View>

        {userFeedback ? <FeedbackBanner feedback={userFeedback} /> : null}

        <View style={styles.modalActions}>
          <PrimaryButton
            label={
              isMutating
                ? "Salvando..."
                : isEditingUser
                  ? "Salvar alterações"
                  : "Salvar usuário"
            }
            onPress={() => {
              void handleSaveUser();
            }}
            disabled={isMutating}
          />
          <SecondaryButton
            label={isEditingUser ? "Restaurar dados" : "Limpar formulário"}
            onPress={resetUserForm}
          />
          <SecondaryButton label="Fechar" onPress={closeUserModal} />
        </View>
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  actionCard: {
    gap: spacing.md,
  },
  actionButtonsStack: {
    gap: spacing.sm,
  },
  actionCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  actionIconBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionHelper: {
    flex: 1,
    textAlign: "right",
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  sectionCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  expandableSection: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  catalogHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  catalogHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  catalogHeaderBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  catalogTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  catalogSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  catalogList: {
    gap: spacing.sm,
  },
  catalogEmptyState: {
    color: colors.textMuted,
    fontSize: typography.bodySmall,
    lineHeight: 20,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  catalogItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  catalogItemPressed: {
    opacity: 0.92,
  },
  catalogItemIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  catalogItemCopy: {
    flex: 1,
    gap: 4,
  },
  catalogItemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  catalogItemTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  catalogItemSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  catalogItemMeta: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  catalogItemAction: {
    alignItems: "center",
    gap: 2,
  },
  catalogItemActionText: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  formStack: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  column: {
    flex: 1,
  },
  group: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  fieldHelper: {
    color: colors.textMuted,
    fontSize: typography.tiny,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  choiceChip: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceChipActive: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primarySoft,
  },
  choiceChipText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  choiceChipTextActive: {
    color: colors.primaryDark,
  },
  actionStack: {
    gap: spacing.sm,
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
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusPillSuccess: {
    backgroundColor: colors.primarySoft,
    borderColor: "#C9DDC0",
  },
  statusPillDanger: {
    backgroundColor: "#FFF4F4",
    borderColor: "#F1C1C1",
  },
  statusPillWarning: {
    backgroundColor: "#FFF5E7",
    borderColor: "#F4D4A8",
  },
  statusPillNeutral: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statusPillText: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  statusPillTextSuccess: {
    color: colors.primaryDark,
  },
  statusPillTextDanger: {
    color: colors.danger,
  },
  statusPillTextWarning: {
    color: colors.warning,
  },
  statusPillTextNeutral: {
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(21, 32, 19, 0.32)",
    justifyContent: "flex-end",
    padding: spacing.md,
  },
  modalSheet: {
    maxHeight: "92%",
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  editingBanner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#D4E5CD",
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    gap: 4,
  },
  editingBannerLabel: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  editingBannerValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  attachmentBox: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  attachmentValue: {
    flex: 1,
    color: colors.text,
    fontSize: typography.bodySmall,
  },
  attachmentPlaceholder: {
    color: colors.textMuted,
  },
  attachmentActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  attachmentButton: {
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: "#C8DDC0",
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentButtonText: {
    color: colors.primaryDark,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  attachmentButtonGhost: {
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentButtonGhostText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  modalActions: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  exportMeta: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  exportMetaLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  exportMetaValue: {
    color: colors.primaryDark,
    fontSize: 32,
    fontWeight: "800",
  },
});



