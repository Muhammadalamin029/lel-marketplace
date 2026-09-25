import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { authApi } from "@/api";

export type StrengthLevel = "Weak" | "Fair" | "Good" | "Excellent";

const LEVEL_COLORS: Record<StrengthLevel, string> = {
  Weak: "#ef4444",
  Fair: "#ff4b26",
  Good: "#22c55e",
  Excellent: "#16a34a",
};

function localScore(password: string): { level: StrengthLevel; score: number } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  const unique = new Set(password).size;
  if (password.length > 0 && unique >= password.length * 0.7) score += 1;
  const level: StrengthLevel =
    score <= 2 ? "Weak" : score <= 4 ? "Fair" : score <= 6 ? "Good" : "Excellent";
  return { level, score };
}

/**
 * Password strength meter mirroring web's policy meter + server-side
 * POST /auth/check-password-strength (debounced). Falls back to the local
 * score (same algorithm as backend) when offline.
 */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const [serverLevel, setServerLevel] = useState<StrengthLevel | null>(null);
  const [serverFeedback, setServerFeedback] = useState<string[]>([]);

  useEffect(() => {
    if (!password) {
      setServerLevel(null);
      setServerFeedback([]);
      return;
    }
    const t = setTimeout(() => {
      authApi
        .checkPasswordStrength(password)
        .then((res) => {
          setServerLevel(res.strength.strength);
          setServerFeedback(res.strength.feedback ?? []);
        })
        .catch(() => {
          setServerLevel(null);
          setServerFeedback([]);
        });
    }, 600);
    return () => clearTimeout(t);
  }, [password]);

  if (!password) return null;

  const local = localScore(password);
  const level = serverLevel ?? local.level;
  const feedback = serverFeedback;
  const color = LEVEL_COLORS[level];
  const filled = Math.min(4, Math.max(1, Math.ceil(((serverLevel ? local.score : local.score) / 8) * 4)));

  return (
    <View className="gap-1.5 mt-1">
      <View className="flex-row gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className="flex-1 h-1.5 rounded-full"
            style={{ backgroundColor: i < filled ? color : "#e5e7eb" }}
          />
        ))}
      </View>
      <Text className="text-xs font-grotesk-bold" style={{ color }}>
        {level}
        {feedback.length > 0 ? ` — ${feedback[0]}` : ""}
      </Text>
    </View>
  );
}
