import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

interface OperationStepperProps {
  steps: string[];
  currentStep: number;
}

export function OperationStepper({ steps, currentStep }: OperationStepperProps) {
  return (
    <View style={styles.wrapper}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const circleColor = isCompleted || isActive ? colors.primary : colors.surface;
        const textColor = isActive ? colors.text : colors.textSecondary;
        const borderColor = isCompleted || isActive ? colors.primary : colors.disabled;

        return (
          <View key={step} style={styles.stepItem}>
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.circle,
                  { backgroundColor: circleColor, borderColor },
                ]}
              >
                <Text
                  style={[
                    styles.circleText,
                    { color: isCompleted || isActive ? colors.white : colors.textMuted },
                  ]}
                >
                  {isCompleted ? "✓" : index + 1}
                </Text>
              </View>
              {index < steps.length - 1 ? (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: index < currentStep ? colors.primary : colors.border },
                  ]}
                />
              ) : null}
            </View>
            <Text style={[styles.stepLabel, { color: textColor }, isActive && styles.stepLabelActive]}>
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
  },
  stepRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  connector: {
    flex: 1,
    height: 3,
    marginHorizontal: spacing.xs,
    borderRadius: radius.pill,
  },
  stepLabel: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    textAlign: "center",
  },
  stepLabelActive: {
    fontWeight: "700",
  },
});
