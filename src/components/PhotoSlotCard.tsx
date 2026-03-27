import { Feather } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, typography } from "@/theme";

interface PhotoSlotCardProps {
  label: string;
  photoUri?: string;
  required?: boolean;
  helperText?: string;
  onPress: () => void;
}

export function PhotoSlotCard({
  label,
  photoUri,
  required,
  helperText,
  onPress,
}: PhotoSlotCardProps) {
  const isFilled = Boolean(photoUri);

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={[styles.card, !isFilled && styles.cardEmpty]}
        onPress={onPress}
      >
        {photoUri ? (
          <>
            <Image source={{ uri: photoUri }} style={styles.image} />
            <View style={styles.checkBadge}>
              <Feather name="check" size={28} color={colors.white} />
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="camera" size={38} color={colors.textMuted} />
            <Feather name="plus" size={18} color={colors.textMuted} style={styles.plusIcon} />
          </View>
        )}
      </Pressable>

      <Text style={styles.label}>{label}</Text>
      {isFilled ? (
        <Text style={styles.successText}>1 foto</Text>
      ) : required ? (
        <Text style={styles.requiredText}>Obrigatório</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  card: {
    width: "100%",
    aspectRatio: 1.2,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  cardEmpty: {
    borderStyle: "dashed",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  plusIcon: {
    position: "absolute",
    right: "32%",
    bottom: "34%",
  },
  checkBadge: {
    position: "absolute",
    alignSelf: "center",
    top: "35%",
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.primaryDark,
    fontSize: typography.cardTitle,
    fontWeight: "700",
    textAlign: "center",
  },
  successText: {
    color: colors.success,
    fontSize: typography.body,
    textAlign: "center",
  },
  requiredText: {
    color: colors.danger,
    fontSize: typography.bodySmall,
    fontWeight: "700",
    textAlign: "center",
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall,
    textAlign: "center",
  },
});
