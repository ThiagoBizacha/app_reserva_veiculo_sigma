import { Feather } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components";
import { colors, radius, spacing, typography } from "@/theme";

const checklistItems = [
  "Veículo limpo",
  "Tanque cheio",
  "Documentos presentes (CRLV, seguro)",
  "Estepe em boas condições",
  "Avarias externas (marque se houver)",
];

export function CheckFlowScreen() {
  const [checked, setChecked] = useState([true, true, true, true, false]);
  const [notes, setNotes] = useState("");

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Check-out do Veículo</Text>
        <View style={styles.onlinePill}>
          <Text style={styles.onlinePillText}>Online</Text>
        </View>
      </View>

      <View style={styles.vehicleBanner}>
        <View style={styles.row}>
          <Feather name="truck" size={24} color="#356734" />
          <View>
            <Text style={styles.vehicleName}>Ford Ranger - XYZ-5678</Text>
            <Text style={styles.vehicleMeta}>OS #2023 | 05/03/2026 07:00 → 20:00</Text>
            <Text style={styles.vehicleMeta}>Destino: Araxá - MG</Text>
          </View>
        </View>
      </View>

      <Section title="CONDIÇÕES DO VEÍCULO">
        {checklistItems.map((item, index) => (
          <Pressable
            key={item}
            style={styles.checkItem}
            onPress={() => setChecked((current) => current.map((value, i) => (i === index ? !value : value)))}
          >
            <Feather
              name={checked[index] ? "check-square" : "square"}
              size={22}
              color={checked[index] ? "#2B7A22" : "#8F8F8F"}
            />
            <Text style={styles.checkLabel}>{item}</Text>
          </Pressable>
        ))}
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Descreva avarias observadas..."
          placeholderTextColor="#9A9A9A"
          multiline
          style={styles.textArea}
        />
      </Section>

      <Section title="HORÍMETRO INICIAL">
        <View style={styles.inputBox}>
          <Feather name="clock" size={16} color="#8A8A8A" />
          <Text style={styles.inputText}>45.230 km</Text>
        </View>
      </Section>

      <Section title="RESPONSÁVEL PELA FROTA">
        <Text style={styles.infoText}>Entregue por: Roberto Alves</Text>
        <Text style={styles.infoText}>Data/Hora: 05/03/2026 07:05</Text>
      </Section>

      <Section title="ASSINATURA DIGITAL">
        <View style={styles.signatureBox}>
          <Text style={styles.signatureText}>Assine aqui</Text>
        </View>
        <Text style={styles.clearLink}>Limpar</Text>
      </Section>

      <Pressable style={styles.confirmButton}>
        <Feather name="truck" size={18} color={colors.white} />
        <Text style={styles.confirmButtonText}>Confirmar Check-out</Text>
      </Pressable>
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#29631B",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
  },
  onlinePill: {
    backgroundColor: "#70B96B",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  onlinePillText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  vehicleBanner: {
    backgroundColor: "#EBF6E8",
    borderRadius: 18,
    padding: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  vehicleName: {
    color: "#2D5F20",
    fontSize: typography.cardTitle,
    fontWeight: "800",
  },
  vehicleMeta: {
    color: "#404040",
    fontSize: typography.body,
    marginTop: 2,
  },
  section: {
    flexDirection: "row",
    gap: spacing.md,
  },
  sectionBar: {
    width: 4,
    borderRadius: radius.pill,
    backgroundColor: "#25932F",
  },
  sectionContent: {
    flex: 1,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: "#2B6022",
    fontSize: typography.cardTitle,
    fontWeight: "800",
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkLabel: {
    color: "#252525",
    fontSize: typography.body,
    flex: 1,
  },
  textArea: {
    minHeight: 82,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    backgroundColor: "#F4F4F4",
    padding: spacing.sm,
    color: "#333",
    textAlignVertical: "top",
  },
  inputBox: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  inputText: {
    color: "#333",
    fontSize: typography.body,
  },
  infoText: {
    color: "#252525",
    fontSize: typography.body,
    fontWeight: "600",
  },
  signatureBox: {
    minHeight: 82,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#BDBDBD",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  signatureText: {
    color: "#999999",
    fontSize: typography.body,
  },
  clearLink: {
    color: "#35A34A",
    fontSize: typography.body,
  },
  confirmButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#295F16",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "800",
  },
});
