import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Clipboard } from "react-native";
import { Copy, Check, AlertCircle, RefreshCw, CheckCircle } from "lucide-react-native";
import { ordersApi } from "@/api";
import type { BankTransferDetails } from "@/api";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";

interface BankTransferPanelProps {
  category: "order" | "asset_deposit" | "asset_installment" | "full_pay";
  orderId?: string;
  agreementId?: string;
  amount: number;
  email: string;
  onSuccess: () => void;
}

type PanelStatus = "loading" | "pending" | "success" | "expired" | "error";

function DetailRow({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <View className="flex-row justify-between items-center py-2.5 border-b border-gray-50">
      <Text className="text-sm text-gray-500">{label}</Text>
      <View className="flex-row items-center gap-2 max-w-[65%]">
        <Text className="text-sm font-bold text-gray-900 text-right" numberOfLines={1}>{value}</Text>
        {onCopy && (
          <TouchableOpacity onPress={handleCopy}>
            {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="#9ca3af" />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BankTransferPanel({ category, orderId, agreementId, amount, email, onSuccess }: BankTransferPanelProps) {
  const [details, setDetails] = useState<BankTransferDetails | null>(null);
  const [status, setStatus] = useState<PanelStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const clearCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
  };

  const generate = useCallback(async () => {
    clearCountdown();
    setStatus("loading");
    setError(null);
    setDetails(null);
    setSecondsLeft(null);

    try {
      const response = await ordersApi.initializeBankTransfer({
        category,
        amount,
        email,
        ...(orderId ? { order_id: orderId } : {}),
        ...(agreementId ? { agreement_id: agreementId } : {}),
      });
      if (!isMountedRef.current) return;

      setDetails(response);
      setStatus("pending");

      if (response.expires_at) {
        const expiresAt = new Date(response.expires_at).getTime();
        const tick = () => {
          const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
          setSecondsLeft(diff);
          if (diff <= 0) {
            clearCountdown();
            setStatus((current) => (current === "pending" ? "expired" : current));
          }
        };
        tick();
        countdownRef.current = setInterval(tick, 1000);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setError(err?.response?.data?.detail || err?.message || "Failed to generate bank transfer details");
      setStatus("error");
    }
  }, [category, orderId, agreementId, amount, email]);

  useEffect(() => {
    isMountedRef.current = true;
    generate();
    return () => {
      isMountedRef.current = false;
      clearCountdown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIveSentIt = async () => {
    if (!details) return;
    setCheckingPayment(true);
    try {
      await ordersApi.verifyPayment(details.reference);
      if (!isMountedRef.current) return;
      clearCountdown();
      setStatus("success");
      onSuccess();
    } catch {
      if (!isMountedRef.current) return;
      Alert.alert(
        "Payment not received yet",
        "We haven't received your transfer yet. Please try again shortly after transferring."
      );
    } finally {
      if (isMountedRef.current) setCheckingPayment(false);
    }
  };

  const handleCopy = (value: string, label: string) => {
    Clipboard.setString(value);
    Alert.alert("Copied", `${label} copied to clipboard.`);
  };

  if (status === "loading") {
    return (
      <View className="items-center justify-center py-10 gap-3">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-sm font-semibold text-gray-500">Generating bank transfer details…</Text>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View className="items-center justify-center py-10 gap-3">
        <AlertCircle size={40} color="#ef4444" />
        <Text className="text-base font-bold text-red-600">Could not generate transfer details</Text>
        {error && <Text className="text-sm text-center px-4 text-gray-500">{error}</Text>}
        <TouchableOpacity onPress={generate} className="border border-gray-200 px-5 py-2.5 rounded-xl">
          <Text className="text-sm font-semibold text-gray-700">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === "expired") {
    return (
      <View className="items-center justify-center py-10 gap-3">
        <AlertCircle size={40} color="#f59e0b" />
        <Text className="text-base font-bold text-amber-600">Account number expired</Text>
        <Text className="text-sm text-center px-4 text-gray-500">
          This transfer window has closed. Generate a new account number to continue.
        </Text>
        <TouchableOpacity
          onPress={generate}
          className="bg-amber-400 px-5 py-3 rounded-2xl flex-row items-center gap-2"
          style={shadow.btn}
        >
          <RefreshCw size={16} color="#fff" />
          <Text className="text-sm font-bold text-white">Generate New Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === "success") {
    return (
      <View className="items-center justify-center py-10 gap-3">
        <CheckCircle size={44} color="#22c55e" />
        <Text className="text-base font-bold text-green-600">Payment Received!</Text>
      </View>
    );
  }

  if (!details) return null;

  return (
    <View className="gap-4">
      <View className="bg-gray-50 rounded-2xl px-4 py-1 border border-gray-100">
        <DetailRow label="Bank" value={details.bank_name} />
        <DetailRow
          label="Account Number"
          value={details.account_number}
          onCopy={() => handleCopy(details.account_number, "Account number")}
        />
        <DetailRow label="Account Name" value={details.account_name} />
        <DetailRow label="Amount" value={fmt(Number(details.amount))} />
        <DetailRow
          label="Reference"
          value={details.reference}
          onCopy={() => handleCopy(details.reference, "Reference")}
        />
      </View>

      {secondsLeft !== null && (
        <Text className="text-center text-sm text-gray-500">
          This account number expires in <Text className="font-bold text-gray-900">{formatCountdown(secondsLeft)}</Text>
        </Text>
      )}

      <View className="bg-amber-50 border border-amber-100 rounded-xl p-3">
        <Text className="text-xs text-amber-800 leading-relaxed">
          Transfer the exact amount above to the account shown, then tap the button below once you've sent it.
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleIveSentIt}
        disabled={checkingPayment}
        className="bg-amber-400 py-3.5 rounded-2xl items-center flex-row justify-center gap-2"
        style={shadow.btn}
      >
        {checkingPayment ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold text-sm">I've Sent It</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
