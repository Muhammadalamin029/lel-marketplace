import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StatusBar, ActivityIndicator, TouchableOpacity, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, Package, Truck, MapPin, AlertCircle, Clock, Landmark, CreditCard } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";
import { ordersApi, paymentsApi } from "@/api";
import type { InstallmentEligibility, Order } from "@/api";
import { useAuthStore } from "@/store/authStore";

const STATUS_STEPS = ["pending", "processing", "paid", "shipped", "delivered"] as const;

type TransferDetails = {
  account_number: string;
  account_name: string;
  bank_name: string;
  amount: number;
  reference: string;
  expires_at?: string | null;
};

function TrackingStep({ label, icon: Icon, done, current }: {
  label: string; icon: any; done: boolean; current: boolean;
}) {
  return (
    <View className="items-center flex-1">
      <View
        className={`w-8 h-8 rounded-full items-center justify-center z-10 ${current ? "border-4 border-white" : ""}`}
        style={{ backgroundColor: done ? (current ? "#f59e0b" : "#22c55e") : "#e5e7eb" }}
      >
        <Icon size={current ? 14 : 16} color="white" />
      </View>
      <Text className={`text-[10px] mt-2 ${done ? "font-bold text-gray-900" : "font-medium text-gray-400"}`}>
        {label}
      </Text>
    </View>
  );
}

interface TimelineEvent {
  event: string;
  timestamp: string;
  description?: string;
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
        setTimeline(timelineData.value?.data ?? timelineData.value ?? []);
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-3">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-sm text-gray-400">Loading order…</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-4 px-8">
        <AlertCircle size={40} color="#9ca3af" />
        <Text className="text-lg font-bold text-gray-900">Order not found</Text>
        <Text className="text-sm text-gray-400 text-center">{error ?? "Could not load order details."}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-amber-400 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusIdx = STATUS_STEPS.indexOf(order.status as any);
  const createdDate = new Date(order.created_at).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title={`#${order.id.slice(-8).toUpperCase()}`} subtitle={createdDate} />

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>

        {/* Status + Tracking */}
        <View className="bg-white rounded-2xl p-5 mb-5 border border-gray-100" style={shadow.md}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-bold text-gray-900">Tracking Status</Text>
            <StatusBadge status={order.status} />
          </View>
          <View className="flex-row justify-between">
            {[
              { label: "Placed",     icon: CheckCircle, step: 0 },
              { label: "Processing", icon: Package,     step: 1 },
              { label: "Shipped",    icon: Truck,       step: 3 },
              { label: "Delivered",  icon: MapPin,      step: 4 },
            ].map(({ label, icon, step }) => (
              <TrackingStep
                key={label} label={label} icon={icon}
                done={statusIdx >= step} current={statusIdx === step}
              />
            ))}
          </View>
        </View>

        {/* Timeline events (from API) */}
        {timeline.length > 0 && (
          <>
            <Text className="text-sm font-bold text-gray-900 mb-3 px-1">Order Timeline</Text>
            <View className="bg-white rounded-2xl px-4 pt-4 pb-2 mb-5 border border-gray-100" style={shadow.md}>
              {timeline.map((event, i) => (
                <View key={i} className="flex-row gap-3 mb-4">
                  <View className="items-center">
                    <View className="w-3 h-3 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                    {i < timeline.length - 1 && <View className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                  </View>
                  <View className="flex-1 pb-1">
                    <Text className="text-sm font-bold text-gray-900 capitalize">
                      {event.event?.replace(/_/g, " ") ?? "Status Update"}
                    </Text>
                    {event.description && (
                      <Text className="text-xs text-gray-500 mt-0.5">{event.description}</Text>
                    )}
                    <View className="flex-row items-center gap-1 mt-1">
                      <Clock size={10} color="#9ca3af" />
                      <Text className="text-[10px] text-gray-400">
                        {new Date(event.timestamp).toLocaleString("en-NG", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Items */}
        <Text className="text-sm font-bold text-gray-900 mb-3 px-1">Items ({allItems.length})</Text>
        <View className="bg-white rounded-2xl p-4 mb-5 border border-gray-100" style={shadow.md}>
          {allItems.length === 0 ? (
            <Text className="text-sm text-gray-400 text-center py-4">No items found</Text>
          ) : allItems.map((item) => (
            <View key={item.id} className="flex-row justify-between items-center py-2.5 border-b border-gray-50">
              <View className="flex-row items-center gap-3 flex-1 min-w-0">
                <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center flex-shrink-0">
                  <Package size={18} color="#9ca3af" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                    {item.product?.name ?? "Product"}
                  </Text>
                  <Text className="text-xs text-gray-500">Qty: {item.quantity} · {item.status}</Text>
                </View>
              </View>
              <Text className="text-sm font-extrabold text-amber-500 ml-2">{fmt(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <Text className="text-sm font-bold text-gray-900 mb-3 px-1">Payment Summary</Text>
        <View className="bg-white rounded-2xl p-5 mb-5 border border-gray-100" style={shadow.md}>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-500">Items</Text>
            <Text className="text-sm font-medium text-gray-900">{fmt(itemsSubtotal)}</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-gray-500">{order.delivery_type === "pickup" ? "Pickup" : "Delivery"}</Text>
            <Text className="text-sm font-medium text-gray-900">
              {order.delivery_type === "pickup" || deliveryFee === 0 ? "Free" : fmt(deliveryFee)}
            </Text>
          </View>
          <View className="h-px bg-gray-100 mb-4" />
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-bold text-gray-900">Total Paid</Text>
            <Text className="text-xl font-black text-amber-400">{fmt(order.total_amount)}</Text>
          </View>
          {order.delivery_type === "pickup" && (
            <View className="flex-row items-start gap-2 mt-4 pt-4 border-t border-gray-100">
              <MapPin size={14} color="#6b7280" />
              <Text className="text-xs text-gray-500 flex-1">
                Pickup: {order.pickup_location || "Store"}{order.pickup_address ? ` — ${order.pickup_address}` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Address */}
        {order.delivery_type !== "pickup" && addr && (
          <>
            <Text className="text-sm font-bold text-gray-900 mb-3 px-1">Delivery Address</Text>
            <View className="bg-white rounded-2xl p-4 mb-5 border border-gray-100 flex-row items-start gap-3" style={shadow.md}>
              <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center">
                <MapPin size={18} color="#4f46e5" />
              </View>
              <View className="flex-1 pt-1">
                <Text className="text-sm font-bold text-gray-900 mb-1">{addr.city}</Text>
                <Text className="text-sm text-gray-500 leading-relaxed">
                  {addr.street}, {addr.city}, {addr.state}, {addr.country}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Continue payment */}
        {showPaymentPanel && (
          <View className="bg-white rounded-2xl p-4 mb-5 border border-gray-100 gap-3" style={shadow.md}>
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center">
                <Landmark size={18} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900">Complete Your Payment</Text>
                <Text className="text-xs text-gray-500">Generate bank transfer details for this order.</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => showBankTransfer(Number(order.total_amount))}
              disabled={paymentBusy}
              className="bg-amber-400 py-3.5 rounded-2xl items-center"
              style={shadow.btn}
            >
              {paymentBusy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Get bank details</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Installment top-up */}
        {installmentActive && remainingBalance > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-5 border border-gray-100 gap-4" style={shadow.md}>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-gray-900">Installment Plan</Text>
              <View className="bg-amber-50 px-2 py-1 rounded-full">
                <Text className="text-[10px] font-bold text-amber-600">{paidPercent}% paid</Text>
              </View>
            </View>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Paid</Text>
                <Text className="text-sm font-bold text-gray-900">{fmt(amountPaid)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Remaining</Text>
                <Text className="text-sm font-bold text-amber-600">{fmt(remainingBalance)}</Text>
              </View>
              <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <View className="h-full bg-amber-400" style={{ width: `${paidPercent}%` }} />
              </View>
            </View>
            {!topUpOpen ? (
              <TouchableOpacity
                onPress={() => { setTopUpAmount(String(remainingBalance)); setTopUpOpen(true); }}
                className="bg-amber-400 py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
                style={shadow.btn}
              >
                <CreditCard size={16} color="#fff" />
                <Text className="text-white font-bold">Make a payment</Text>
              </TouchableOpacity>
            ) : (
              <View className="gap-3">
                <TextInput
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base font-bold text-gray-900"
                  placeholder="Amount to pay"
                />
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => setTopUpOpen(false)} className="flex-1 border border-gray-200 py-3 rounded-xl items-center">
                    <Text className="text-gray-700 font-bold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={startTopUp} className="flex-1 bg-amber-400 py-3 rounded-xl items-center">
                    <Text className="text-white font-bold">Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {transfer && (
          <View className="bg-white rounded-2xl p-4 mb-5 border border-gray-100 gap-4" style={shadow.md}>
            <Text className="text-sm font-bold text-gray-900">Bank Transfer Details</Text>
            {[
              ["Bank", transfer.bank_name],
              ["Account Number", transfer.account_number],
              ["Account Name", transfer.account_name],
              ["Amount", fmt(transfer.amount)],
              ["Reference", transfer.reference],
            ].map(([label, value]) => (
              <View key={label} className="flex-row justify-between gap-4 border-b border-gray-100 pb-3">
                <Text className="text-sm text-gray-500">{label}</Text>
                <Text className="text-sm font-bold text-gray-900 flex-1 text-right">{value}</Text>
              </View>
            ))}
            {transfer.expires_at && (
              <Text className="text-xs text-amber-600">
                This transfer account expires at {new Date(transfer.expires_at).toLocaleString()}.
              </Text>
            )}
            <TouchableOpacity
              onPress={verifyTransfer}
              disabled={paymentBusy}
              className="bg-amber-400 py-3.5 rounded-2xl items-center"
              style={shadow.btn}
            >
              {paymentBusy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">I have sent the payment</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Leave a review (delivered orders) */}
        {isDelivered && allItems.length > 0 && (
          <View className="mb-5">
            <Text className="text-sm font-bold text-gray-900 mb-3 px-1">Rate Your Purchase</Text>
            <View className="bg-amber-50 rounded-2xl p-4 border border-amber-100 gap-3">
              <Text className="text-sm text-amber-800 leading-relaxed">
                How was your experience? Your review helps other buyers.
              </Text>
              {allItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/my-reviews?leave=1&productId=${item.product?.id}&productName=${encodeURIComponent(item.product?.name ?? "")}` as any)}
                  className="bg-white rounded-xl px-4 py-3 flex-row items-center justify-between border border-amber-200"
                >
                  <Text className="text-sm font-semibold text-gray-800 flex-1" numberOfLines={1}>
                    {item.product?.name ?? "Product"}
                  </Text>
                  <Text className="text-xs font-bold text-amber-600 ml-2">Rate ★</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Cancel Order */}
        {canCancel && (
          <TouchableOpacity
            onPress={handleCancel}
            disabled={cancelling}
            className="border border-red-200 bg-red-50 py-4 rounded-2xl items-center mb-10"
          >
            {cancelling
              ? <ActivityIndicator color="#ef4444" />
              : <Text className="text-red-600 font-semibold">Cancel Order</Text>}
          </TouchableOpacity>
        )}

        {!canCancel && <View style={{ height: 24 }} />}
      </ScrollView>
    </SafeAreaView>
  );
}
