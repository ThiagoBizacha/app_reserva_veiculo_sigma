import { router } from "expo-router";
import { EmptyState, PrimaryButton, ScreenContainer } from "@/components";

export function CheckFlowScreen() {
  return (
    <ScreenContainer>
      <EmptyState
        icon="check-square"
        title="Operacoes centralizadas em Minhas Reservas"
        description="Para reduzir caminhos duplicados, a retirada e a devolucao agora acontecem no detalhe de cada reserva."
      />
      <PrimaryButton label="Abrir Minhas Reservas" onPress={() => router.replace("/(tabs)/reservations")} />
    </ScreenContainer>
  );
}
