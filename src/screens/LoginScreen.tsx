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
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
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
  compact?: boolean;
}

function LoginField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  trailing,
  compact = false,
}: LoginFieldProps) {
  return (
    <View style={[styles.fieldShell, compact && styles.fieldShellCompact]}>
      <Feather name={icon} size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, compact && styles.inputCompact]}
      />
      {trailing}
    </View>
  );
}

export function LoginScreen() {
  const { height, width } = useWindowDimensions();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isCompact = height <= 780;
  const isShort = height <= 700;
  const heroHeight = isShort ? 200 : isCompact ? 236 : 288;
  const logoWidth = Math.min(width * 0.62, isShort ? 240 : isCompact ? 278 : 316);
  const logoHeight = isShort ? 124 : isCompact ? 146 : 170;

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
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <View style={styles.screenFrame}>
            <View style={[styles.hero, { minHeight: heroHeight, paddingTop: isShort ? spacing.lg : spacing.xl }]}>
              <View style={[styles.orb, styles.orbPrimary]} />
              <View style={[styles.orb, styles.orbSecondary]} />
              <View style={[styles.orb, styles.orbTertiary]} />
              <Image
                source={sigmaLogo}
                style={[styles.logoImage, { width: logoWidth, height: logoHeight }]}
                resizeMode="contain"
              />
            </View>

            <View
              style={[
                styles.card,
                isCompact && styles.cardCompact,
                isShort && styles.cardShort,
              ]}
            >
              <Text style={[styles.title, isShort && styles.titleCompact]}>Bem-vindo</Text>
              <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
                Faça login para continuar
              </Text>

              <View style={[styles.formBlock, isCompact && styles.formBlockCompact]}>
                <View style={styles.labelBlock}>
                  <Text style={styles.label}>Usuário</Text>
                  <LoginField
                    compact={isCompact}
                    icon="user"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChangeText={setUsername}
                  />
                </View>

                <View style={styles.labelBlock}>
                  <Text style={styles.label}>Senha</Text>
                  <LoginField
                    compact={isCompact}
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

              <View style={[styles.actionsBlock, isCompact && styles.actionsBlockCompact]}>
                <Pressable onPress={enterApp} style={styles.primaryButtonShadow}>
                  <LinearGradient
                    colors={["#3E7B1D", "#1E4B10"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[styles.primaryButton, isCompact && styles.actionButtonCompact]}
                  >
                    <Text style={styles.primaryButtonText}>Entrar</Text>
                  </LinearGradient>
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OU</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={[styles.secondaryButton, isCompact && styles.actionButtonCompact]}
                  onPress={enterApp}
                >
                  <Text style={styles.secondaryButtonText}>Acessar sem login</Text>
                </Pressable>
              </View>

              <Text style={[styles.footer, isCompact && styles.footerCompact]}>Sigma Lithium (c) 2026</Text>
            </View>
          </View>
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
  screenFrame: {
    flex: 1,
    justifyContent: "flex-end",
  },
  hero: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    overflow: "hidden",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
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
    marginTop: -10,
    marginHorizontal: spacing.md,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
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
  cardCompact: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  cardShort: {
    paddingHorizontal: spacing.md,
  },
  title: {
    color: "#31353B",
    fontSize: 22,
    fontWeight: "800",
  },
  titleCompact: {
    fontSize: typography.section,
  },
  subtitle: {
    marginTop: -spacing.sm,
    color: "#7B8089",
    fontSize: typography.body,
  },
  subtitleCompact: {
    fontSize: typography.bodySmall,
  },
  formBlock: {
    gap: spacing.md,
  },
  formBlockCompact: {
    gap: spacing.sm,
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
  fieldShellCompact: {
    minHeight: 46,
  },
  input: {
    flex: 1,
    color: "#353943",
    fontSize: typography.body,
    paddingVertical: spacing.sm,
  },
  inputCompact: {
    fontSize: typography.bodySmall,
    paddingVertical: spacing.xs,
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
  actionsBlockCompact: {
    gap: spacing.sm,
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
  actionButtonCompact: {
    minHeight: 48,
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
  footerCompact: {
    marginTop: 0,
    fontSize: typography.caption,
  },
});

