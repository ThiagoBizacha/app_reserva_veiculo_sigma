import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components";
import { useReservationStore } from "@/hooks/useReservationStore";
import { colors, radius, spacing, typography } from "@/theme";
import { formatDate } from "@/utils/date";

type FleetFilter = "Todos" | "Disponivel" | "Em uso" | "Manutencao";

const filterLabel: Record<FleetFilter, string> = {
  Todos: "Todos",
  Disponivel: "Disponível",
  "Em uso": "Em Uso",
  Manutencao: "Manutenção",
};

const statusMeta = {
  Disponivel: { color: "#1D8E34", border: "#1D8E34", action: "Ver Agenda" },
  "Em uso": { color: "#F08A00", border: "#F08A00", action: "Ver Reserva" },
  Manutencao: { color: "#D72828", border: "#D72828", action: "Remanejar Reservas" },
  Reservado: { color: "#1C8C62", border: "#1C8C62", action: "Ver Agenda" },
};

export function ResourcesScreen() {
  const { resources, reservations } = useReservationStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FleetFilter>("Todos");

  const vehicles = resources.filter((item) => item.category === "Veiculo");
  const filtered = useMemo(() => {
    return vehicles.filter((resource) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        resource.name.toLowerCase().includes(query) ||
        resource.code.toLowerCase().includes(query) ||
        resource.location.toLowerCase().includes(query);
      const matchesFilter = filter === "Todos" || resource.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, vehicles]);

  const counts = {
    Todos: vehicles.length,
    Disponivel: vehicles.filter((item) => item.status === "Disponivel").length,
    "Em uso": vehicles.filter((item) => item.status === "Em uso").length,
    Manutencao: vehicles.filter((item) => item.status === "Manutencao").length,
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Frota de Veículos</Text>
        <Pressable style={styles.plusButton} onPress={() => router.push("/reservation/new")}>
          <Feather name="plus" size={22} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={18} color="#8B8B8B" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar veículo, placa..."
          placeholderTextColor="#8B8B8B"
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(["Todos", "Disponivel", "Em uso", "Manutencao"] as FleetFilter[]).map((item) => {
          const active = filter === item;
          const metaColor = item === "Todos" ? "#258A2E" : statusMeta[item].color;
          return (
            <Pressable
              key={item}
              style={[
                styles.filterChip,
                { borderColor: metaColor, backgroundColor: active ? `${metaColor}16` : colors.surface },
              ]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterChipText, { color: metaColor }]}>
                {filterLabel[item]} ({counts[item]})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.list}>
        {filtered.map((resource) => {
          const meta = statusMeta[resource.status];
          const latestReservation = reservations.find((item) => item.resourceId === resource.id);

          return (
            <Pressable key={resource.id} style={styles.vehicleCard} onPress={() => router.push(`/resource/${resource.id}`)}>
              <View style={[styles.cardBorder, { backgroundColor: meta.border }]} />
              <View style={styles.cardTop}>
                <View style={styles.titleRow}>
                  <Feather name="truck" size={20} color="#8A8A8A" />
                  <Text style={styles.vehicleName}>{resource.name}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: meta.color }]}>
                  <Text style={styles.statusPillText}>
                    {resource.status === "Manutencao" ? "Manutenção" : resource.status}
                  </Text>
                </View>
              </View>

              <View style={styles.metaGrid}>
                <Text style={styles.metaText}>Placa: {resource.code.replace("VEI-", "ABC-")}</Text>
                <Text style={styles.metaText}>Local: {resource.location}</Text>
                <Text style={styles.metaText}>
                  {resource.status === "Disponivel"
                    ? `Livre até: ${resource.nextAvailableAt ? formatDate(resource.nextAvailableAt) : "Hoje"}`
                    : resource.status === "Em uso"
                      ? `Usuário: Thiago N. | Retorno: 05/03 20:00`
                      : `Revisão 50.000km | Prev. retorno: 08/03`}
                </Text>
                <Text style={styles.metaText}>Resp: {resource.responsible}</Text>
              </View>

              <Text style={[styles.linkAction, { color: meta.color }]}>
                {latestReservation ? meta.action : "Ver Agenda"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: "#29631B",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
  },
  plusButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#2DA13B",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DADADA",
    minHeight: 52,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: "#3D3D3D",
    fontSize: typography.body,
  },
  filterRow: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: {
    fontSize: typography.caption,
    fontWeight: "700",
  },
  list: {
    gap: spacing.md,
  },
  vehicleCard: {
    position: "relative",
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardBorder: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 7,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#202020",
    flexShrink: 1,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusPillText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  metaGrid: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  metaText: {
    color: "#585858",
    fontSize: typography.body,
  },
  linkAction: {
    textAlign: "right",
    marginTop: spacing.md,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
