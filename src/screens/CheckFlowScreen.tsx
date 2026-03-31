import { router } from "expo-router";
import {
  BackHeaderButton,
  EmptyState,
  ExitHeaderButton,
  PageHeader,
  PrimaryButton,
  ScreenContainer,
} from "@/components";

export function CheckFlowScreen() {
  return (
    <ScreenContainer
      header={
        <PageHeader
          title="Operações"
          subtitle="As retiradas e devoluções agora acontecem dentro das reservas ativas."
          leftAction={<BackHeaderButton onPress={() => router.replace("/(tabs)/reservations")} />}
          rightContent={<ExitHeaderButton variant="light" compact />}
        />
      }
    >
      <EmptyState
        icon="check-square"
        title="Operações centralizadas em Minhas Reservas"
        description="Para reduzir caminhos duplicados, a retirada e a devolução agora acontecem no detalhe de cada reserva."
      />
      <PrimaryButton label="Abrir Minhas Reservas" onPress={() => router.replace("/(tabs)/reservations")} />
    </ScreenContainer>
  );
}

