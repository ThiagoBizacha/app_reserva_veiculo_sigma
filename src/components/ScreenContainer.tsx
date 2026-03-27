import { colors, spacing } from "@/theme";
import { PropsWithChildren, ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean;
  header?: ReactNode;
}

export function ScreenContainer({ children, scroll = true, header }: ScreenContainerProps) {
  const content = (
    <View style={styles.inner}>
      {header}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
});
