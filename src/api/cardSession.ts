import AsyncStorage from "@react-native-async-storage/async-storage";

// In-progress direct-API card session. Persisted so navigation, reload, or
// Fast Refresh between charge steps can resume instead of dying with
// "Session expired".
//
// SECURITY: only the transaction reference, the pending step, and
// non-sensitive routing context are stored. Raw card fields (PAN, CVV, PIN)
// must NEVER be written here — re-entry is required after a remount.

export type CardPendingStep = "pin" | "avs" | "otp" | "redirect";

export interface CardSession {
  tx_ref: string;
  step: CardPendingStep;
  agreementId?: string;
  orderId?: string;
  category: string;
  amount: number;
  savedAt: number;
}

const STORAGE_KEY = "flw_card_session_v1";
export const CARD_SESSION_TTL_MS = 15 * 60 * 1000;

export async function saveCardSession(session: Omit<CardSession, "savedAt">): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, savedAt: Date.now() }));
  } catch {
    // Storage unavailable — session simply won't survive a remount.
  }
}

export async function loadCardSession(): Promise<CardSession | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CardSession;
    if (!parsed?.tx_ref || !parsed?.step || !parsed?.savedAt) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (Date.now() - parsed.savedAt > CARD_SESSION_TTL_MS) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearCardSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function sessionTargetMatches(
  session: CardSession,
  target: { agreementId?: string; orderId?: string; category: string; amount: number },
): boolean {
  return (
    (session.agreementId || "") === (target.agreementId || "") &&
    (session.orderId || "") === (target.orderId || "") &&
    session.category === target.category &&
    Number(session.amount) === Number(target.amount)
  );
}
