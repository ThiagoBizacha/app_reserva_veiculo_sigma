import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Reservation, Resource, User } from "@/types";

const CACHE_KEY = "@sigma-reserva/backend-cache-v1";

export interface CachedAppState {
  cachedAt: string;
  reservations: Reservation[];
  resources: Resource[];
  users: User[];
}

export async function readCachedAppState() {
  try {
    const rawValue = await AsyncStorage.getItem(CACHE_KEY);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as CachedAppState;
  } catch {
    return null;
  }
}

export async function writeCachedAppState(snapshot: CachedAppState) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore cache write failures. Remote data remains the source of truth.
  }
}

