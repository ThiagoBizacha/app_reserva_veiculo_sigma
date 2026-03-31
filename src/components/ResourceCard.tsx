import { Feather } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, spacing, typography } from "@/theme";
import type { Resource } from "@/types";
import { StyleSheet, Text, View } from "react-native";

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Feather name={resource.category === "Veiculo" ? "truck" : "box"} size={18} color={colors.primaryDark} />
        </View>
        <StatusBadge status={resource.status} kind="resource" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{resource.name}</Text>
        <Text style={styles.code}>{resource.code}</Text>
        <Text style={styles.description}>{resource.description}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>
          {resource.category === "Veiculo"
            ? resource.plate ?? resource.code
            : resource.location}
        </Text>
        <Text style={styles.metaLabel}>
          {resource.category === "Veiculo"
            ? resource.vehicleCategory ?? resource.category
            : resource.category}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  copy: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: "800",
  },
  code: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    gap: spacing.md,
  },
  metaLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.caption,
  },
});
