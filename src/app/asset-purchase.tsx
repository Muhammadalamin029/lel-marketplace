import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, CreditCard, Landmark, MapPin, Package } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { shadow } from "@/constants/shadows";
import { addressesApi, inspectionsApi, paymentsApi, productsApi } from "@/api";
import type { Address, Agreement, Car, Property } from "@/api";
import { useAuthStore } from "@/store/authStore";
import { useFinancingStore } from "@/store/financingStore";
import { fmt } from "@/utils/format";

type AssetType = "automotive" | "property";
type Step = "details" | "plan" | "payment" | "confirmation";
type PlanChoice = "full_payment" | "installment" | "monthly";
type PaymentMethod = "bank_transfer" | "card";

type TransferDetails = {
  account_number: string;
  account_name: string;
  bank_name: string;
  amount: number;
  reference: string;
  expires_at?: string | null;
};

export default function AssetPurchaseScreen() {
  useRequireAuth();
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type: AssetType }>();
  const { user, profile } = useAuthStore();
  const { myApplication, fetchMyApplication, isEligible } = useFinancingStore();

  const [step, setStep] = useState<Step>("details");
  const [asset, setAsset] = useState<Car | Property | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [planType, setPlanType] = useState<PlanChoice>("full_payment");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [duration, setDuration] = useState("6");
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id || !type) return;
      setLoading(true);
      try {
        const [assetData, addressData] = await Promise.all([
          type === "automotive" ? productsApi.getCarById(id) : productsApi.getPropertyById(id),
          addressesApi.list(),
          fetchMyApplication(),
        ]);
        setAsset(assetData);
        setAddresses(addressData);
        const def = addressData.find((a) => a.is_default) ?? addressData[0];
        if (def) setSelectedAddressId(def.id);
        const units = ((assetData as any).units ?? []).filter((u: any) => u.status === "available");
        if (units[0]) setSelectedUnitId(units[0].id);
      } catch (e: any) {
        Alert.alert("Could not load purchase", e?.response?.data?.detail ?? e?.message ?? "Please try again.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, type, fetchMyApplication, router]);

  const title = useMemo(() => {
    if (!asset) return "";
    return type === "automotive"
      ? `${(asset as Car).brand} ${(asset as Car).model} ${(asset as Car).year}`
      : (asset as Property).title;
  }, [asset, type]);

  const price = Number(asset?.price ?? 0);
  const minDepositPercent = Number((asset as any)?.min_deposit_percentage ?? 10);
  const depositAmount = Math.round(price * (minDepositPercent / 100));
  const monthlyAllowed = (asset as any)?.monthly_allowed !== false;
  const durationMonths = Number(duration) || 6;
  const monthlyInstallment = Math.round(price / durationMonths);
  const dueNow = planType === "full_payment" ? price : depositAmount;
  const paymentCategory = planType === "full_payment" ? "full_pay" : "asset_deposit";
  const units = ((asset as any)?.units ?? []) as any[];
  const availableUnits = units.filter((u) => u.status === "available");
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const choosePlan = async (plan: PlanChoice) => {
    if ((plan === "monthly" || plan === "installment") && !isEligible()) {
      Alert.alert(
        "Financing Application Required",
        myApplication
          ? "Your financing eligibility is not approved yet. Check your application status for details."
          : "You need an approved financing application before choosing this plan.",
        [
          { text: myApplication ? "View Status" : "Apply Now", onPress: () => router.push((myApplication ? "/my-financing-application" : "/financing-application") as any) },
          { text: "Cancel", style: "cancel" },
        ],
      );
      return;
    }
    if (plan === "monthly" && !monthlyAllowed) {
      Alert.alert("Unavailable", "Monthly payment is not available for this listing.");
      return;
    }
    setPlanType(plan);
    if (plan === "monthly") setPaymentMethod("card");
    setStep("payment");
  };

  const createAgreement = async () => {
    if (!asset || !id || !type) return null;
    if (!selectedAddressId) {
      Alert.alert("Address Required", "Please select a delivery or handover address.");
      setStep("details");
      return null;
    }
    if (availableUnits.length > 0 && !selectedUnitId) {
      Alert.alert("Unit Required", "Please select a unit to purchase.");
      setStep("details");
      return null;
    }
    if (agreement) return agreement;

    const created = await inspectionsApi.createAgreement({
      asset_type: type,
      asset_id: id,
      unit_id: selectedUnitId || undefined,
      total_price: price,
      deposit_paid: 0,
      payment_plan: planType,
      ...(planType === "monthly"
        ? { duration_months: durationMonths, monthly_installment: monthlyInstallment }
        : {}),
    });
    setAgreement(created);
    return created;
  };

  const startBankTransfer = async () => {
    if (!user?.email) return;
    setBusy(true);
    try {
      const created = await createAgreement();
      if (!created) return;
      const details = await paymentsApi.initializeBankTransfer({
        agreement_id: created.id,
        amount: dueNow,
        email: user.email,
        category: paymentCategory,
      }) as TransferDetails;
      setTransfer(details);
    } catch (e: any) {
      Alert.alert("Payment details failed", e?.response?.data?.detail ?? e?.message ?? "Could not generate bank transfer details.");
    } finally {
      setBusy(false);
    }
  };

  const startCardPayment = async () => {
    if (!user?.email) return;
    setBusy(true);
    try {
      const created = await createAgreement();
      if (!created) return;
      const payment = await paymentsApi.initialize({
        agreement_id: created.id,
        amount: dueNow,
        email: user.email,
        category: paymentCategory,
        callback_url: "lelmarketplace://payment-callback",
        payment_method: "paystack",
      }) as { authorization_url?: string };
      if (payment.authorization_url) {
        await Linking.openURL(payment.authorization_url);
      }
      setStep("confirmation");
    } catch (e: any) {
      Alert.alert("Payment failed", e?.response?.data?.detail ?? e?.message ?? "Could not start card payment.");
    } finally {
      setBusy(false);
    }
  };

  const verifyTransfer = async () => {
    if (!transfer?.reference) return;
    setBusy(true);
    try {
      const result = await paymentsApi.verify(transfer.reference) as { status?: string };
      const status = String(result?.status ?? "success").toLowerCase();
      if (!["success", "paid", "completed"].includes(status)) {
        Alert.alert("Payment not received yet", "We have not received your transfer yet. Please try again shortly after transferring.");
        return;
      }
      setStep("confirmation");
    } catch (e: any) {
      Alert.alert("Verification failed", e?.response?.data?.detail ?? e?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !asset) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-3">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-sm text-gray-400">Loading purchase…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title={step === "confirmation" ? "Payment Submitted" : "Purchase"} subtitle={title} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-5 gap-5">
          {step !== "confirmation" && (
            <View className="bg-white rounded-3xl p-5 gap-3" style={shadow.md}>
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-2xl bg-amber-50 items-center justify-center">
                  <Package size={22} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-extrabold text-gray-900" numberOfLines={2}>{title}</Text>
                  <Text className="text-xl font-black text-amber-500 mt-1">{fmt(price)}</Text>
                </View>
              </View>
            </View>
          )}

          {step === "details" && (
            <>
              <View className="bg-white rounded-3xl p-5 gap-4" style={shadow.md}>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide">Personal Information</Text>
                <InfoRow label="Full Name" value={(profile as any)?.name ?? user?.email?.split("@")[0] ?? "-"} />
                <InfoRow label="Email" value={user?.email ?? "-"} />
                <InfoRow label="Phone" value={(profile as any)?.phone ?? "Not set"} />
              </View>

              <View className="bg-white rounded-3xl p-5 gap-3" style={shadow.md}>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide">Delivery / Handover Address</Text>
                {addresses.length === 0 ? (
                  <TouchableOpacity onPress={() => router.push("/addresses")} className="border border-amber-200 rounded-2xl p-4 flex-row gap-3">
                    <MapPin size={18} color="#f59e0b" />
                    <Text className="text-sm font-bold text-amber-600 flex-1">Add an address to continue</Text>
                  </TouchableOpacity>
                ) : addresses.map((address) => (
                  <SelectableRow
                    key={address.id}
                    active={selectedAddressId === address.id}
                    title={address.title}
                    subtitle={`${address.street_address}, ${address.city}, ${address.state_province}`}
                    onPress={() => setSelectedAddressId(address.id)}
                  />
                ))}
              </View>

              {availableUnits.length > 0 && (
                <View className="bg-white rounded-3xl p-5 gap-3" style={shadow.md}>
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide">Choose a Unit</Text>
                  {availableUnits.map((unit) => (
                    <SelectableRow
                      key={unit.id}
                      active={selectedUnitId === unit.id}
                      title={type === "automotive" ? `VIN ${unit.vin ?? "N/A"}` : unit.unit_name || "Unit"}
                      subtitle={type === "automotive" ? unit.color || "Available unit" : unit.unit_number || "Available unit"}
                      onPress={() => setSelectedUnitId(unit.id)}
                    />
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (!selectedAddressId) Alert.alert("Address Required", "Please select or add an address.");
                  else setStep("plan");
                }}
                className="bg-amber-400 py-4 rounded-2xl items-center"
                style={shadow.btn}
              >
                <Text className="text-white font-bold">Next</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "plan" && (
            <>
              <PlanCard
                active={planType === "full_payment"}
                title="Full Payment plan"
                subtitle="Pay in full, no recurring charges"
                rows={[["Full Payment", fmt(price)]]}
                onPress={() => choosePlan("full_payment")}
              />
              <PlanCard
                active={planType === "installment"}
                title="Installment plan"
                subtitle="Pay a deposit now, clear the balance over time"
                rows={[
                  ["Deposit Due Now", fmt(depositAmount)],
                  ["Remaining Balance", fmt(price - depositAmount)],
                ]}
                onPress={() => choosePlan("installment")}
              />
              <PlanCard
                active={planType === "monthly"}
                title="Monthly Payment plan"
                subtitle={monthlyAllowed ? "Pay flexible monthly installments" : "Unavailable for this listing"}
                rows={[
                  ["Monthly Rent", fmt(monthlyInstallment)],
                  ["Caution Fee", fmt(depositAmount)],
                  ["Total Due Now", fmt(depositAmount)],
                ]}
                disabled={!monthlyAllowed}
                onPress={() => choosePlan("monthly")}
              />
              {planType === "monthly" && monthlyAllowed && (
                <View className="flex-row gap-2">
                  {["6", "12"].map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDuration(d)}
                      className={`flex-1 py-3 rounded-xl items-center ${duration === d ? "bg-amber-400" : "bg-white border border-gray-200"}`}
                    >
                      <Text className={`font-bold ${duration === d ? "text-white" : "text-gray-700"}`}>{d} Months</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {step === "payment" && (
            <>
              <View className="bg-white rounded-3xl p-5 gap-3" style={shadow.md}>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide">Payment Summary</Text>
                <InfoRow label={type === "automotive" ? "Car" : "Property"} value={title} />
                <InfoRow label="Payment Plan" value={planType.replace("_", " ")} />
                <InfoRow label="Due Now" value={fmt(dueNow)} highlight />
                {selectedAddress && <InfoRow label="Address" value={`${selectedAddress.city}, ${selectedAddress.state_province}`} />}
              </View>

              <View className="bg-white rounded-3xl p-5 gap-3" style={shadow.md}>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide">Payment Method</Text>
                {planType !== "monthly" && (
                  <SelectableRow
                    active={paymentMethod === "bank_transfer"}
                    title="Bank Transfer"
                    subtitle="Make a direct transfer to a generated account."
                    onPress={() => setPaymentMethod("bank_transfer")}
                  />
                )}
                <SelectableRow
                  active={paymentMethod === "card"}
                  title="Card"
                  subtitle="Pay securely with your debit or credit card."
                  onPress={() => setPaymentMethod("card")}
                />
              </View>

              {!transfer ? (
                <TouchableOpacity
                  onPress={paymentMethod === "bank_transfer" ? startBankTransfer : startCardPayment}
                  disabled={busy}
                  className="bg-amber-400 py-4 rounded-2xl flex-row items-center justify-center gap-2"
                  style={shadow.btn}
                >
                  {busy ? <ActivityIndicator color="#fff" /> : (
                    <>
                      {paymentMethod === "bank_transfer" ? <Landmark size={16} color="#fff" /> : <CreditCard size={16} color="#fff" />}
                      <Text className="text-white font-bold">Complete Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View className="bg-white rounded-3xl p-5 gap-4" style={shadow.md}>
                  <Text className="text-base font-extrabold text-gray-900">Bank Transfer Details</Text>
                  {[
                    ["Bank", transfer.bank_name],
                    ["Account Number", transfer.account_number],
                    ["Account Name", transfer.account_name],
                    ["Amount", fmt(transfer.amount)],
                    ["Reference", transfer.reference],
                  ].map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
                  {transfer.expires_at && (
                    <Text className="text-xs text-amber-600">Expires at {new Date(transfer.expires_at).toLocaleString()}</Text>
                  )}
                  <TouchableOpacity onPress={verifyTransfer} disabled={busy} className="bg-amber-400 py-4 rounded-2xl items-center" style={shadow.btn}>
                    {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">I have sent the payment</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {step === "confirmation" && (
            <View className="bg-white rounded-3xl p-6 items-center gap-4" style={shadow.md}>
              <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center">
                <Check size={40} color="#22c55e" />
              </View>
              <Text className="text-2xl font-extrabold text-gray-900">Payment Submitted</Text>
              <Text className="text-sm text-gray-500 text-center">
                Thank you. Your purchase has been received and your agreement is ready to view.
              </Text>
              <TouchableOpacity
                onPress={() => agreement ? router.replace(`/agreement-details?id=${agreement.id}` as any) : router.replace("/my-agreements")}
                className="w-full bg-amber-400 py-4 rounded-2xl items-center"
                style={shadow.btn}
              >
                <Text className="text-white font-bold">View My Purchase</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between gap-4">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className={`text-sm font-bold flex-1 text-right ${highlight ? "text-amber-500" : "text-gray-900"}`}>{value}</Text>
    </View>
  );
}

function SelectableRow({ active, title, subtitle, onPress }: { active: boolean; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-2xl p-4 flex-row items-center gap-3 border-2 ${active ? "border-amber-400 bg-amber-50" : "border-gray-100 bg-white"}`}
    >
      <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${active ? "border-amber-400 bg-amber-400" : "border-gray-300"}`}>
        {active && <View className="w-2 h-2 rounded-full bg-white" />}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-gray-900">{title}</Text>
        <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

function PlanCard({
  active,
  title,
  subtitle,
  rows,
  onPress,
  disabled,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  rows: [string, string][];
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`bg-white rounded-3xl p-5 gap-4 border-2 ${active && !disabled ? "border-amber-400" : "border-transparent"} ${disabled ? "opacity-60" : ""}`}
      style={shadow.md}
    >
      <View className="flex-row items-start gap-3">
        <View className={`w-6 h-6 rounded-full items-center justify-center ${active && !disabled ? "bg-amber-400" : "bg-gray-100"}`}>
          {active && !disabled && <Check size={14} color="#fff" />}
        </View>
        <View className="flex-1">
          <Text className="text-base font-extrabold text-gray-900">{title}</Text>
          <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
        </View>
      </View>
      <View className="gap-2">
        {rows.map(([label, value]) => <InfoRow key={label} label={label} value={value} highlight={label.includes("Due") || label.includes("Payment")} />)}
      </View>
    </TouchableOpacity>
  );
}
