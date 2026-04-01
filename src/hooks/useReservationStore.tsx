import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  currentUserId,
  reservations as initialReservations,
  resources as initialResources,
  users as initialUsers,
} from "@/data";
import type {
  NewReservationPayload,
  NewUserPayload,
  NewVehiclePayload,
  Reservation,
  ReservationInspection,
  ReservationOperationPayload,
  Resource,
  ResourceStatus,
  User,
} from "@/types";
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type CalendarDayState,
  getActionableReservationsForUser,
  isScheduledReservationActive,
  getCurrentResourceStatus,
  getFleetSummary,
  getResourceAvailabilityForDate,
  getResourceConflicts,
  getResourceReservations,
  getReservationsForResourceDay,
  isResourceInMaintenanceOnDate,
} from "@/utils/reservations";
import { getDurationHours, isSameCalendarDay } from "@/utils/date";
import { buildReservationsCsv, downloadCsvForExcel } from "@/utils/export";
import {
  hasSignature,
  parseMileageValue,
} from "@/utils/operation";
import {
  getNextReservationCode,
  normalizeReservationCodes,
} from "@/utils/reservationCode";
import { findUserByReference } from "@/utils/users";

interface ActionResult {
  success: boolean;
  message: string;
  reservation?: Reservation;
  resource?: Resource;
  user?: User;
  fileUri?: string;
}

interface ReservationStoreValue {
  users: User[];
  resources: Resource[];
  reservations: Reservation[];
  currentUser: User;
  currentUserId: string;
  currentUserName: string;
  toggleResourceMaintenance: (resourceId: string) => void;
  createVehicle: (payload: NewVehiclePayload) => ActionResult;
  createUser: (payload: NewUserPayload) => ActionResult;
  updateVehicle: (resourceId: string, payload: NewVehiclePayload) => ActionResult;
  updateUser: (userId: string, payload: NewUserPayload) => ActionResult;
  createReservation: (payload: NewReservationPayload) => ActionResult;
  cancelReservation: (reservationId: string) => ActionResult;
  checkInReservation: (reservationId: string, payload: ReservationOperationPayload) => ActionResult;
  checkOutReservation: (reservationId: string, payload: ReservationOperationPayload) => ActionResult;
  exportReservationsReport: () => Promise<ActionResult>;
  getResourceStatus: (resourceId: string, referenceDate?: Date) => ResourceStatus;
  getReservationsForResource: (resourceId: string) => Reservation[];
  getReservationsForDay: (resourceId: string, date: Date) => Reservation[];
  getAvailabilityForDate: (
    resourceId: string,
    date: Date
  ) => { state: CalendarDayState; reservations: Reservation[]; isAvailable: boolean };
  getActionableReservations: () => Reservation[];
  getSummary: (referenceDate?: Date) => {
    total: number;
    available: number;
    reserved: number;
    inUse: number;
    maintenance: number;
  };
}

const STORAGE_KEYS = {
  mockeersion: "@sigma-reserva/mock-version",
  reservations: "@sigma-reserva/reservations",
  resources: "@sigma-reserva/resources",
  users: "@sigma-reserva/users",
};

const MOCK_DATA_eERSION = "2026-04-01-clean-reservation-base-v1";

const freshStartResources = initialResources.map((resource) =>
  resource.category === "Veiculo"
    ? {
        ...resource,
        status: "Disponivel" as const,
        nextAvailableAt: undefined,
      }
    : resource
);

const ReservationStoreContext = createContext<ReservationStoreValue | null>(null);

export function ReservationStoreProvider({ children }: PropsWithChildren) {
  const [usersData, setUsersData] = useState(initialUsers);
  const [resources, setResources] = useState(freshStartResources);
  const [reservations, setReservations] = useState(() => normalizeReservationCodes(initialReservations));
  const [isHydrated, setIsHydrated] = useState(false);

  const currentUser =
    usersData.find((user) => user.id === currentUserId) ?? usersData[0] ?? initialUsers[0];
  const currentUserName = currentUser?.name ?? "Usuario";

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const [storedeersion, storedReservations, storedResources, storedUsers] = await AsyncStorage.multiGet([
          STORAGE_KEYS.mockeersion,
          STORAGE_KEYS.reservations,
          STORAGE_KEYS.resources,
          STORAGE_KEYS.users,
        ]);

        if (!active) {
          return;
        }

        const versionealue = storedeersion[1];
        const reservationsealue = storedReservations[1];
        const resourcesealue = storedResources[1];
        const usersealue = storedUsers[1];
        const shouldResetToLatestMocks = versionealue !== MOCK_DATA_eERSION;

        if (shouldResetToLatestMocks) {
          const nextUsers = usersealue ? (JSON.parse(usersealue) as User[]) : initialUsers;

          setUsersData(nextUsers);
          setReservations(normalizeReservationCodes(initialReservations));
          setResources(freshStartResources);
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.mockeersion, MOCK_DATA_eERSION],
            [STORAGE_KEYS.reservations, JSON.stringify(normalizeReservationCodes(initialReservations))],
            [STORAGE_KEYS.resources, JSON.stringify(freshStartResources)],
            [STORAGE_KEYS.users, JSON.stringify(nextUsers)],
          ]);
          return;
        }

        if (reservationsealue) {
          setReservations(normalizeReservationCodes(JSON.parse(reservationsealue) as Reservation[]));
        }

        if (resourcesealue) {
          setResources(JSON.parse(resourcesealue));
        }

        if (usersealue) {
          setUsersData(JSON.parse(usersealue));
        }
      } catch {
        // Keep bundled mocks when local storage is unavailable.
      } finally {
        if (active) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void AsyncStorage.multiSet([
      [STORAGE_KEYS.mockeersion, MOCK_DATA_eERSION],
      [STORAGE_KEYS.reservations, JSON.stringify(reservations)],
      [STORAGE_KEYS.resources, JSON.stringify(resources)],
      [STORAGE_KEYS.users, JSON.stringify(usersData)],
    ]);
  }, [isHydrated, reservations, resources, usersData]);

  const appendHistoryItem = (
    reservation: Reservation,
    label: string,
    note?: string
  ): Reservation["history"] => [
    {
      id: `hist-${Date.now()}`,
      label,
      timestamp: new Date().toISOString(),
      actor: currentUserName,
      note,
    },
    ...reservation.history,
  ];

  const getResourceStatus = (resourceId: string, referenceDate = new Date()) => {
    const resource = resources.find((item) => item.id === resourceId);
    if (!resource) {
      return "Disponivel" as const;
    }

    return getCurrentResourceStatus(resource, reservations, referenceDate);
  };

  const getReservationsForResource = (resourceId: string) =>
    getResourceReservations(reservations, resourceId);

  const getReservationsForDay = (resourceId: string, date: Date) =>
    getReservationsForResourceDay(reservations, resourceId, date);

  const getAvailabilityForDate = (resourceId: string, date: Date) => {
    const resource = resources.find((item) => item.id === resourceId);

    if (!resource) {
      return { state: "disponivel" as const, reservations: [], isAvailable: false };
    }

    return getResourceAvailabilityForDate(resource, reservations, date);
  };

  const getActionableReservations = () =>
    getActionableReservationsForUser(reservations, currentUserId);

  const getSummary = (referenceDate = new Date()) =>
    getFleetSummary(resources, reservations, referenceDate);

  const toggleResourceMaintenance = (resourceId: string) => {
    setResources((current) =>
      current.map((resource) =>
        resource.id === resourceId
          ? {
              ...resource,
              status: resource.status === "Manutencao" ? "Disponivel" : "Manutencao",
              nextAvailableAt:
                resource.status === "Manutencao"
                  ? undefined
                  : new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      new Date().getDate() + 3,
                      18,
                      0,
                      0
                    ).toISOString(),
            }
          : resource
      )
    );
  };

  const validateVehiclePayload = (payload: NewVehiclePayload, resourceId?: string) => {
    const requiredFields = [
      payload.name,
      payload.code,
      payload.plate,
      payload.brand,
      payload.model,
      payload.year,
      payload.currentMileage,
      payload.description,
    ];

    if (requiredFields.some((field) => !field.trim())) {
      return "Preencha todos os campos obrigatórios do veículo.";
    }

    if (
      resources.some(
        (item) =>
          item.id !== resourceId && item.code.toLowerCase() === payload.code.trim().toLowerCase()
      )
    ) {
      return "Já existe um veículo com esse código.";
    }

    if (
      resources.some(
        (item) =>
          item.id !== resourceId &&
          item.plate?.toLowerCase() === payload.plate.trim().toLowerCase()
      )
    ) {
      return "Já existe um veículo com essa placa.";
    }

    return null;
  };

  const buildVehicleRecord = (
    payload: NewVehiclePayload,
    existingResource?: Resource
  ): Resource => {
    const vehicleCount = resources.filter((item) => item.category === "Veiculo").length + 1;
    const normalizedName = payload.name.trim();
    const normalizedCode = payload.code.trim().toUpperCase();
    const normalizedPlate = payload.plate.trim().toUpperCase();
    const normalizedBrand = payload.brand.trim();
    const normalizedModel = payload.model.trim();
    const normalizedMileage = payload.currentMileage.trim();

    return {
      id: existingResource?.id ?? `res-${Date.now()}`,
      vehicleId:
        existingResource?.vehicleId ?? `VEH-${String(vehicleCount).padStart(3, "0")}`,
      name: normalizedName,
      code: normalizedCode,
      category: existingResource?.category ?? "Veiculo",
      status: existingResource?.status ?? "Disponivel",
      plate: normalizedPlate,
      model: normalizedModel,
      brand: normalizedBrand,
      year: payload.year.trim(),
      rentalCompany: payload.rentalCompany?.trim() || "Cadastro interno",
      vehicleCategory: payload.vehicleCategory,
      currentMileage: normalizedMileage,
      lastInspectionDate: existingResource?.lastInspectionDate ?? new Date().toISOString(),
      vehicleDocumentAttachment: payload.vehicleDocumentAttachment?.trim() || "",
      vehiclePhotoAttachments: existingResource?.vehiclePhotoAttachments ?? [],
      lastMaintenanceDate: existingResource?.lastMaintenanceDate ?? new Date().toISOString(),
      nextMaintenanceDate: payload.nextMaintenanceDate?.trim() || undefined,
      lastMaintenanceMileage: existingResource?.lastMaintenanceMileage ?? normalizedMileage,
      nextMaintenanceMileage: payload.nextMaintenanceMileage?.trim() || undefined,
      observation: payload.observation?.trim() || undefined,
      location: payload.location?.trim() || existingResource?.location || "Base interna",
      capacity: existingResource?.capacity ?? "5 lugares",
      description: payload.description.trim(),
      responsible: existingResource?.responsible || undefined,
      requiresApproval: payload.requiresApproval ?? true,
      imageHint: payload.vehicleCategory.toLowerCase(),
      nextAvailableAt: existingResource?.nextAvailableAt,
      tags: [payload.vehicleCategory, normalizedBrand, normalizedModel].filter(Boolean),
    };
  };

  const createVehicle = (payload: NewVehiclePayload): ActionResult => {
    const validationError = validateVehiclePayload(payload);
    if (validationError) {
      return { success: false, message: validationError };
    }

    const resource = buildVehicleRecord(payload);

    setResources((current) => [resource, ...current]);

    return {
      success: true,
      message: `Veículo ${resource.code} cadastrado com sucesso.`,
      resource,
    };
  };

  const updateVehicle = (resourceId: string, payload: NewVehiclePayload): ActionResult => {
    const existingResource = resources.find((item) => item.id === resourceId);

    if (!existingResource) {
      return { success: false, message: "Veículo não encontrado." };
    }

    const validationError = validateVehiclePayload(payload, resourceId);
    if (validationError) {
      return { success: false, message: validationError };
    }

    const updatedResource = buildVehicleRecord(payload, existingResource);

    setResources((current) =>
      current.map((item) => (item.id === resourceId ? updatedResource : item))
    );

    return {
      success: true,
      message: `Veículo ${updatedResource.code} atualizado com sucesso.`,
      resource: updatedResource,
    };
  };

  const validateUserPayload = (payload: NewUserPayload, userId?: string) => {
    const requiredFields = [
      payload.name,
      payload.fullName,
      payload.cpf,
      payload.matricula,
      payload.areaDepartamento,
      payload.centroCusto,
      payload.emailCorporativo,
      payload.telefone,
      payload.cnhNumero,
      payload.cnhCategoria,
      payload.cnhUfEmissao,
    ];

    if (requiredFields.some((field) => !field.trim())) {
      return "Preencha todos os campos obrigatórios do usuário.";
    }

    if (
      usersData.some(
        (item) =>
          item.id !== userId &&
          item.matricula.toLowerCase() === payload.matricula.trim().toLowerCase()
      )
    ) {
      return "Já existe um usuário com essa matrícula.";
    }

    if (
      usersData.some(
        (item) =>
          item.id !== userId &&
          item.emailCorporativo.toLowerCase() === payload.emailCorporativo.trim().toLowerCase()
      )
    ) {
      return "Já existe um usuário com esse e-mail corporativo.";
    }

    if (
      usersData.some((item) => item.id !== userId && item.cpf === payload.cpf.trim())
    ) {
      return "Já existe um usuário com esse CPF.";
    }

    if (payload.gestorId?.trim() && !findUserByReference(usersData, payload.gestorId)) {
      return "Gestor não encontrado. Informe nome, e-mail, matrícula ou ID de um colaborador existente.";
    }

    return null;
  };

  const buildUserRecord = (payload: NewUserPayload, existingUser?: User): User => {
    const resolvedId = existingUser?.id ?? `usr-${Date.now()}`;
    const corporateEmail = payload.emailCorporativo.trim().toLowerCase();
    const resolvedManagerId = findUserByReference(usersData, payload.gestorId)?.id;

    return {
      id: resolvedId,
      userId: existingUser?.userId ?? resolvedId,
      name: payload.name.trim(),
      fullName: payload.fullName.trim(),
      cpf: payload.cpf.trim(),
      gestorVeiculo: payload.role !== "Solicitante",
      matricula: payload.matricula.trim().toUpperCase(),
      matriz: payload.matriz?.trim() || existingUser?.matriz || currentUser?.matriz || "Belo Horizonte",
      role: payload.role,
      area: payload.areaDepartamento.trim(),
      areaDepartamento: payload.areaDepartamento.trim(),
      centroCusto: payload.centroCusto.trim().toUpperCase(),
      email: corporateEmail,
      emailCorporativo: corporateEmail,
      telefone: payload.telefone.trim(),
      gestorId:
        resolvedManagerId ||
        existingUser?.gestorId ||
        currentUser?.gestorId ||
        currentUser?.id,
      cnhNumero: payload.cnhNumero.trim().toUpperCase(),
      cnhCategoria: payload.cnhCategoria.trim().toUpperCase(),
      cnhUfEmissao: payload.cnhUfEmissao.trim().toUpperCase(),
      cnhStatus: payload.cnhStatus,
      cnhDataUltimaValidacao: existingUser?.cnhDataUltimaValidacao ?? new Date().toISOString(),
      cnhAnexo: payload.cnhAnexo?.trim() || "",
      termosPaytrack: existingUser?.termosPaytrack ?? true,
      observacao: payload.observacao?.trim() || undefined,
    };
  };

  const createUser = (payload: NewUserPayload): ActionResult => {
    const validationError = validateUserPayload(payload);
    if (validationError) {
      return { success: false, message: validationError };
    }

    const user = buildUserRecord(payload);

    setUsersData((current) => [user, ...current]);

    return {
      success: true,
      message: `Usuário ${user.fullName} cadastrado com sucesso.`,
      user,
    };
  };

  const updateUser = (userId: string, payload: NewUserPayload): ActionResult => {
    const existingUser = usersData.find((item) => item.id === userId);

    if (!existingUser) {
      return { success: false, message: "Usuário não encontrado." };
    }

    const validationError = validateUserPayload(payload, userId);
    if (validationError) {
      return { success: false, message: validationError };
    }

    const updatedUser = buildUserRecord(payload, existingUser);

    setUsersData((current) =>
      current.map((item) => (item.id === userId ? updatedUser : item))
    );

    return {
      success: true,
      message: `Usuário ${updatedUser.fullName} atualizado com sucesso.`,
      user: updatedUser,
    };
  };

  const createReservation = (payload: NewReservationPayload): ActionResult => {
    if (
      !payload.resourceId ||
      !payload.startDate ||
      !payload.endDate ||
      !payload.purpose ||
      !payload.base
    ) {
      return { success: false, message: "Preencha todos os campos obrigatórios." };
    }

    if (new Date(payload.endDate) < new Date(payload.startDate)) {
      return { success: false, message: "A data final não pode ser menor que a data inicial." };
    }

    if (new Date(payload.startDate) < new Date()) {
      return {
        success: false,
        message: "Não é possível criar reservas com data ou horário no passado.",
      };
    }

    if (!isSameCalendarDay(payload.startDate, payload.endDate)) {
      return {
        success: false,
        message: "A reserva deve começar e terminar no mesmo dia.",
      };
    }

    const durationHours =
      payload.durationHours ?? getDurationHours(payload.startDate, payload.endDate);

    if (durationHours < 1 || durationHours > 4) {
      return {
        success: false,
        message: "A reserva deve ter duração mínima de 1 hora e máxima de 4 horas.",
      };
    }

    const resource = resources.find((item) => item.id === payload.resourceId);
    if (!resource) {
      return { success: false, message: "Recurso não encontrado." };
    }

    if (
      resource.status === "Manutencao" &&
      isResourceInMaintenanceOnDate(resource, new Date(payload.startDate))
    ) {
      return {
        success: false,
        message: "O veículo está em manutenção e não pode ser reservado neste período.",
      };
    }

    const conflicts = getResourceConflicts(
      reservations,
      payload.resourceId,
      payload.startDate,
      payload.endDate
    );

    if (conflicts.length > 0) {
      return {
        success: false,
        message: "Já existe uma reserva para o recurso no horário informado.",
      };
    }

    const reservation: Reservation = {
      id: `rsv-${Date.now()}`,
      code: getNextReservationCode(reservations, payload.startDate),
      resourceId: payload.resourceId,
      userId: currentUserId,
      title: `Reserva ${resource.name}`,
      purpose: payload.purpose,
      base: payload.base,
      startDate: payload.startDate,
      endDate: payload.endDate,
      plannedDurationHours: durationHours,
      status: "Reservado",
      notes: payload.notes,
      history: [
        {
          id: `hist-${Date.now()}`,
          label: "Reserva reservada",
          timestamp: new Date().toISOString(),
          actor: currentUserName,
          note: payload.notes,
        },
      ],
    };

    setReservations((current) => [reservation, ...current]);

    return {
      success: true,
      message: `Reserva criada para ${durationHours}h com status Reservado.`,
      reservation,
    };
  };

  const cancelReservation = (reservationId: string): ActionResult => {
    const reservation = reservations.find((item) => item.id === reservationId);

    if (!reservation) {
      return { success: false, message: "Reserva não encontrada." };
    }

    if (reservation.status !== "Reservado") {
      return {
        success: false,
        message: "Só é possível cancelar reservas ainda não utilizadas.",
      };
    }

    if (!isScheduledReservationActive(reservation)) {
      return {
        success: false,
        message: "A janela da reserva já foi encerrada e não permite cancelamento.",
      };
    }

    const updatedReservation: Reservation = {
      ...reservation,
      status: "Cancelada",
      history: appendHistoryItem(reservation, "Reserva cancelada"),
    };

    setReservations((current) =>
      current.map((item) => (item.id === reservationId ? updatedReservation : item))
    );

    return {
      success: true,
      message: "Reserva cancelada com sucesso.",
      reservation: updatedReservation,
    };
  };

  const validateOperationPayload = (
    mode: "checkin" | "checkout",
    reservation: Reservation,
    payload: ReservationOperationPayload
  ) => {
    if (!payload.mileage.trim()) {
      return mode === "checkin"
        ? "Informe a quilometragem de saída."
        : "Informe a quilometragem de retorno.";
    }

    if (!payload.fuelLevel) {
      return "Informe o nível de combustível.";
    }

    if (!payload.counterpartyName.trim()) {
      return mode === "checkin"
        ? "Informe quem entregou o veículo."
        : "Informe quem recebeu o veículo.";
    }

    if (!payload.confirmationChecked) {
      return "Confirme a vistoria para continuar.";
    }

    if (!hasSignature(payload.signature)) {
      return "A assinatura digital é obrigatória.";
    }

    if (payload.damageIdentified) {
      if (!payload.damageDescription?.trim()) {
        return "Descreva a avaria ou ocorrência identificada.";
      }

      if (payload.damagePhotos.length === 0) {
        return "Adicione ao menos uma foto da avaria.";
      }
    }

    if (mode === "checkout") {
      const startMileage = parseMileageValue(reservation.startMileage);
      const endMileage = parseMileageValue(payload.mileage);

      if (startMileage !== null && endMileage !== null && endMileage < startMileage) {
        return "A quilometragem final não pode ser menor que a quilometragem de saída.";
      }
    }

    return null;
  };

  const buildInspection = (
    mode: "checkin" | "checkout",
    payload: ReservationOperationPayload
  ): ReservationInspection => ({
    mode,
    inspectedAt: new Date().toISOString(),
    inspectedBy: currentUserName,
    counterpartyName: payload.counterpartyName,
    mileage: payload.mileage,
    fuelLevel: payload.fuelLevel,
    checklist: { ...payload.checklist, damageReported: payload.damageIdentified },
    notes: payload.notes,
    requiredPhotos: payload.requiredPhotos,
    additionalPhotos: payload.additionalPhotos,
    damagePhotos: payload.damagePhotos,
    damageIdentified: payload.damageIdentified,
    damageDescription: payload.damageDescription,
    confirmationChecked: payload.confirmationChecked,
    signature: payload.signature,
  });

  const checkInReservation = (
    reservationId: string,
    payload: ReservationOperationPayload
  ): ActionResult => {
    const reservation = reservations.find((item) => item.id === reservationId);

    if (!reservation) {
      return { success: false, message: "Reserva não encontrada." };
    }

    if (reservation.status !== "Reservado") {
      return {
        success: false,
        message: "Apenas reservas reservadas podem iniciar check-in.",
      };
    }

    if (!isScheduledReservationActive(reservation)) {
      return {
        success: false,
        message: "A janela da reserva já foi encerrada e não permite check-in.",
      };
    }

    const validationError = validateOperationPayload("checkin", reservation, payload);
    if (validationError) {
      return { success: false, message: validationError };
    }

    const inspection = buildInspection("checkin", payload);
    const updatedReservation: Reservation = {
      ...reservation,
      status: "Em uso",
      checkInAt: inspection.inspectedAt,
      checkInNotes: payload.notes,
      startMileage: payload.mileage,
      checkInChecklist: inspection.checklist,
      checkInFuelLevel: payload.fuelLevel,
      checkInData: inspection,
      history: appendHistoryItem(
        reservation,
        "Vistoria de saída concluída",
        payload.notes || `Km ${payload.mileage} | Combustível ${payload.fuelLevel}`
      ),
    };

    setReservations((current) =>
      current.map((item) => (item.id === reservationId ? updatedReservation : item))
    );

    return {
      success: true,
      message: "Check-in realizado. A reserva agora está em uso.",
      reservation: updatedReservation,
    };
  };

  const checkOutReservation = (
    reservationId: string,
    payload: ReservationOperationPayload
  ): ActionResult => {
    const reservation = reservations.find((item) => item.id === reservationId);

    if (!reservation) {
      return { success: false, message: "Reserva não encontrada." };
    }

    if (reservation.status !== "Em uso") {
      return {
        success: false,
        message: "Apenas reservas em uso podem finalizar check-out.",
      };
    }

    const validationError = validateOperationPayload("checkout", reservation, payload);
    if (validationError) {
      return { success: false, message: validationError };
    }

    const inspection = buildInspection("checkout", payload);
    const updatedReservation: Reservation = {
      ...reservation,
      status: "Concluida",
      checkOutAt: inspection.inspectedAt,
      checkOutNotes: payload.notes,
      endMileage: payload.mileage,
      checkOutChecklist: inspection.checklist,
      checkOutFuelLevel: payload.fuelLevel,
      checkOutData: inspection,
      history: appendHistoryItem(
        reservation,
        "Check-in de devolução concluído",
        payload.notes || `Km ${payload.mileage} | Combustível ${payload.fuelLevel}`
      ),
    };

    setReservations((current) =>
      current.map((item) => (item.id === reservationId ? updatedReservation : item))
    );

    return {
      success: true,
      message: "Check-out realizado. Reserva concluída e veículo disponível.",
      reservation: updatedReservation,
    };
  };

  const exportReservationsReport = async (): Promise<ActionResult> => {
    try {
      const filename = `reservas-sigma-${new Date().toISOString().slice(0, 10)}.csv`;
      const csv = buildReservationsCsv(reservations, resources, usersData);
      const result = await downloadCsvForExcel(filename, csv);

      return {
        success: true,
        message: result.message,
        fileUri: result.fileUri,
      };
    } catch {
      return {
        success: false,
        message: "Não foi possível gerar o arquivo de reservas.",
      };
    }
  };

  const value = useMemo(
    () => ({
      resources,
      reservations,
      users: usersData,
      currentUser,
      currentUserId,
      currentUserName,
      toggleResourceMaintenance,
      createVehicle,
      createUser,
      updateVehicle,
      updateUser,
      createReservation,
      cancelReservation,
      checkInReservation,
      checkOutReservation,
      exportReservationsReport,
      getResourceStatus,
      getReservationsForResource,
      getReservationsForDay,
      getAvailabilityForDate,
      getActionableReservations,
      getSummary,
    }),
    [currentUser, currentUserName, reservations, resources, usersData]
  );

  return (
    <ReservationStoreContext.Provider value={value}>
      {children}
    </ReservationStoreContext.Provider>
  );
}

export function useReservationStore() {
  const context = useContext(ReservationStoreContext);

  if (!context) {
    throw new Error("useReservationStore must be used inside ReservationStoreProvider");
  }

  return context;
}






