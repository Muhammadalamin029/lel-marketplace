import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, TextInput, Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { PrimaryButton, LabeledInput } from "@/components/forms";
import { COLORS } from "@/constants/brand";
import { fmt } from "@/utils/format";
import { useCartStore } from "@/store/cartStore";
import { ordersApi } from "@/api/orders";
import { addressesApi, paymentsApi, publicApi } from "@/api";
import type { Address, CheckoutSummary, DeliverySettings, InstallmentEligibility } from "@/api";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle, Copy, Package, Landmark, Wallet } from "lucide-react-native";

type Step = "delivery" | "payment" | "review";
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

const STEPS: { id: Step; label: string }[] = [
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
];

function Stepper({ step }: { step: Step }) {
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    <View className="px-5 pt-2 pb-4">
      <View className="flex-row gap-1.5">
        {STEPS.map((s, i) => (
          <View
            key={s.id}
            className="flex-1 rounded-full"
            style={{ height: 4, backgroundColor: i <= idx ? COLORS.primary : "#e5e7eb" }}
          />
        ))}
      </View>
      <View className="flex-row mt-1.5">
        {STEPS.map((s, i) => (
          <Text
            key={s.id}
            className="flex-1 text-[11px]"
            style={{ color: i <= idx ? "#111827" : "#9ca3af", fontWeight: i === idx ? "700" : "400" }}
          >
            {s.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function useCountdown(expiresAt?: string | null) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!expiresAt) { setLeft(""); return; }
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) { setLeft("Expired"); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return left;
}

export default function CheckoutScreen() {
  useRequireAuth();
  const router = useRouter();
  const { pendingOrder, fetchPendingOrder, clearCart } = useCartStore();
  const { user, profile } = useAuthStore();

  const [step, setStep] = useState<Step>("delivery");
  const [processing, setProcessing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [installment, setInstallment] = useState<InstallmentEligibility | null>(null);
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [installmentTransferStarted, setInstallmentTransferStarted] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [instructions, setInstructions] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!fullName) setFullName((profile as any)?.name ?? "");
    if (!phone) setPhone((profile as any)?.phone ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const order = checkoutSummary?.order ?? pendingOrder;
  const items = order?.order_items ?? [];
  const subtotal = Number(checkoutSummary?.summary.subtotal ?? order?.total_amount ?? 0);
  const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
  const deliveryFee = deliveryType === "pickup"
    ? 0
    : Number(selectedAddress?.delivery_state?.delivery_price ?? deliverySettings?.base_delivery_price ?? checkoutSummary?.summary.delivery_fee ?? 0);
  const total = subtotal + deliveryFee;
  const canContinue = items.length > 0 && (deliveryType === "pickup" || !!selectedAddressId);

  const countdown = useCountdown(transfer?.expires_at);

  const copyNumber = () => {
    if (transfer) {
      Clipboard.setString(transfer.account_number);
      Alert.alert("Copied", "Account number copied to clipboard.");
    }
  };

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

    setProcessing(true);
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
      setProcessing(false);
    }
  };

  const verifyTransfer = async () => {
    if (!transfer?.reference) return;
    setVerifyingPayment(true);
    try {
      const result = await paymentsApi.verify(transfer.reference) as { status?: string };
      const status = String(result?.status ?? "success").toLowerCase();
      if (!["success", "paid", "completed"].includes(status)) {
        Alert.alert("Payment not received yet", "We have not received your transfer yet. Please try again shortly after transferring.");
        return;
      }
      await clearCart();
      setStep("review");
    } catch (e: any) {
      Alert.alert("Verification failed", e?.response?.data?.detail ?? e?.message ?? "Please try again.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleContinueFromDelivery = async () => {
    if (!fullName.trim()) {
      Alert.alert("Full Name Required", "Please enter the recipient's full name.");
      return;
    }
    if (deliveryType === "delivery" && !selectedAddressId) {
      Alert.alert("Address Required", "Please select a delivery address before continuing.");
      return;
    }
    if (!pendingOrder || items.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty.");
      return;
    }

    setProcessing(true);
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
      setConfirmedTotal(Number(confirmation.total_amount ?? total));

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
      Alert.alert("Checkout Failed", e?.response?.data?.detail ?? e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0 && !loadingAddresses && !confirmedOrderId) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-4 px-8">
        <Package size={48} color="#d1d5db" />
        <Text className="text-lg font-grotesk-bold text-gray-900">Your cart is empty</Text>
        <Text className="font-manrope text-sm text-gray-400 text-center">Add items before checking out.</Text>
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

  const stepNumber = step === "delivery" ? 1 : step === "payment" ? 2 : 3;
  const stepName = step === "delivery" ? "Delivery" : step === "payment" ? "Payment" : "Review";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Checkout" subtitle={`Step ${stepNumber} of 3 ${stepName}`} />
      <Stepper step={step} />

      {/* ── STEP 1: DELIVERY ── */}
      {step === "delivery" && (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <View className="px-5 gap-4">
              <LabeledInput label="Full name" value={fullName} onChangeText={setFullName} placeholder="Oluwasegun Adebayo" autoCapitalize="words" />
              <LabeledInput
                label="Phone number" value={phone} onChangeText={setPhone}
                placeholder="+234 803 412 8890" keyboardType="phone-pad"
                hint="We call before delivery"
              />

              {/* Delivery method */}
              <View className="gap-1.5">
                <Text className="text-xs font-grotesk-bold text-gray-900">Delivery method</Text>
                <View className="flex-row gap-2">
                  {(["delivery", "pickup"] as DeliveryType[]).map((t) => {
                    const active = deliveryType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setDeliveryType(t)}
                        className="flex-1 py-3 rounded-lg items-center border"
                        style={{
                          backgroundColor: active ? COLORS.primarySoft : "#fff",
                          borderColor: active ? COLORS.primary : COLORS.inputBorder,
                        }}
                      >
                        <Text className="text-xs font-grotesk-bold" style={{ color: active ? COLORS.primary : "#374151" }}>
                          {t === "delivery" ? "Delivery" : "Pickup"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Address */}
              <View className="gap-1.5">
                <Text className="text-xs font-grotesk-bold text-gray-900">Delivery address</Text>
                {deliveryType === "pickup" ? (
                  <View className="border rounded-lg px-4 py-3.5" style={{ borderColor: COLORS.inputBorder }}>
                    <Text className="text-sm font-grotesk-semibold text-gray-900">
                      {deliverySettings?.store_pickup_location || "Store pickup"}
                    </Text>
                    <Text className="font-manrope text-xs text-gray-400 mt-0.5">
                      {deliverySettings?.store_pickup_address || "No delivery fee will be charged."}
                    </Text>
                  </View>
                ) : loadingAddresses ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : addresses.length === 0 ? (
                  <TouchableOpacity
                    onPress={() => router.push("/addresses")}
                    className="border rounded-lg px-4 py-3.5"
                    style={{ borderColor: COLORS.primary }}
                  >
                    <Text className="text-sm font-grotesk-semibold" style={{ color: COLORS.primary }}>
                      Add a delivery address first →
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View className="gap-2">
                    {addresses.map((addr) => {
                      const active = selectedAddressId === addr.id;
                      return (
                        <TouchableOpacity
                          key={addr.id}
                          onPress={() => setSelectedAddressId(addr.id)}
                          className="border rounded-lg px-4 py-3 flex-row items-center gap-3"
                          style={{ borderColor: active ? COLORS.primary : COLORS.inputBorder }}
                        >
                          <View
                            className="w-4 h-4 rounded-full border-2 items-center justify-center"
                            style={{ borderColor: active ? COLORS.primary : "#d1d5db" }}
                          >
                            {active && <View className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />}
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-grotesk-bold text-gray-900">{addr.title}</Text>
                            <Text className="font-manrope text-xs text-gray-500" numberOfLines={1}>
                              {addr.street_address}, {addr.city}, {addr.state_province}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity onPress={() => router.push("/addresses")} className="self-end">
                      <Text className="text-xs font-grotesk-semibold" style={{ color: COLORS.primary }}>+ Add new address</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <LabeledInput
                label="Delivery instructions (optional)" value={instructions} onChangeText={setInstructions}
                placeholder="e.g. Call when you reach the estate gate" multiline
              />

              {/* Payment method */}
              <View className="gap-1.5">
                <Text className="text-xs font-grotesk-bold text-gray-900">Payment method</Text>
                {([
                  { key: "bank_transfer", title: "Bank Transfer", desc: "Transfer to a dedicated account.", Icon: Landmark },
                  { key: "installment", title: "Installment plan", desc: "Pay a first amount now, top up later.", Icon: Wallet },
                ] as const).map((option) => {
                  const active = paymentMethod === option.key;
                  const Icon = option.Icon;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setPaymentMethod(option.key)}
                      className="border rounded-lg p-3.5 flex-row items-center gap-3"
                      style={{ borderColor: active ? COLORS.primary : COLORS.inputBorder }}
                    >
                      <Icon size={18} color={active ? COLORS.primary : "#6b7280"} />
                      <View className="flex-1">
                        <Text className="text-sm font-grotesk-bold text-gray-900">{option.title}</Text>
                        <Text className="font-manrope text-xs text-gray-400">{option.desc}</Text>
                      </View>
                      <View
                        className="w-4 h-4 rounded-full border-2 items-center justify-center"
                        style={{ borderColor: active ? COLORS.primary : "#d1d5db" }}
                      >
                        {active && <View className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Summary */}
              <View className="gap-2 border-t border-gray-100 pt-4">
                <View className="flex-row justify-between">
                  <Text className="font-manrope text-[13px] text-gray-500">Subtotal</Text>
                  <Text className="text-[13px] font-grotesk-bold text-gray-900">{fmt(subtotal)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="font-manrope text-[13px] text-gray-500">Delivery Fee</Text>
                  <Text className="text-[13px] font-grotesk-bold text-gray-900">
                    {deliveryType === "pickup" ? "Free" : fmt(deliveryFee)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm font-grotesk-extrabold text-gray-900">Total</Text>
                  <Text className="text-sm font-grotesk-extrabold" style={{ color: COLORS.primary }}>{fmt(total)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
          <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-3 border-t border-gray-100">
            <PrimaryButton title={processing ? "Processing…" : "Continue"} onPress={handleContinueFromDelivery} disabled={!canContinue || processing} busy={processing} />
          </View>
        </>
      )}

      {/* ── STEP 2: PAYMENT ── */}
      {step === "payment" && (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <View className="px-5 gap-4">
              <View>
                <Text className="text-lg font-grotesk-extrabold text-gray-900">Complete your payment.</Text>
                <Text className="font-manrope text-[13px] text-gray-400 mt-1">
                  Transfer the exact amount to the account below to complete your payment
                </Text>
              </View>

              {paymentMethod === "installment" && installment && !installmentTransferStarted ? (
                <View className="border border-gray-100 rounded-2xl p-5 gap-4">
                  {installment.eligible ? (
                    <>
                      <View className="gap-2.5">
                        <View className="flex-row justify-between">
                          <Text className="font-manrope text-[13px] text-gray-500">Order total</Text>
                          <Text className="text-[13px] font-grotesk-bold text-gray-900">{fmt(installment.total_amount)}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="font-manrope text-[13px] text-gray-500">Remaining balance</Text>
                          <Text className="text-[13px] font-grotesk-bold text-gray-900">{fmt(installment.remaining_balance)}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="font-manrope text-[13px] text-gray-500">Minimum first payment</Text>
                          <Text className="text-[13px] font-grotesk-bold text-gray-900">{fmt(installment.min_initial_amount)}</Text>
                        </View>
                      </View>
                      <View className="gap-1.5">
                        <Text className="text-xs font-grotesk-bold text-gray-900">Amount to pay now</Text>
                        <TextInput
                          value={installmentAmount}
                          onChangeText={setInstallmentAmount}
                          keyboardType="numeric"
                          placeholder="Enter amount"
                          placeholderTextColor="#bdbdbd"
                          className="border rounded-lg px-4 py-3.5 font-grotesk-bold text-sm text-gray-900"
                          style={{ borderColor: COLORS.inputBorder }}
                        />
                      </View>
                      <PrimaryButton title="Continue to transfer" onPress={beginInstallmentTransfer} disabled={processing} busy={processing} />
                    </>
                  ) : (
                    <Text className="font-manrope text-sm text-gray-500 text-center py-4">
                      {installment.reason ?? "This order is not eligible for installment payment."}
                    </Text>
                  )}
                </View>
              ) : transfer ? (
                <View className="border border-gray-100 rounded-2xl p-5 gap-4">
                  <View>
                    <Text className="text-sm font-grotesk-extrabold text-gray-900">Bank Transfer Details</Text>
                    <Text className="font-manrope text-xs text-gray-400 mt-0.5">Please send the exact amount to the account below</Text>
                  </View>
                  <View className="gap-3">
                    {[
                      ["Bank name", transfer.bank_name],
                      ["Account Name", transfer.account_name],
                    ].map(([label, value]) => (
                      <View key={label} className="flex-row justify-between">
                        <Text className="font-manrope text-[13px] text-gray-500">{label}</Text>
                        <Text className="text-[13px] font-grotesk-bold text-gray-900">{value}</Text>
                      </View>
                    ))}
                    <View className="flex-row justify-between items-center">
                      <Text className="font-manrope text-[13px] text-gray-500">Account Number</Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[13px] font-grotesk-extrabold text-gray-900">{transfer.account_number}</Text>
                        <TouchableOpacity onPress={copyNumber} hitSlop={8}>
                          <Copy size={14} color="#9ca3af" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  <View className="rounded-xl px-4 py-3 gap-1.5" style={{ backgroundColor: COLORS.peach }}>
                    <View className="flex-row justify-between">
                      <Text className="text-xs font-grotesk-semibold" style={{ color: COLORS.primary }}>Amount to Transfer</Text>
                      <Text className="text-xs font-grotesk-extrabold" style={{ color: COLORS.primary }}>{fmt(transfer.amount)}</Text>
                    </View>
                    {!!countdown && (
                      <View className="flex-row justify-between">
                        <Text className="text-xs font-grotesk-semibold" style={{ color: COLORS.primary }}>Complete your payment within</Text>
                        <Text className="text-xs font-grotesk-extrabold" style={{ color: COLORS.primary }}>{countdown}</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <CheckCircle size={12} color="#9ca3af" />
                    <Text className="font-manrope text-[11px] text-gray-400">We will confirm your payment and give you an update</Text>
                  </View>
                  <PrimaryButton
                    title={verifyingPayment ? "Verifying…" : "I've Made The Transfer Payment"}
                    onPress={verifyTransfer}
                    disabled={verifyingPayment}
                    busy={verifyingPayment}
                  />
                </View>
              ) : (
                <View className="items-center py-10">
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}

      {/* ── STEP 3: REVIEW ── */}
      {step === "review" && (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <View className="px-5 gap-4 items-center pt-6">
              <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: "#f0fdf4" }}>
                <CheckCircle size={40} color={COLORS.success} />
              </View>
              <Text className="text-xl font-grotesk-extrabold text-gray-900">Payment Submitted!</Text>
              <Text className="font-manrope text-[13px] text-gray-500 text-center leading-relaxed">
                We'll verify your transfer and update your order shortly.{"\n"}
                {confirmedOrderId ? `Order #${confirmedOrderId.slice(-8).toUpperCase()} · ${fmt(confirmedTotal)}` : ""}
              </Text>
              <View className="w-full gap-2.5 mt-2">
                <PrimaryButton
                  title="Track My Order"
                  onPress={() => confirmedOrderId
                    ? router.push(`/order-details?id=${confirmedOrderId}` as any)
                    : router.push("/orders")}
                />
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)")}
                  className="rounded-xl border border-gray-300 py-4 items-center"
                >
                  <Text className="text-sm font-grotesk-bold text-gray-700">Continue Shopping</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}
