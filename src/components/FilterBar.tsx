import { colors, radius, spacing, typography } from "@/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface FilterBarProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function FilterBar<T extends string>({ options, value, onChange }: FilterBarProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, active && styles.activeChip]}
          >
            <Text style={[styles.chipLabel, active && styles.activeChipLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  activeChip: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  activeChipLabel: {
    color: colors.white,
  },
});
