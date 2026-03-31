import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, radius, shadows, spacing, typography } from "@/theme";

const sigmaLogo = require("../../assets/logo2.png");

interface LoginFieldProps {
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  trailing?: ReactNode;
}

function LoginField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  trailing,
}: LoginFieldProps) {
  return (
    <View style={styles.fieldShell}>
      <Feather name={icon} size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {trailing}
    </View>
  );
}

export function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const enterApp = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <LinearGradient colors={["#173D13", "#215319", "#193F16"]} style={styles.background}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={[styles.orb, styles.orbPrimary]} />
              <View style={[styles.orb, styles.orbSecondary]} />
              <View style={[styles.orb, styles.orbTertiary]} />
              <Image source={sigmaLogo} style={styles.logoImage} resizeMode="contain" />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Bem-vindo</Text>
              <Text style={styles.subtitle}>Faca login para continuar</Text>

              <View style={styles.formBlock}>
                <View style={styles.labelBlock}>
                  <Text style={styles.label}>Usuario</Text>
                  <LoginField
                    icon="user"
                    placeholder="Digite seu usuario"
                    value={username}
                    onChangeText={setUsername}
                  />
                </View>

                <View style={styles.labelBlock}>
                  <Text style={styles.label}>Senha</Text>
                  <LoginField
                    icon="lock"
                    placeholder="Digite sua senha"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    trailing={
                      <Pressable
                        accessibilityRole="button"
                        hitSlop={10}
                        onPress={() => setShowPassword((current) => !current)}
                      >
                        <Feather
                          name={showPassword ? "eye" : "eye-off"}
                          size={18}
                          color={colors.textMuted}
                        />
                      </Pressable>
                    }
                  />
                </View>

                <Pressable style={styles.forgotAction} onPress={() => undefined}>
                  <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                </Pressable>
              </View>

              <View style={styles.actionsBlock}>
                <Pressable onPress={enterApp} style={styles.primaryButtonShadow}>
                  <LinearGradient
                    colors={["#3E7B1D", "#1E4B10"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>Entrar</Text>
                  </LinearGradient>
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OU</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable style={styles.secondaryButton} onPress={enterApp}>
                  <Text style={styles.secondaryButtonText}>Acessar sem login</Text>
                </Pressable>
              </View>

              <Text style={styles.footer}>Sigma Lithium (c) 2026</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  hero: {
    minHeight: 330,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  orbPrimary: {
    width: 220,
    height: 220,
    top: -50,
    right: -70,
  },
  orbSecondary: {
    width: 190,
    height: 190,
    bottom: 28,
    left: -90,
  },
  orbTertiary: {
    width: 120,
    height: 120,
    bottom: 100,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  logoImage: {
    width: 316,
    height: 170,
  },
  card: {
    marginHorizontal: spacing.md,
    marginTop: -10,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    ...shadows.card,
  },
  title: {
    color: "#31353B",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: -spacing.sm,
    color: "#7B8089",
    fontSize: typography.body,
  },
  formBlock: {
    gap: spacing.md,
  },
  labelBlock: {
    gap: spacing.xs,
  },
  label: {
    color: "#353943",
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  fieldShell: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: "#F1F3F7",
    borderWidth: 1,
    borderColor: "#EEF1F6",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    color: "#353943",
    fontSize: typography.body,
    paddingVertical: spacing.sm,
  },
  forgotAction: {
    alignSelf: "flex-end",
    paddingVertical: 2,
  },
  forgotText: {
    color: "#355F23",
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  actionsBlock: {
    gap: spacing.md,
  },
  primaryButtonShadow: {
    borderRadius: radius.pill,
    ...shadows.soft,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E1E5EB",
  },
  dividerText: {
    color: "#8B9098",
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: "#30591D",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#30591D",
    fontSize: typography.body,
    fontWeight: "800",
  },
  footer: {
    marginTop: spacing.xs,
    color: "#7F848C",
    textAlign: "center",
    fontSize: typography.bodySmall,
  },
});
