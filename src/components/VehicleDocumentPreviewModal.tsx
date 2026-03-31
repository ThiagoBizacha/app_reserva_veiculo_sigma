import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { formatDateTime } from "@/utils/date";
import type { Resource } from "@/types";

interface VehicleDocumentPreviewModalProps {
  resource: Resource | null;
  onClose: () => void;
}

export function VehicleDocumentPreviewModal({
  resource,
  onClose,
}: VehicleDocumentPreviewModalProps) {
  if (!resource) {
    return null;
  }

  const referenceDate =
    resource.lastInspectionDate ?? resource.lastMaintenanceDate ?? resource.nextMaintenanceDate;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Documento do veiculo</Text>
              <Text style={styles.subtitle}>
                Pre-visualizacao do PDF mockado para {resource.code}
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
                Arquivo vinculado: {resource.vehicleDocumentAttachment ?? "Nao informado"}
              </Text>
            </View>

            <View style={styles.pdfPage}>
              <View style={styles.pageHeader}>
                <View style={styles.pageHeaderCopy}>
                  <Text style={styles.pageOverline}>CRLV DIGITAL</Text>
                  <Text style={styles.pageTitle}>Documento do Veiculo</Text>
                  <Text style={styles.pageSubtitle}>Uso interno / visualizacao mockada</Text>
                </View>
                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>PDF</Text>
                </View>
              </View>

              <View style={styles.fieldGrid}>
                <DocumentField label="Veiculo" value={resource.name} />
                <DocumentField label="Placa" value={resource.plate ?? "-"} />
                <DocumentField label="Codigo" value={resource.code} />
                <DocumentField label="RENAVAM" value={buildMockRenavam(resource)} />
                <DocumentField label="Marca / Modelo" value={`${resource.brand ?? "-"} ${resource.model ?? ""}`.trim()} />
                <DocumentField label="Chassi" value={buildMockChassis(resource)} />
                <DocumentField label="Ano" value={resource.year ?? "-"} />
                <DocumentField label="Categoria" value={resource.vehicleCategory ?? "-"} />
                <DocumentField label="Locadora" value={resource.rentalCompany ?? "-"} />
                <DocumentField label="Capacidade" value={resource.capacity ?? "-"} />
                <DocumentField label="Base" value={resource.location} />
                <DocumentField label="Responsavel" value={resource.responsible} />
              </View>

              <Section title="Controle operacional">
                <DocumentField label="Km atual" value={resource.currentMileage ? `${resource.currentMileage} km` : "-"} />
                <DocumentField
                  label="Ultima vistoria"
                  value={resource.lastInspectionDate ? formatDateTime(resource.lastInspectionDate) : "-"}
                />
                <DocumentField
                  label="Proxima manutencao"
                  value={resource.nextMaintenanceDate ? formatDateTime(resource.nextMaintenanceDate) : "-"}
                />
                <DocumentField
                  label="Previsao de retorno"
                  value={resource.nextAvailableAt ? formatDateTime(resource.nextAvailableAt) : "-"}
                />
              </Section>

              <Section title="Observacoes">
                <Text style={styles.noteText}>
                  {resource.observation ?? "Sem observacoes adicionais para este documento."}
                </Text>
              </Section>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Documento mockado para demonstracao do fluxo de PDF na frota.
                </Text>
                <Text style={styles.footerMeta}>
                  {referenceDate ? `Atualizado em ${formatDateTime(referenceDate)}` : "Sem data de referencia"}
                </Text>
              </View>
            </View>
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fechar visualizacao</Text>
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

function buildMockRenavam(resource: Resource) {
  const digits = `${resource.code}${resource.id}${resource.plate ?? ""}`.replace(/\D/g, "");
  return digits.padEnd(11, "0").slice(0, 11);
}

function buildMockChassis(resource: Resource) {
  const seed = `${resource.brand ?? "SIG"}${resource.model ?? ""}${resource.code}SIG26`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return seed.padEnd(17, "0").slice(0, 17);
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
  pageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
  },
  pageBadgeText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "700",
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
