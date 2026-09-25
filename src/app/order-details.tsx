import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StatusBar, ActivityIndicator, TouchableOpacity, Alert, TextInput, Image, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Package, MapPin, AlertCircle, Landmark, CreditCard, Check, Headphones } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS } from "@/constants/brand";
import { fmt } from "@/utils/format";
import { ordersApi, paymentsApi } from "@/api";
import type { InstallmentEligibility, Order } from "@/api";
import { useAuthStore } from "@/store/authStore";

type TransferDetails = {
  account_number: string;
  account_name: string;
  bank_name: string;
  amount: number;
  reference: string;
  expires_at?: string | null;
};

interface TimelineEvent {
  event: string;
  timestamp: string;
  description?: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function fmtStamp(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function statusColor(status: string): string {
  switch (status) {
    case "delivered": return "#22c55e";
    case "cancelled": return "#ef4444";
    case "shipped": return "#3b82f6";
    default: return "#f59e0b";
  }
}

const RANK: Record<string, number> = { pending: 0, processing: 1, paid: 2, shipped: 3, delivered: 4 };

function Timeline({ order, events }: { order: Order; events: TimelineEvent[] }) {
  const current = RANK[order.status] ?? 0;
  const safeEvents = Array.isArray(events) ? events : [];
  const done = safeEvents.map((e) => ({
    title: (e.event ?? "Status update").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    subtitle: e.timestamp ? fmtStamp(e.timestamp) : e.description ?? "",
  }));

  const pending: { title: string; subtitle: string }[] = [];
  const eta = order.estimated_delivery_date
    ? new Date(order.estimated_delivery_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })
    : "";
  if (current < 3 && order.status !== "cancelled") {
    pending.push({ title: "Out for delivery", subtitle: eta ? `Expected ${eta}` : "On its way" });
  }
  if (current < 4 && order.status !== "cancelled") {
    pending.push({ title: "Delivered", subtitle: eta ? `Expected ${eta}` : "Awaiting delivery" });
  }

  if (done.length === 0 && pending.length === 0) return null;

  return (
    <View className="px-1">
      {done.map((s, i) => (
        <View key={`d-${i}`} className="flex-row gap-3">
          <View className="items-center">
            <View
              className="w-6 h-6 rounded-full items-center justify-center"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Check size={13} color="#fff" strokeWidth={3} />
            </View>
            {(i < done.length - 1 || pending.length > 0) && (
              <View className="w-px flex-1" style={{ backgroundColor: "#e5e7eb", minHeight: 18 }} />
            )}
          </View>
          <View className="pb-5">
            <Text className="text-[13px] font-grotesk-bold text-gray-900">{s.title}</Text>
            {!!s.subtitle && <Text className="font-manrope text-[11px] text-gray-400 mt-0.5">{s.subtitle}</Text>}
          </View>
        </View>
      ))}
      {pending.map((s, i) => (
        <View key={`p-${i}`} className="flex-row gap-3">
          <View className="items-center">
            <View className="w-6 h-6 rounded-full border-2 border-dotted border-gray-300 bg-white items-center justify-center">
              <View className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </View>
            {i < pending.length - 1 && (
              <View className="w-px flex-1" style={{ backgroundColor: "#e5e7eb", minHeight: 18 }} />
            )}
          </View>
          <View className="pb-5">
            <Text className="text-[13px] font-grotesk-medium text-gray-400">{s.title}</Text>
            {!!s.subtitle && <Text className="font-manrope text-[11px] text-gray-300 mt-0.5">{s.subtitle}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function OrderDetailsScreen() {
  useRequireAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [installment, setInstallment] = useState<InstallmentEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");

  const load = useCallback(async () => {
    if (!id) { setError("No order ID provided"); setLoading(false); return; }
    try {
      const [orderData, timelineData, installmentData] = await Promise.allSettled([
        ordersApi.getById(id),
        ordersApi.getTimeline(id),
        ordersApi.getInstallment(id),
      ]);
      if (orderData.status === "fulfilled") setOrder(orderData.value);
      else setError("Failed to load order");
      if (timelineData.status === "fulfilled") {
        const t = timelineData.value;
        setTimeline(Array.isArray(t) ? t : []);
      }
      if (installmentData.status === "fulfilled") {
        setInstallment(installmentData.value);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = () => {
    if (!order) return;
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? This action cannot be undone.",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              await ordersApi.cancel(order.id);
              await load();
              Alert.alert("Order Cancelled", "Your order has been cancelled successfully.");
            } catch (e: any) {
              Alert.alert("Error", e?.response?.data?.detail ?? e?.message ?? "Could not cancel. Please try again.");
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const showBankTransfer = async (amount: number, metadata?: Record<string, any>) => {
    if (!order || !user?.email) return;
    setPaymentBusy(true);
    try {
      const bankTransfer = await paymentsApi.initializeBankTransfer({
        order_id: order.id,
        email: user.email,
        amount,
        category: "order",
        metadata,
      }) as TransferDetails;
      setTransfer(bankTransfer);
    } catch (e: any) {
      Alert.alert("Payment details failed", e?.response?.data?.detail ?? e?.message ?? "Could not generate bank transfer details.");
    } finally {
      setPaymentBusy(false);
    }
  };

  const startTopUp = () => {
    const remaining = Number(installment?.remaining_balance ?? order?.installment?.remaining_balance ?? 0);
    const amount = Number(topUpAmount || remaining);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Enter an amount greater than zero.");
      return;
    }
    if (remaining > 0 && amount > remaining) {
      Alert.alert("Amount too high", `You cannot pay more than ${fmt(remaining)}.`);
      return;
    }
    showBankTransfer(amount, { payment_type: "installment" });
  };

  const verifyTransfer = async () => {
    if (!transfer?.reference) return;
    setPaymentBusy(true);
    try {
      const result = await paymentsApi.verify(transfer.reference) as { status?: string };
      const status = String(result?.status ?? "success").toLowerCase();
      if (!["success", "paid", "completed"].includes(status)) {
        Alert.alert("Payment not received yet", "We have not received your transfer yet. Please try again shortly after transferring.");
        return;
      }
      setTransfer(null);
      setTopUpOpen(false);
      await load();
      Alert.alert("Payment received", "Your order has been updated.");
    } catch (e: any) {
      Alert.alert("Verification failed", e?.response?.data?.detail ?? e?.message ?? "Please try again.");
    } finally {
      setPaymentBusy(false);
    }
  };

  const contactSupport = () => {
    Linking.openURL("mailto:support@lel-marketplace.com?subject=Order Support").catch(() =>
      router.push("/help" as any),
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-3">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="font-manrope text-sm text-gray-400">Loading order…</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-4 px-8">
        <AlertCircle size={40} color="#9ca3af" />
        <Text className="text-lg font-grotesk-bold text-gray-900">Order not found</Text>
        <Text className="font-manrope text-sm text-gray-400 text-center">{error ?? "Could not load order details."}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-6 py-3 rounded-xl"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text className="text-white font-grotesk-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const allItems = order.order_items ?? [];
  const addr = order.delivery_addr;
  const canCancel = ["pending", "processing"].includes(order.status);
  const isDelivered = order.status === "delivered";
  const deliveryFee = Number(order.delivery_fee ?? 0);
  const itemsSubtotal = Math.max(0, Number(order.total_amount) - deliveryFee);
  const installmentActive = !!order.installment?.active || !!installment?.is_installment;
  const amountPaid = Number(installment?.amount_paid ?? order.installment?.amount_paid ?? 0);
  const remainingBalance = Number(installment?.remaining_balance ?? order.installment?.remaining_balance ?? 0);
  const installmentTotal = Number(installment?.total_amount ?? order.total_amount ?? 0);
  const paidPercent = installmentTotal > 0 ? Math.min(100, Math.round((amountPaid / installmentTotal) * 100)) : 0;
  const showPaymentPanel = ["pending", "processing"].includes(order.status) && !installmentActive;
  const payMethod = (order.formatted_payments as any[])?.[0];
  const payMethodLabel = payMethod?.payment_method || payMethod?.method || payMethod?.channel
    ? String(payMethod.payment_method ?? payMethod.method ?? payMethod.channel)
    : null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader
        title={`LS-${order.id.slice(-6).toUpperCase()}`}
        subtitle={`order placed ${timeAgo(order.created_at)}`}
      />

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Status */}
        <View className="flex-row items-center gap-1.5 mb-4">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor(order.status) }} />
          <Text className="font-grotesk text-[13px] text-gray-700 capitalize">{order.status}</Text>
        </View>

        {/* Timeline */}
        <Timeline order={order} events={timeline} />

        {/* Items */}
        <Text className="text-base font-grotesk-extrabold text-gray-900 mt-4 mb-3">Items</Text>
        <View className="gap-4">
          {allItems.length === 0 ? (
            <Text className="font-manrope text-sm text-gray-400">No items found</Text>
          ) : allItems.map((item) => {
            const uri = item.product?.images?.[0]?.image_url;
            return (
              <View key={item.id} className="flex-row items-center gap-3">
                {uri ? (
                  <Image source={{ uri }} className="rounded-lg bg-gray-100" style={{ width: 52, height: 52 }} />
                ) : (
                  <View className="rounded-lg bg-gray-100 items-center justify-center" style={{ width: 52, height: 52 }}>
                    <Package size={20} color="#9ca3af" />
                  </View>
                )}
                <View className="flex-1 min-w-0">
                  <Text className="text-[13px] font-grotesk-semibold text-gray-900" numberOfLines={2}>
                    {item.product?.name ?? "Product"}
                  </Text>
                  <Text className="font-manrope text-[11px] text-gray-400 mt-0.5">Qty {item.quantity}</Text>
                </View>
                <Text className="text-[13px] font-grotesk-extrabold text-gray-900">
                  {fmt(item.price * item.quantity)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Payment summary */}
        <Text className="text-base font-grotesk-extrabold text-gray-900 mt-6 mb-3">Payment summary</Text>
        <View className="gap-2.5">
          <View className="flex-row justify-between">
            <Text className="font-manrope text-[13px] text-gray-400">Items</Text>
            <Text className="text-[13px] font-grotesk-bold text-gray-900">{fmt(itemsSubtotal)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-manrope text-[13px] text-gray-400">Delivery</Text>
            <Text className="text-[13px] font-grotesk-bold text-gray-900">
              {order.delivery_type === "pickup" || deliveryFee === 0 ? "Free" : fmt(deliveryFee)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm font-grotesk-bold text-gray-900">Total paid</Text>
            <Text className="text-sm font-grotesk-extrabold text-gray-900">{fmt(order.total_amount)}</Text>
          </View>
          {!!payMethodLabel && (
            <View className="flex-row items-center gap-2 mt-1">
              <CreditCard size={14} color="#6b7280" />
              <Text className="font-manrope text-xs text-gray-500 capitalize">{payMethodLabel}</Text>
            </View>
          )}
          {order.delivery_type !== "pickup" && addr && (
            <View className="flex-row items-start gap-2 mt-1">
              <MapPin size={14} color="#6b7280" style={{ marginTop: 1 }} />
              <Text className="font-manrope text-xs text-gray-500 flex-1 leading-relaxed">
                {addr.street}, {addr.city}, {addr.state}
              </Text>
            </View>
          )}
          {order.delivery_type === "pickup" && (
            <View className="flex-row items-start gap-2 mt-1">
              <MapPin size={14} color="#6b7280" style={{ marginTop: 1 }} />
              <Text className="font-manrope text-xs text-gray-500 flex-1">
                Pickup: {order.pickup_location || "Store"}{order.pickup_address ? ` — ${order.pickup_address}` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Continue payment */}
        {showPaymentPanel && (
          <View className="mt-6 border border-gray-100 rounded-2xl p-4 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: COLORS.primarySoft }}>
                <Landmark size={18} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-grotesk-bold text-gray-900">Complete Your Payment</Text>
                <Text className="font-manrope text-xs text-gray-400">Generate bank transfer details for this order.</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => showBankTransfer(Number(order.total_amount))}
              disabled={paymentBusy}
              className="rounded-xl py-3.5 items-center"
              style={{ backgroundColor: COLORS.primary }}
            >
              {paymentBusy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-grotesk-bold text-sm">Get bank details</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Installment top-up */}
        {installmentActive && remainingBalance > 0 && (
          <View className="mt-6 border border-gray-100 rounded-2xl p-4 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-grotesk-bold text-gray-900">Installment Plan</Text>
              <View className="rounded-full px-2 py-1" style={{ backgroundColor: COLORS.primarySoft }}>
                <Text className="text-[10px] font-grotesk-bold" style={{ color: COLORS.primary }}>{paidPercent}% paid</Text>
              </View>
            </View>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="font-manrope text-[13px] text-gray-400">Paid</Text>
                <Text className="text-[13px] font-grotesk-bold text-gray-900">{fmt(amountPaid)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="font-manrope text-[13px] text-gray-400">Remaining</Text>
                <Text className="text-[13px] font-grotesk-bold" style={{ color: COLORS.primary }}>{fmt(remainingBalance)}</Text>
              </View>
              <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <View className="h-full" style={{ width: `${paidPercent}%`, backgroundColor: COLORS.primary }} />
              </View>
            </View>
            {!topUpOpen ? (
              <TouchableOpacity
                onPress={() => { setTopUpAmount(String(remainingBalance)); setTopUpOpen(true); }}
                className="rounded-xl py-3.5 flex-row items-center justify-center gap-2"
                style={{ backgroundColor: COLORS.primary }}
              >
                <CreditCard size={16} color="#fff" />
                <Text className="text-white font-grotesk-bold text-sm">Make a payment</Text>
              </TouchableOpacity>
            ) : (
              <View className="gap-3">
                <TextInput
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-grotesk-bold text-base text-gray-900"
                  placeholder="Amount to pay"
                />
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => setTopUpOpen(false)} className="flex-1 border border-gray-200 py-3 rounded-xl items-center">
                    <Text className="text-gray-700 font-grotesk-bold text-sm">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={startTopUp}
                    className="flex-1 py-3 rounded-xl items-center"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <Text className="text-white font-grotesk-bold text-sm">Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {transfer && (
          <View className="mt-6 border border-gray-100 rounded-2xl p-4 gap-3">
            <Text className="text-sm font-grotesk-bold text-gray-900">Bank Transfer Details</Text>
            {[
              ["Bank", transfer.bank_name],
              ["Account Number", transfer.account_number],
              ["Account Name", transfer.account_name],
              ["Amount", fmt(transfer.amount)],
              ["Reference", transfer.reference],
            ].map(([label, value]) => (
              <View key={label} className="flex-row justify-between gap-4">
                <Text className="font-manrope text-[13px] text-gray-400">{label}</Text>
                <Text className="text-[13px] font-grotesk-bold text-gray-900 flex-1 text-right">{value}</Text>
              </View>
            ))}
            <TouchableOpacity
              onPress={verifyTransfer}
              disabled={paymentBusy}
              className="rounded-xl py-3.5 items-center"
              style={{ backgroundColor: COLORS.primary }}
            >
              {paymentBusy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-grotesk-bold text-sm">I have sent the payment</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Reviews (delivered) */}
        {isDelivered && allItems.length > 0 && (
          <View className="mt-6">
            <Text className="text-sm font-grotesk-bold text-gray-900 mb-3">Rate Your Purchase</Text>
            <View className="rounded-2xl p-4 gap-3" style={{ backgroundColor: COLORS.primarySoft }}>
              <Text className="font-grotesk text-[13px] leading-relaxed" style={{ color: "#a5310f" }}>
                How was your experience? Your review helps other buyers.
              </Text>
              {allItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/my-reviews?leave=1&productId=${item.product?.id}&productName=${encodeURIComponent(item.product?.name ?? "")}` as any)}
                  className="bg-white rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <Text className="text-[13px] font-grotesk-semibold text-gray-800 flex-1" numberOfLines={1}>
                    {item.product?.name ?? "Product"}
                  </Text>
                  <Text className="text-xs font-grotesk-bold ml-2" style={{ color: COLORS.primary }}>Rate ★</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Cancel */}
        {canCancel && (
          <TouchableOpacity
            onPress={handleCancel}
            disabled={cancelling}
            className="border border-red-200 bg-red-50 py-4 rounded-xl items-center mt-6"
          >
            {cancelling
              ? <ActivityIndicator color="#ef4444" />
              : <Text className="text-red-600 font-grotesk-semibold text-sm">Cancel Order</Text>}
          </TouchableOpacity>
        )}

        {/* Bottom actions */}
        <View className="gap-3 mt-8">
          <TouchableOpacity
            onPress={contactSupport}
            className="rounded-xl border border-gray-300 py-4 flex-row items-center justify-center gap-2"
          >
            <Headphones size={16} color="#111827" />
            <Text className="text-sm font-grotesk-bold text-gray-900">Contact support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/orders" as any)}
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text className="text-sm font-grotesk-bold text-white">Back to orders</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
