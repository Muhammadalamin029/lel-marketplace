import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";
import {
  MapPin, CheckCircle, Package, Truck, Landmark, Wallet, Store, AlertCircle,
} from "lucide-react-native";
import { useCartStore } from "@/store/cartStore";
import { ordersApi } from "@/api/orders";
import { addressesApi, paymentsApi, publicApi } from "@/api";
import type { Address, CheckoutSummary, DeliverySettings, InstallmentEligibility } from "@/api";
import { useAuthStore } from "@/store/authStore";

type Step = "review" | "processing" | "payment" | "success";
type DeliveryType = "delivery" | "pickup";
type PaymentMethod = "bank_transfer" | "installment";
type TransferDetails = {
  account_number: string;
  account_name: string;
  bank_name: string;
  amount: number;
  reference: string;
  expires_at?: string | null;
  currency?: string;
};

export default function CheckoutScreen() {
  useRequireAuth();
  const router = useRouter();
  const { pendingOrder, fetchPendingOrder, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>("review");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [installment, setInstallment] = useState<InstallmentEligibility | null>(null);
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [installmentTransferStarted, setInstallmentTransferStarted] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    fetchPendingOrder();
    Promise.all([
      addressesApi.list(),
      ordersApi.getCheckoutSummary().catch(() => null),
      publicApi.deliverySettings().catch(() => null),
    ])
      .then(([data, summary, settings]) => {
        setAddresses(data ?? []);
        const def = data?.find((a) => a.is_default);
        if (def) setSelectedAddressId(def.id);
        else if (data?.[0]) setSelectedAddressId(data[0].id);
        setCheckoutSummary(summary);
        setDeliverySettings(settings);
      })
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, [fetchPendingOrder]);

  const order = checkoutSummary?.order ?? pendingOrder;
  const items = order?.order_items ?? [];
  const subtotal = Number(checkoutSummary?.summary.subtotal ?? order?.total_amount ?? 0);
  const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
  const deliveryFee = deliveryType === "pickup"
    ? 0
    : Number(selectedAddress?.delivery_state?.delivery_price ?? deliverySettings?.base_delivery_price ?? checkoutSummary?.summary.delivery_fee ?? 0);
  const total = subtotal + deliveryFee;
  const canContinue = items.length > 0 && (deliveryType === "pickup" || !!selectedAddressId);

  const beginInstallmentTransfer = async () => {
    if (!confirmedOrderId || !user?.email || !installment) return;
    const amount = Number(installmentAmount);
    const minInitial = Number(installment.min_initial_amount ?? 0);
    const remaining = Number(installment.remaining_balance ?? 0);

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Enter an amount greater than zero.");
      return;
    }
    if (amount < minInitial) {
      Alert.alert("Amount too low", `The first payment must be at least ${fmt(minInitial)}.`);
      return;
    }
    if (remaining > 0 && amount > remaining) {
      Alert.alert("Amount too high", `You cannot pay more than ${fmt(remaining)}.`);
      return;
    }

    setIsProcessing(true);
    try {
      const bankTransfer = await paymentsApi.initializeBankTransfer({
        order_id: confirmedOrderId,
        email: user.email,
        amount,
        category: "order",
        metadata: { payment_type: "installment" },
      }) as TransferDetails;
      setTransfer(bankTransfer);
      setInstallmentTransferStarted(true);
    } catch (e: any) {
      Alert.alert("Payment details failed", e?.response?.data?.detail ?? e?.message ?? "Could not generate bank transfer details.");
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyTransfer = async () => {
    if (!transfer?.reference) return;
    setVerifyingPayment(true);
    try {
      const result = await paymentsApi.verify(transfer.reference) as { status?: string; order_id?: string };
      const status = String(result?.status ?? "success").toLowerCase();
      if (!["success", "paid", "completed"].includes(status)) {
        Alert.alert("Payment not received yet", "We have not received your transfer yet. Please try again shortly after transferring.");
        return;
      }
      await clearCart();
      setStep("success");
    } catch (e: any) {
      Alert.alert("Verification failed", e?.response?.data?.detail ?? e?.message ?? "Please try again.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (deliveryType === "delivery" && !selectedAddressId) {
      Alert.alert("Address Required", "Please select a delivery address before placing your order.");
      return;
    }
    if (!pendingOrder || items.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty.");
      return;
    }

    setIsProcessing(true);
    setStep("processing");
    setTransfer(null);
    setInstallment(null);
    setInstallmentAmount("");
    setInstallmentTransferStarted(false);

    try {
      const confirmation = await ordersApi.processCheckout({
        delivery_type: deliveryType,
        delivery_address_id: deliveryType === "delivery" ? selectedAddressId : null,
      });
      setConfirmedOrderId(confirmation.order_id);

      if (paymentMethod === "installment") {
        const plan = await ordersApi.getInstallment(confirmation.order_id);
        setInstallment(plan);
        setInstallmentAmount(String(plan.min_initial_amount ?? ""));
        setStep("payment");
        return;
      }

      const bankTransfer = await paymentsApi.initializeBankTransfer({
        order_id: confirmation.order_id,
        email: user?.email ?? "",
        amount: Number(confirmation.total_amount ?? total),
        category: "order",
      }) as TransferDetails;
      setTransfer(bankTransfer);
      setStep("payment");
    } catch (e: any) {
      setStep("review");
      Alert.alert(
        "Checkout Failed",
        e?.response?.data?.detail ?? e?.message ?? "Something went wrong. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ── States ───────────────────────────────────────────────────────────────────

  if (step === "processing") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-5">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-base font-bold text-gray-900">Processing your order…</Text>
        <Text className="text-sm text-gray-500 text-center px-8">
          We're placing your order and preparing your payment details.
        </Text>
      </SafeAreaView>
    );
  }

  if (step === "payment") {
    const showTransfer = paymentMethod === "bank_transfer" || installmentTransferStarted;
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <ScreenHeader title={paymentMethod === "installment" ? "Start your plan" : "Bank Transfer"} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View className="gap-5">
            {paymentMethod === "installment" && installment && !installmentTransferStarted && (
              <View className="bg-white rounded-2xl p-4 gap-4" style={shadow.md}>
                {installment.eligible ? (
                  <>
                    <View>
                      <Text className="text-lg font-extrabold text-gray-900">Installment Plan</Text>
                      <Text className="text-sm text-gray-500 mt-1">Choose your first payment to get started.</Text>
                    </View>
                    <View className="gap-3">
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-500">Order total</Text>
                        <Text className="text-sm font-bold text-gray-900">{fmt(installment.total_amount)}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-500">Remaining balance</Text>
                        <Text className="text-sm font-bold text-gray-900">{fmt(installment.remaining_balance)}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-500">Minimum first payment</Text>
                        <Text className="text-sm font-bold text-gray-900">{fmt(installment.min_initial_amount)}</Text>
                      </View>
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-gray-500 mb-2">Amount to pay now</Text>
                      <TextInput
                        value={installmentAmount}
                        onChangeText={setInstallmentAmount}
                        keyboardType="numeric"
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base font-bold text-gray-900"
                        placeholder="Enter amount"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={beginInstallmentTransfer}
                      disabled={isProcessing}
                      className="bg-amber-400 rounded-2xl py-4 items-center"
                      style={shadow.btn}
                    >
                      {isProcessing ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Continue to transfer</Text>}
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="items-center gap-3 py-6">
                    <AlertCircle size={42} color="#f59e0b" />
                    <Text className="text-lg font-extrabold text-gray-900">Installment unavailable</Text>
                    <Text className="text-sm text-gray-500 text-center">{installment.reason ?? "This order is not eligible for installment payment."}</Text>
                  </View>
                )}
              </View>
            )}

            {showTransfer && transfer && (
              <View className="bg-white rounded-2xl p-4 gap-4" style={shadow.md}>
                <View>
                  <Text className="text-lg font-extrabold text-gray-900">Bank Transfer Details</Text>
                  <Text className="text-sm text-gray-500 mt-1">Please send the exact amount to the account below.</Text>
                </View>
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
                  disabled={verifyingPayment}
                  className="bg-amber-400 rounded-2xl py-4 items-center"
                  style={shadow.btn}
                >
                  {verifyingPayment ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">I have sent the payment</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmedOrderId ? router.push(`/order-details?id=${confirmedOrderId}` as any) : router.push("/orders")}
                  className="bg-white border border-gray-200 rounded-2xl py-4 items-center"
                >
                  <Text className="text-gray-700 font-bold">View order</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === "success") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-8 gap-6">
        <View className="w-24 h-24 rounded-full bg-green-50 items-center justify-center">
          <CheckCircle size={48} color="#22c55e" />
        </View>
        <View className="items-center gap-2">
          <Text className="text-2xl font-extrabold text-gray-900">Payment Sent!</Text>
          <Text className="text-sm text-gray-500 text-center leading-relaxed">
            We'll verify your transfer and update your order shortly.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => confirmedOrderId
            ? router.push(`/order-details?id=${confirmedOrderId}` as any)
            : router.push("/orders")}
          className="w-full bg-amber-400 py-4 rounded-2xl items-center"
          style={shadow.btn}
        >
          <Text className="text-white font-bold">Track My Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          className="w-full bg-white border border-gray-200 py-4 rounded-2xl items-center"
        >
          <Text className="text-gray-700 font-semibold">Continue Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (items.length === 0 && !loadingAddresses) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-5 px-8">
        <Package size={48} color="#d1d5db" />
        <Text className="text-lg font-bold text-gray-900">Your cart is empty</Text>
        <Text className="text-sm text-gray-400 text-center">Add items before checking out.</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-amber-400 px-6 py-3 rounded-2xl" style={shadow.btn}>
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Review ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Checkout" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-5 gap-6">

          {/* Delivery type */}
          <View>
            <SectionHeader title="Delivery Method" showDots={false} />
            <View className="flex-row bg-white rounded-2xl p-1 border border-gray-100" style={shadow.sm}>
              {(["delivery", "pickup"] as DeliveryType[]).map((type) => {
                const active = deliveryType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setDeliveryType(type)}
                    className={`flex-1 py-3 rounded-xl items-center ${active ? "bg-orange-500" : ""}`}
                  >
                    <Text className={`text-sm font-bold ${active ? "text-white" : "text-gray-600"}`}>
                      {type === "delivery" ? "Delivery" : "Pickup"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Delivery address */}
          <View>
            <SectionHeader title={deliveryType === "delivery" ? "Delivery Address" : "Pickup"} showDots={false} />
            {deliveryType === "pickup" ? (
              <View className="bg-white rounded-2xl p-4 flex-row items-center gap-3 border border-gray-100" style={shadow.md}>
                <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center">
                  <Store size={18} color="#ff4b26" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900">{deliverySettings?.store_pickup_location || "Store pickup"}</Text>
                  <Text className="text-xs text-gray-500">
                    {deliverySettings?.store_pickup_address || "No delivery fee will be charged."}
                  </Text>
                </View>
              </View>
            ) : loadingAddresses ? (
              <ActivityIndicator color="#f59e0b" />
            ) : addresses.length === 0 ? (
              <TouchableOpacity
                onPress={() => router.push("/addresses")}
                className="bg-white rounded-2xl p-4 flex-row items-center gap-3 border border-amber-200"
                style={shadow.md}
              >
                <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center">
                  <MapPin size={18} color="#f59e0b" />
                </View>
                <Text className="text-sm font-semibold text-amber-600 flex-1">
                  Add a delivery address first →
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="gap-2">
                {addresses.map((addr) => (
                  <TouchableOpacity
                    key={addr.id}
                    onPress={() => setSelectedAddressId(addr.id)}
                    className={`bg-white rounded-2xl p-4 flex-row items-center gap-3 border-2 ${selectedAddressId === addr.id ? "border-amber-400" : "border-transparent"}`}
                    style={shadow.sm}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center flex-shrink-0 ${selectedAddressId === addr.id ? "border-amber-400 bg-amber-400" : "border-gray-300"}`}>
                      {selectedAddressId === addr.id && <View className="w-2 h-2 rounded-full bg-white" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900">{addr.title}</Text>
                      <Text className="text-xs text-gray-500" numberOfLines={1}>
                        {addr.street_address}, {addr.city}, {addr.state_province}
                      </Text>
                    </View>
                    {addr.is_default && (
                      <View className="bg-green-50 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-green-600">Default</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => router.push("/addresses")} className="flex-row items-center gap-1 self-end pr-1">
                  <Text className="text-xs text-amber-500 font-semibold">+ Add new address</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Items */}
          <View>
            <SectionHeader title={`Order Items (${items.length})`} showDots={false} />
            <View className="bg-white rounded-2xl overflow-hidden" style={shadow.md}>
              {items.map((item, i) => (
                <View
                  key={item.id}
                  className={`flex-row items-center gap-3 p-4 ${i < items.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center">
                    <Package size={18} color="#6b7280" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                      {item.product?.name ?? "Product"}
                    </Text>
                    <Text className="text-xs text-gray-500">Qty: {item.quantity}</Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-900">
                    {fmt(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Delivery notice */}
          <View className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex-row gap-3">
            <Truck size={18} color="#3b82f6" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-blue-900 mb-0.5">Delivery Fee</Text>
              <Text className="text-xs text-blue-700 leading-relaxed">
                {deliveryType === "pickup"
                  ? "Pickup is free."
                  : "Delivery is included in your checkout total based on the selected address."}
              </Text>
            </View>
          </View>

          {/* Payment method */}
          <View>
            <SectionHeader title="Payment Method" showDots={false} />
            <View className="gap-3">
              {([
                { key: "bank_transfer", title: "Bank Transfer", desc: "Transfer to a dedicated checkout account.", icon: Landmark },
                { key: "installment", title: "Installment plan", desc: "Pay a first amount now and top up over time.", icon: Wallet },
              ] as const).map((option) => {
                const active = paymentMethod === option.key;
                const Icon = option.icon;
                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setPaymentMethod(option.key)}
                    className={`bg-white rounded-2xl p-4 flex-row items-center gap-3 border-2 ${active ? "border-amber-400" : "border-transparent"}`}
                    style={shadow.sm}
                  >
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${active ? "bg-amber-50" : "bg-gray-50"}`}>
                      <Icon size={18} color={active ? "#f59e0b" : "#6b7280"} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900">{option.title}</Text>
                      <Text className="text-xs text-gray-500">{option.desc}</Text>
                    </View>
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${active ? "border-amber-400 bg-amber-400" : "border-gray-300"}`}>
                      {active && <View className="w-2 h-2 rounded-full bg-white" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Summary */}
          <View>
            <SectionHeader title="Summary" showDots={false} />
            <View className="bg-white rounded-2xl p-4 gap-3" style={shadow.md}>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Subtotal</Text>
                <Text className="text-sm font-semibold text-gray-900">{fmt(subtotal)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Delivery Fee</Text>
                <Text className="text-sm font-semibold text-gray-900">{deliveryType === "pickup" ? "Free" : fmt(deliveryFee)}</Text>
              </View>
              <View className="h-px bg-gray-100" />
              <View className="flex-row justify-between">
                <Text className="text-base font-extrabold text-gray-900">Total</Text>
                <Text className="text-base font-extrabold text-amber-400">{fmt(total)}</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4 border-t border-gray-100"
        style={shadow.lg}
      >
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isProcessing || !canContinue}
          className={`rounded-2xl py-4 items-center ${
            !canContinue ? "bg-gray-200" : "bg-amber-400"
          }`}
          style={!canContinue ? undefined : shadow.btn}
        >
          {isProcessing
            ? <ActivityIndicator color="#fff" />
            : <Text className={`font-bold text-base ${!canContinue ? "text-gray-400" : "text-white"}`}>
                {deliveryType === "delivery" && !selectedAddressId ? "Select an address first" : `Continue — ${fmt(total)}`}
              </Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
