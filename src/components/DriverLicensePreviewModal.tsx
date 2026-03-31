import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { formatDateTime } from "@/utils/date";
import type { User } from "@/types";

interface DriverLicensePreviewModalProps {
  user: User | null;
  onClose: () => void;
}

export function DriverLicensePreviewModal({
  user,
  onClose,
}: DriverLicensePreviewModalProps) {
  if (!user) {
    return null;
  }

  const normalizedCnhStatus = user.cnhStatus
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isLicenseValid = normalizedCnhStatus === "valida";
  const cnhStatusLabel = isLicenseValid ? "Válida" : "Vencida";

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>CNH do colaborador</Text>
              <Text style={styles.subtitle}>
                Pré-visualização do PDF mockado para {user.fullName}
              </Text>
            </View>
            <Pressable style={styles.closeIconButton} onPress={onClose}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.infoBanner}>
              <Feather name="file-text" size={18} color={colors.primaryDark} />
              <Text style={styles.infoBannerText}>
                Arquivo vinculado: {user.cnhAnexo || "Não informado"}
              </Text>
            </View>

            <View style={styles.pdfPage}>
              <View style={styles.pageHeader}>
                <View style={styles.pageHeaderCopy}>
                  <Text style={styles.pageOverline}>CNH DIGITAL</Text>
                  <Text style={styles.pageTitle}>Carteira Nacional de Habilitação</Text>
                  <Text style={styles.pageSubtitle}>Uso interno / visualização mockada</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    isLicenseValid ? styles.statusBadgeValid : styles.statusBadgeExpired,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isLicenseValid ? styles.statusBadgeTextValid : styles.statusBadgeTextExpired,
                    ]}
                  >
                    {cnhStatusLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.fieldGrid}>
                <DocumentField label="Nome" value={user.fullName} />
                <DocumentField label="CPF" value={user.cpf} />
                <DocumentField label="Número da CNH" value={user.cnhNumero} />
                <DocumentField label="Categoria" value={user.cnhCategoria} />
                <DocumentField label="UF de emissão" value={user.cnhUfEmissao} />
                <DocumentField label="Matrícula" value={user.matricula} />
                <DocumentField label="Área" value={user.areaDepartamento} />
                <DocumentField label="Centro de custo" value={user.centroCusto} />
                <DocumentField label="Email" value={user.emailCorporativo} />
                <DocumentField label="Telefone" value={user.telefone} />
              </View>

              <Section title="Controle de habilitação">
                <DocumentField label="Status da CNH" value={cnhStatusLabel} />
                <DocumentField
                  label="Última validação"
                  value={formatDateTime(user.cnhDataUltimaValidacao)}
                />
                <DocumentField label="Termos Paytrack" value={user.termosPaytrack ? "Aceito" : "Pendente"} />
                <DocumentField label="Perfil" value={user.role} />
              </Section>

              <Section title="Observações">
                <Text style={styles.noteText}>
                  {user.observacao ?? "Sem observações adicionais para esta CNH."}
                </Text>
              </Section>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Documento mockado para demonstração do fluxo de PDF da CNH na home.
                </Text>
                <Text style={styles.footerMeta}>
                  Validado em {formatDateTime(user.cnhDataUltimaValidacao)}
                </Text>
              </View>
            </View>
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fechar visualização</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function DocumentField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(21, 32, 19, 0.20)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  closeIconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  infoBanner: {
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoBannerText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  pdfPage: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageHeaderCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  pageOverline: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  pageTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "800",
  },
  pageSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusBadgeValid: {
    backgroundColor: colors.primarySoft,
  },
  statusBadgeExpired: {
    backgroundColor: `${colors.danger}12`,
  },
  statusBadgeText: {
    fontSize: typography.caption,
    fontWeight: "700",
  },
  statusBadgeTextValid: {
    color: colors.primaryDark,
  },
  statusBadgeTextExpired: {
    color: colors.danger,
  },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  fieldCard: {
    width: "48%",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  fieldValue: {
    color: colors.text,
    fontSize: typography.bodySmall,
    lineHeight: 20,
    fontWeight: "600",
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  sectionBody: {
    gap: spacing.sm,
  },
  noteText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
  },
  footerMeta: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  closeButton: {
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
});

