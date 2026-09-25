import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Clipboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { CreditCard, AlertCircle, Package, FileText, Copy, Download } from "lucide-react-native";
import { fmt, formatDate } from "@/utils/format";
import { paymentsApi, getApiError } from "@/api";
import type { Payment } from "@/api";
import { downloadReceipt } from "@/lib/receipt";

const CATEGORY_LABELS: Record<string, string> = {
  order:             "Product Order Payment",
  asset_deposit:     "Asset Deposit",
  asset_installment: "Installment Payment",
  full_pay:          "Full Purchase Payment",
};

const METHOD_LABELS: Record<string, string> = {
  paystack: "Paystack",
  card:     "Card",
  bank_transfer: "Bank Transfer",
};

function DetailRow({ label, value, mono, onCopy }: { label: string; value: string; mono?: boolean; onCopy?: () => void }) {
  return (
    <View className="flex-row justify-between items-start py-3 border-b border-gray-50">
      <Text className="font-manrope text-sm text-gray-500 flex-1">{label}</Text>
      <View className="flex-row items-center gap-2 max-w-[55%]">
        <Text className={`font-grotesk-semibold text-sm text-gray-900 text-right ${mono ? "font-mono text-xs" : ""}`} numberOfLines={2}>
          {value}
        </Text>
        {onCopy && (
          <TouchableOpacity onPress={onCopy}>
            <Copy size={14} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function MyPaymentDetailsScreen() {
  useRequireAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) { setError("No payment ID"); setLoading(false); return; }
    // Single-get first (GET /payments/{id}); fall back to list lookup.
    paymentsApi.getById(id)
      .then((found) => setPayment(found))
      .catch(() =>
        paymentsApi.list({ limit: 100 })
          .then((res) => {
            const found = res.data.find((p) => p.id === id);
            if (found) setPayment(found);
            else setError("Payment not found");
          })
          .catch((e) => setError(getApiError(e))),
      )
      .catch((e) => setError(getApiError(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const copyRef = () => {
    if (payment) {
      Clipboard.setString(payment.transaction_id);
      Alert.alert("Copied", "Transaction reference copied to clipboard.");
    }
  };

  const handleDownloadReceipt = async () => {
    if (!payment) return;
    setDownloading(true);
    try {
      await downloadReceipt(payment.id, payment.receipt_number ?? undefined);
    } catch (e) {
      Alert.alert("Receipt", e instanceof Error ? e.message : getApiError(e));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-3">
        <ActivityIndicator size="large" color="#ff4b26" />
        <Text className="font-manrope text-sm text-gray-400">Loading payment…</Text>
      </SafeAreaView>
    );
  }

  if (error || !payment) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-4 px-8">
        <AlertCircle size={40} color="#9ca3af" />
        <Text className="text-lg font-grotesk-bold text-gray-900">Not found</Text>
        <Text className="font-manrope text-sm text-gray-400 text-center">{error}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-[#ff4b26] px-6 py-3 rounded-xl">
          <Text className="text-white font-grotesk-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Payment Details" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-5 gap-5">

          {/* Amount card */}
          <View className="bg-white rounded-3xl p-6 items-center" style={shadow.md}>
            <View className="w-14 h-14 rounded-full bg-[#fff0e9] items-center justify-center mb-4">
              <CreditCard size={28} color="#ff4b26" />
            </View>
            <Text className="text-3xl font-grotesk-extrabold text-gray-900 mb-2">{fmt(payment.amount)}</Text>
            <StatusBadge status={payment.status} />
            <Text className="font-manrope text-xs text-gray-400 mt-2">{CATEGORY_LABELS[payment.payment_category] ?? payment.payment_category}</Text>
          </View>

          {/* Transaction details */}
          <View className="bg-white rounded-3xl px-5 pt-2 pb-1" style={shadow.md}>
            <DetailRow label="Date" value={formatDate(payment.created_at)} />
            <DetailRow label="Method" value={METHOD_LABELS[payment.payment_method] ?? payment.payment_method} />
            <DetailRow label="Reference" value={payment.transaction_id} mono onCopy={copyRef} />
            {payment.receipt_number && <DetailRow label="Receipt No" value={payment.receipt_number} mono />}
            {payment.seller_name && <DetailRow label="Seller" value={payment.seller_name} />}
            {payment.order_id && <DetailRow label="Order ID" value={`#${payment.order_id.slice(-8).toUpperCase()}`} />}
            {payment.agreement_id && <DetailRow label="Agreement ID" value={`#${payment.agreement_id.slice(-8).toUpperCase()}`} />}
          </View>

          {/* Download receipt (web parity) */}
          <TouchableOpacity
            onPress={handleDownloadReceipt}
            disabled={downloading}
            className="bg-gray-900 rounded-2xl p-4 flex-row items-center justify-center gap-2"
            style={shadow.md}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Download size={18} color="#fff" />
                <Text className="text-sm font-grotesk-bold text-white">Download Receipt (PDF)</Text>
              </>
            )}
          </TouchableOpacity>

          {/* View linked record */}
          {payment.order_id && (
            <TouchableOpacity
              onPress={() => router.push(`/order-details?id=${payment.order_id}` as any)}
              className="bg-white rounded-2xl p-4 flex-row items-center gap-3"
              style={shadow.md}
            >
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                <Package size={18} color="#3b82f6" />
              </View>
              <Text className="text-sm font-grotesk-semibold text-gray-900 flex-1">View Order</Text>
              <Text className="text-xs text-indigo-600 font-grotesk-bold">→</Text>
            </TouchableOpacity>
          )}

          {payment.agreement_id && (
            <TouchableOpacity
              onPress={() => router.push(`/agreement-details?id=${payment.agreement_id}` as any)}
              className="bg-white rounded-2xl p-4 flex-row items-center gap-3"
              style={shadow.md}
            >
              <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center">
                <FileText size={18} color="#8b5cf6" />
              </View>
              <Text className="text-sm font-grotesk-semibold text-gray-900 flex-1">View Agreement</Text>
              <Text className="text-xs text-indigo-600 font-grotesk-bold">→</Text>
            </TouchableOpacity>
          )}

          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <Text className="font-manrope text-xs text-gray-400 text-center leading-relaxed">
              All payments are processed securely via Paystack. Contact support if you have any issues with this transaction.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
