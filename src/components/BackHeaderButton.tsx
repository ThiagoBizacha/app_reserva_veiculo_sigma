import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { colors, radius } from "@/theme";

interface BackHeaderButtonProps {
  onPress?: () => void;
}

export function BackHeaderButton({ onPress }: BackHeaderButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress ?? (() => router.back())} style={styles.button}>
      <Feather name="arrow-left" size={18} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
});
