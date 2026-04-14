import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BackHeaderButton, Card, FormField, PageHeader, PrimaryButton, ScreenContainer, SecondaryButton } from "@/components";
import { useAuthSession } from "@/hooks/useAuthSession";
import { colors, spacing, typography } from "@/theme";

export function PasswordSetupScreen() {
  const {
    authError,
    clearAuthError,
    isSubmitting,
    mustChangePassword,
    signOut,
    updatePassword,
  } = useAuthSession();
  const [nextPassword, setNextPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    clearAuthError();
    setSuccessMessage(null);

    const result = await updatePassword(nextPassword, confirmation);

    if (!result.success) {
      return;
    }

    setSuccessMessage(
      mustChangePassword
        ? "Senha definitiva salva. O app vai liberar o acesso completo agora."
        : "Senha atualizada com sucesso."
    );

    setNextPassword("");
    setConfirmation("");

    if (!mustChangePassword) {
      router.back();
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ScreenContainer scroll={false}>
      <PageHeader
        title={mustChangePassword ? "Definir nova senha" : "Alterar senha"}
        eyebrow={mustChangePassword ? "Primeiro acesso" : "Segurança da conta"}
        leftAction={!mustChangePassword ? <BackHeaderButton /> : undefined}
      />

      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>
            {mustChangePassword ? "Troque a senha temporaria agora" : "Atualize sua senha"}
          </Text>
          <Text style={styles.description}>
            {mustChangePassword
              ? "Voce entrou com a senha temporaria. Antes de usar o app, defina uma senha pessoal para ficar salva no Supabase Auth."
              : "Defina uma nova senha para sua conta. A alteracao fica salva e passa a valer nos proximos logins."}
          </Text>

          <View style={styles.formStack}>
            <FormField
              label="Nova senha"
              placeholder="Minimo de 6 digitos"
              value={nextPassword}
              onChangeText={(value) => {
                clearAuthError();
                setSuccessMessage(null);
                setNextPassword(value);
              }}
              secureTextEntry
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={12}
            />
            <FormField
              label="Confirmar nova senha"
              placeholder="Repita os 6 digitos"
              value={confirmation}
              onChangeText={(value) => {
                clearAuthError();
                setSuccessMessage(null);
                setConfirmation(value);
              }}
              secureTextEntry
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={12}
            />
          </View>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <View style={styles.actions}>
            <PrimaryButton
              label={isSubmitting ? "Salvando senha..." : "Salvar nova senha"}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={isSubmitting}
            />

            {mustChangePassword ? (
              <SecondaryButton
                label="Sair"
                onPress={() => {
                  void handleSignOut();
                }}
                disabled={isSubmitting}
              />
            ) : null}
          </View>

          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primaryDark} />
              <Text style={styles.loadingText}>Persistindo nova senha...</Text>
            </View>
          ) : null}
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "800",
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  formStack: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.bodySmall,
    lineHeight: 20,
    fontWeight: "700",
  },
  successText: {
    color: colors.primaryDark,
    fontSize: typography.bodySmall,
    lineHeight: 20,
    fontWeight: "700",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
});
