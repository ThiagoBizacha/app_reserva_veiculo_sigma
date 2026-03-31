import { router } from "expo-router";
import { BackHeaderButton, EmptyState, PageHeader, PrimaryButton, ScreenContainer } from "@/components";

export function CheckFlowScreen() {
  return (
    <ScreenContainer
      header={
        <PageHeader
          title={"Opera\u00e7\u00f5es"}
          leftAction={<BackHeaderButton onPress={() => router.replace("/(tabs)/reservations")} />}
        />
      }
    >
      <EmptyState
        icon="check-square"
        title={"Opera\u00e7\u00f5es centralizadas em Minhas Reservas"}
        description={
          "Para reduzir caminhos duplicados, a retirada e a devolu\u00e7\u00e3o agora acontecem no detalhe de cada reserva."
        }
      />
      <PrimaryButton label="Abrir Minhas Reservas" onPress={() => router.replace("/(tabs)/reservations")} />
    </ScreenContainer>
  );
}
