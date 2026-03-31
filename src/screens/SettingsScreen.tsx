import { Feather } from "@expo/vector-icons";
import { File as ExpoFile } from "expo-file-system";
import { type ReactNode, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Card,
  ExitHeaderButton,
  FormField,
  MetricCard,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
} from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import type { CnhStatus, NewUserPayload, NewVehiclePayload, UserRole, VehicleCategory } from "@/types";

type FeedbackState = {
  tone: "success" | "error";
  message: string;
};

const vehicleCategories: VehicleCategory[] = ["Sedan", "SUV", "Pickup"];
const userRoles: UserRole[] = ["Solicitante", "Gestor", "Operação", "Administrador"];
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
  location: "",
  responsible: "",
  description: "",
  rentalCompany: "",
  vehicleDocumentAttachment: "",
  nextMaintenanceDate: "",
  nextMaintenanceMileage: "",
  observation: "",
  requiresApproval: true,
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
  feedback?: FeedbackState | null;
}

function SettingsActionCard({
  icon,
  title,
  subtitle,
  helper,
  buttonLabel,
  onPress,
  feedback,
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
      <PrimaryButton label={buttonLabel} onPress={onPress} />
      {feedback ? <FeedbackBanner feedback={feedback} /> : null}
    </Card>
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
    createVehicle,
    createUser,
    exportReservationsReport,
  } = useReservationStore();

  const [vehicleForm, setVehicleForm] = useState<NewVehiclePayload>(emptyVehicleForm);
  const [userForm, setUserForm] = useState<NewUserPayload>(() =>
    buildInitialUserForm(currentUser.matriz, currentUser.gestorId)
  );
  const [vehicleFeedback, setVehicleFeedback] = useState<FeedbackState | null>(null);
  const [userFeedback, setUserFeedback] = useState<FeedbackState | null>(null);
  const [exportFeedback, setExportFeedback] = useState<FeedbackState | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const totalVehicles = resources.filter((item) => item.category === "Veiculo").length;

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
    setVehicleForm(emptyVehicleForm);
    setVehicleFeedback(null);
  };

  const resetUserForm = () => {
    setUserForm(buildInitialUserForm(currentUser.matriz, currentUser.gestorId));
    setUserFeedback(null);
  };

  const openVehicleModal = () => {
    setVehicleFeedback(null);
    setIsVehicleModalOpen(true);
  };

  const openUserModal = () => {
    setUserFeedback(null);
    setIsUserModalOpen(true);
  };

  const handleCreateVehicle = () => {
    const result = createVehicle(vehicleForm);
    setVehicleFeedback({
      tone: result.success ? "success" : "error",
      message: result.message,
    });

    if (result.success) {
      setVehicleForm(emptyVehicleForm);
      setIsVehicleModalOpen(false);
    }
  };

  const handleCreateUser = () => {
    const result = createUser(userForm);
    setUserFeedback({
      tone: result.success ? "success" : "error",
      message: result.message,
    });

    if (result.success) {
      resetUserForm();
      setIsUserModalOpen(false);
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
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Configurações</Text>
              <Text style={styles.headerSubtitle}>
                Cadastre veículos, usuários e baixe a base de reservas em CSV sem poluir a tela
                principal com formulários abertos o tempo todo.
              </Text>
            </View>
            <ExitHeaderButton />
          </View>
        </View>

        <View style={styles.metricsRow}>
          <MetricCard label="Veículos" value={totalVehicles} helper="Base de frota atual" />
          <MetricCard label="Usuários" value={users.length} helper="Cadastro ativo no app" />
          <MetricCard label="Reservas" value={reservations.length} helper="Linhas no CSV" />
        </View>

        <SettingsActionCard
          icon="truck"
          title="Cadastrar novo veículo"
          subtitle="Abra o formulário somente quando precisar incluir um novo item na frota."
          helper={`${totalVehicles} veículos cadastrados`}
          buttonLabel="Abrir formulário de veículo"
          onPress={openVehicleModal}
          feedback={!isVehicleModalOpen ? vehicleFeedback : null}
        />

        <SettingsActionCard
          icon="users"
          title="Cadastrar novo usuário"
          subtitle="Abra o formulário sob demanda para manter a tela mais leve e focada."
          helper={`${users.length} usuários cadastrados`}
          buttonLabel="Abrir formulário de usuário"
          onPress={openUserModal}
          feedback={!isUserModalOpen ? userFeedback : null}
        />

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
      </ScreenContainer>

      <FormModal
        visible={isVehicleModalOpen}
        title="Novo veículo"
        subtitle="Preencha os dados do cadastro e adicione o anexo do documento do veículo."
        onClose={() => setIsVehicleModalOpen(false)}
      >
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
                label="Localização"
                placeholder="Base Matriz - BH"
                value={vehicleForm.location}
                onChangeText={(value) => updateVehicleField("location", value)}
              />
            </View>
            <View style={styles.column}>
              <FormField
                label="Responsável"
                placeholder="Nome do responsável"
                value={vehicleForm.responsible}
                onChangeText={(value) => updateVehicleField("responsible", value)}
              />
            </View>
          </View>
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
            <View style={styles.column}>
              <ChoiceGroup
                label="Exige aprovação"
                value={vehicleForm.requiresApproval ? "Sim" : "Não"}
                options={["Sim", "Não"]}
                onChange={(value) => updateVehicleField("requiresApproval", value === "Sim")}
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
          <PrimaryButton label="Salvar veículo" onPress={handleCreateVehicle} />
          <SecondaryButton label="Limpar formulário" onPress={resetVehicleForm} />
          <SecondaryButton label="Fechar" onPress={() => setIsVehicleModalOpen(false)} />
        </View>
      </FormModal>

      <FormModal
        visible={isUserModalOpen}
        title="Novo usuário"
        subtitle="Preencha os dados do cadastro e adicione o anexo do documento do usuário."
        onClose={() => setIsUserModalOpen(false)}
      >
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
                label="Gestor ID"
                placeholder={currentUser.gestorId ?? currentUser.id}
                value={userForm.gestorId}
                onChangeText={(value) => updateUserField("gestorId", value)}
                helper="Opcional. Se vazio, o app usa o gestor do usuário logado."
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
          <PrimaryButton label="Salvar usuário" onPress={handleCreateUser} />
          <SecondaryButton label="Limpar formulário" onPress={resetUserForm} />
          <SecondaryButton label="Fechar" onPress={() => setIsUserModalOpen(false)} />
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



