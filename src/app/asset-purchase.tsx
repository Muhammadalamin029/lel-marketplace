import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, CreditCard, Landmark, Package } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { shadow } from "@/constants/shadows";
import { inspectionsApi, paymentsApi, productsApi } from "@/api";
import type { Agreement, Car, Property } from "@/api";
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
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [planType, setPlanType] = useState<PlanChoice>("full_payment");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [duration, setDuration] = useState("6");
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!id || !type) return;
      setLoading(true);
      try {
        const [assetData] = await Promise.all([
          type === "automotive" ? productsApi.getCarById(id) : productsApi.getPropertyById(id),
          fetchMyApplication(),
        ]);
        setAsset(assetData);
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
    if (!user?.email || busyRef.current) return;
    busyRef.current = true;
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
      busyRef.current = false;
    }
  };

  const startCardPayment = async () => {
    if (!user?.email || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const created = await createAgreement();
      if (!created) return;
      setCardReady(true);
    } catch (e: any) {
      Alert.alert("Payment failed", e?.response?.data?.detail ?? e?.message ?? "Could not start card payment.");
    } finally {
      setBusy(false);
      busyRef.current = false;
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
        <ActivityIndicator size="large" color="#ff4b26" />
        <Text className="font-manrope text-sm text-gray-400">Loading purchase…</Text>
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
                <View className="w-12 h-12 rounded-2xl bg-[#fff0e9] items-center justify-center">
                  <Package size={22} color="#ff4b26" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-grotesk-extrabold text-gray-900" numberOfLines={2}>{title}</Text>
                  <Text className="text-xl font-grotesk-extrabold text-[#ff4b26] mt-1">{fmt(price)}</Text>
                </View>
              </View>
            </View>
          )}

          {step === "details" && (
            <>
              <View className="bg-white rounded-3xl p-5 gap-4" style={shadow.md}>
                <Text className="text-xs font-grotesk-bold text-gray-400 uppercase tracking-wide">Personal Information</Text>
                <InfoRow label="Full Name" value={(profile as any)?.name ?? user?.email?.split("@")[0] ?? "-"} />
                <InfoRow label="Email" value={user?.email ?? "-"} />
                <InfoRow label="Phone" value={(profile as any)?.phone ?? "Not set"} />
              </View>

              {availableUnits.length > 0 && (
                <View className="bg-white rounded-3xl p-5 gap-3" style={shadow.md}>
                  <Text className="text-xs font-grotesk-bold text-gray-400 uppercase tracking-wide">Choose a Unit</Text>
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
                onPress={() => setStep("plan")}
                className="bg-[#ff4b26] py-4 rounded-2xl items-center"
                style={shadow.btn}
              >
                <Text className="text-white font-grotesk-bold">Next</Text>
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
                      className={`flex-1 py-3 rounded-xl items-center ${duration === d ? "bg-[#ff4b26]" : "bg-white border border-gray-200"}`}
                    >
                      <Text className={`font-grotesk-bold ${duration === d ? "text-white" : "text-gray-700"}`}>{d} Months</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {step === "payment" && (
            <>
              <View className="bg-white rounded-3xl p-5 gap-3" style={shadow.md}>
                <Text className="text-xs font-grotesk-bold text-gray-400 uppercase tracking-wide">Payment Summary</Text>
                <InfoRow label={type === "automotive" ? "Car" : "Property"} value={title} />
                <InfoRow label="Payment Plan" value={planType.replace("_", " ")} />
                <InfoRow label="Due Now" value={fmt(dueNow)} highlight />
              </View>

              <View className="bg-white rounded-3xl p-5 gap-3" style={shadow.md}>
                <Text className="text-xs font-grotesk-bold text-gray-400 uppercase tracking-wide">Payment Method</Text>
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
                paymentMethod === "card" ? (
                  cardReady && agreement ? (
                    <View className="bg-white rounded-3xl p-5 gap-4" style={shadow.md}>
                      <Text className="text-base font-grotesk-extrabold text-gray-900">Card Payment</Text>
                      <CardPaymentForm
                        agreementId={agreement.id}
                        amount={dueNow}
                        email={user?.email ?? ""}
                        category={paymentCategory}
                        onSuccess={() => setStep("confirmation")}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={startCardPayment}
                      disabled={busy}
                      className="bg-[#ff4b26] py-4 rounded-2xl flex-row items-center justify-center gap-2"
                      style={shadow.btn}
                    >
                      {busy ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <CreditCard size={16} color="#fff" />
                          <Text className="text-white font-grotesk-bold">Continue to Card Payment</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )
                ) : (
                <TouchableOpacity
                  onPress={startBankTransfer}
                  disabled={busy}
                  className="bg-[#ff4b26] py-4 rounded-2xl flex-row items-center justify-center gap-2"
                  style={shadow.btn}
                >
                  {busy ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Landmark size={16} color="#fff" />
                      <Text className="text-white font-grotesk-bold">Complete Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
                )
              ) : (
                <View className="bg-white rounded-3xl p-5 gap-4" style={shadow.md}>
                  <Text className="text-base font-grotesk-extrabold text-gray-900">Bank Transfer Details</Text>
                  {[
                    ["Bank", transfer.bank_name],
                    ["Account Number", transfer.account_number],
                    ["Account Name", transfer.account_name],
                    ["Amount", fmt(transfer.amount)],
                    ["Reference", transfer.reference],
                  ].map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
                  {transfer.expires_at && (
                    <Text className="font-grotesk text-xs text-[#e03f1c]">Expires at {new Date(transfer.expires_at).toLocaleString()}</Text>
                  )}
                  <TouchableOpacity onPress={verifyTransfer} disabled={busy} className="bg-[#ff4b26] py-4 rounded-2xl items-center" style={shadow.btn}>
                    {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-grotesk-bold">I have sent the payment</Text>}
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
              <Text className="text-2xl font-grotesk-extrabold text-gray-900">Payment Submitted</Text>
              <Text className="font-manrope text-sm text-gray-500 text-center">
                Thank you. Your purchase has been received and your agreement is ready to view.
              </Text>
              <TouchableOpacity
                onPress={() => agreement ? router.replace(`/agreement-details?id=${agreement.id}` as any) : router.replace("/my-agreements")}
                className="w-full bg-[#ff4b26] py-4 rounded-2xl items-center"
                style={shadow.btn}
              >
                <Text className="text-white font-grotesk-bold">View My Purchase</Text>
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
      <Text className="font-manrope text-sm text-gray-500">{label}</Text>
      <Text className={`text-sm font-grotesk-bold flex-1 text-right ${highlight ? "text-[#ff4b26]" : "text-gray-900"}`}>{value}</Text>
    </View>
  );
}

function SelectableRow({ active, title, subtitle, onPress }: { active: boolean; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-2xl p-4 flex-row items-center gap-3 border-2 ${active ? "border-[#ff4b26] bg-[#fff0e9]" : "border-gray-100 bg-white"}`}
    >
      <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${active ? "border-[#ff4b26] bg-[#ff4b26]" : "border-gray-300"}`}>
        {active && <View className="w-2 h-2 rounded-full bg-white" />}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-grotesk-bold text-gray-900">{title}</Text>
        <Text className="font-manrope text-xs text-gray-500 mt-0.5">{subtitle}</Text>
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
      className={`bg-white rounded-3xl p-5 gap-4 border-2 ${active && !disabled ? "border-[#ff4b26]" : "border-transparent"} ${disabled ? "opacity-60" : ""}`}
      style={shadow.md}
    >
      <View className="flex-row items-start gap-3">
        <View className={`w-6 h-6 rounded-full items-center justify-center ${active && !disabled ? "bg-[#ff4b26]" : "bg-gray-100"}`}>
          {active && !disabled && <Check size={14} color="#fff" />}
        </View>
        <View className="flex-1">
          <Text className="text-base font-grotesk-extrabold text-gray-900">{title}</Text>
          <Text className="font-manrope text-sm text-gray-500 mt-1">{subtitle}</Text>
        </View>
      </View>
      <View className="gap-2">
        {rows.map(([label, value]) => <InfoRow key={label} label={label} value={value} highlight={label.includes("Due") || label.includes("Payment")} />)}
      </View>
    </TouchableOpacity>
  );
}

function CardField({ label, value, onChange, placeholder, secure, numeric }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  numeric?: boolean;
}) {
  return (
    <View className="gap-1.5">
      <Text className="font-manrope text-xs text-gray-500">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        secureTextEntry={secure}
        keyboardType={numeric ? "number-pad" : "default"}
        autoCapitalize="none"
        className="border border-gray-200 rounded-xl px-4 py-3 font-manrope text-sm text-gray-900 bg-gray-50"
      />
    </View>
  );
}

/** Direct-API card form: card → PIN/AVS/OTP/3DS → verify. Card data is never stored. */
function CardPaymentForm({ agreementId, amount, email, category, onSuccess }: {
  agreementId: string;
  amount: number;
  email: string;
  category: "asset_deposit" | "asset_installment" | "full_pay";
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"card" | "pin" | "avs" | "otp" | "redirect">("card");
  const [busy, setBusy] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [avs, setAvs] = useState({ address: "", city: "", state: "", country: "", zipcode: "" });
  const [txRef, setTxRef] = useState<string | null>(null);
  const [cardSnap, setCardSnap] = useState<{ card_number: string; cvv: string; expiry_month: string; expiry_year: string } | null>(null);

  const digits = cardNumber.replace(/\D/g, "");
  const expDigits = expiry.replace(/\D/g, "");

  const applyNextStep = (data: any) => {
    if (data?.tx_ref) setTxRef(data.tx_ref);
    const next = String(data?.next_step ?? "");
    if (next === "success") {
      onSuccess();
      return;
    }
    if (next === "pin") return setStep("pin");
    if (next === "avs") return setStep("avs");
    if (next === "otp") {
      Alert.alert("OTP sent", String(data?.processor_response ?? "Enter the OTP sent to your phone."));
      return setStep("otp");
    }
    if (next === "redirect") return setStep("redirect");
    Alert.alert("Card payment failed", String(data?.processor_response ?? "The card charge was declined."));
  };

  const charge = async () => {
    if (digits.length < 13) return Alert.alert("Invalid card", "Please enter a valid card number.");
    if (expDigits.length !== 4) return Alert.alert("Invalid expiry", "Please enter expiry as MM/YY.");
    if (!/^\d{3,4}$/.test(cvv)) return Alert.alert("Invalid CVV", "Please enter a valid CVV.");
    const snap = { card_number: digits, cvv, expiry_month: expDigits.slice(0, 2), expiry_year: expDigits.slice(2) };
    setCardSnap(snap);
    setBusy(true);
    try {
      const res = await paymentsApi.chargeCard({
        agreement_id: agreementId, amount, email, category,
        card_number: snap.card_number, cvv: snap.cvv,
        expiry_month: snap.expiry_month, expiry_year: snap.expiry_year,
        fullname: holder || undefined,
      }) as any;
      const data = res?.data ?? res;
      if (res?.success === false) {
        Alert.alert("Card payment failed", String(res?.message ?? "Could not start card payment."));
        return;
      }
      applyNextStep(data);
    } catch (e: any) {
      Alert.alert("Card payment failed", e?.response?.data?.detail ?? e?.message ?? "Could not start card payment.");
    } finally {
      setBusy(false);
    }
  };

  const authorize = async (authorization: Record<string, any>) => {
    if (!txRef || !cardSnap) return Alert.alert("Session expired", "Please re-enter your card details.");
    setBusy(true);
    try {
      const res = await paymentsApi.authorizeCard({
        tx_ref: txRef,
        card_number: cardSnap.card_number, cvv: cardSnap.cvv,
        expiry_month: cardSnap.expiry_month, expiry_year: cardSnap.expiry_year,
        authorization, email, fullname: holder || undefined,
      }) as any;
      const data = res?.data ?? res;
      if (res?.success === false) {
        Alert.alert("Authorization failed", String(res?.message ?? "Card authorization failed."));
        return;
      }
      applyNextStep(data);
    } catch (e: any) {
      Alert.alert("Authorization failed", e?.response?.data?.detail ?? e?.message ?? "Card authorization failed.");
    } finally {
      setBusy(false);
    }
  };

  const validate = async () => {
    if (!txRef) return Alert.alert("Session expired", "Please start again.");
    if (!/^\d{4,8}$/.test(otp.trim())) return Alert.alert("Invalid OTP", "Please enter the OTP sent to your phone.");
    setBusy(true);
    try {
      const res = await paymentsApi.validateCard(txRef, otp.trim()) as any;
      const data = res?.data ?? res;
      if (res?.success && data?.next_step === "success") {
        onSuccess();
      } else {
        Alert.alert("OTP failed", String(res?.message ?? "OTP validation failed."));
      }
    } catch (e: any) {
      Alert.alert("OTP failed", e?.response?.data?.detail ?? e?.message ?? "OTP validation failed.");
    } finally {
      setBusy(false);
    }
  };

  const confirmRedirect = async () => {
    if (!txRef) return Alert.alert("Session expired", "Please start again.");
    setBusy(true);
    try {
      await paymentsApi.verify(txRef);
      onSuccess();
    } catch (e: any) {
      Alert.alert("Not completed yet", e?.response?.data?.detail ?? "Bank authentication is not complete yet. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitLabel =
    step === "card" ? "Pay" :
    step === "pin" || step === "avs" ? "Authorize Payment" :
    step === "otp" ? "Confirm OTP" : "I've Completed Authentication";

  const onSubmit = () => {
    if (step === "card") return charge();
    if (step === "pin") return authorize({ mode: "pin", pin });
    if (step === "avs") return authorize({ mode: "avs_noauth", ...avs });
    if (step === "otp") return validate();
    return confirmRedirect();
  };

  return (
    <View className="gap-3">
      {step === "card" && (
        <>
          <CardField label="Card number" value={cardNumber} onChange={(v) => setCardNumber(v.replace(/[^\d]/g, "").slice(0, 19))} placeholder="5531 8866 5214 2950" numeric />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <CardField label="Expiry (MM/YY)" value={expiry} onChange={(v) => setExpiry(v.replace(/\D/g, "").slice(0, 4))} placeholder="0932" numeric />
            </View>
            <View className="flex-1">
              <CardField label="CVV" value={cvv} onChange={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))} placeholder="564" secure numeric />
            </View>
          </View>
          <CardField label="Cardholder name" value={holder} onChange={setHolder} placeholder="Full name on card" />
        </>
      )}
      {step === "pin" && (
        <CardField label="Card PIN" value={pin} onChange={(v) => setPin(v.replace(/\D/g, "").slice(0, 8))} placeholder="Enter card PIN" secure numeric />
      )}
      {step === "avs" && (
        <>
          <Text className="font-manrope text-xs text-gray-500">Your card issuer requires billing-address verification.</Text>
          <CardField label="Address" value={avs.address} onChange={(v) => setAvs((p) => ({ ...p, address: v }))} />
          <CardField label="City" value={avs.city} onChange={(v) => setAvs((p) => ({ ...p, city: v }))} />
          <CardField label="State" value={avs.state} onChange={(v) => setAvs((p) => ({ ...p, state: v }))} />
          <CardField label="Country" value={avs.country} onChange={(v) => setAvs((p) => ({ ...p, country: v }))} />
          <CardField label="ZIP / Postal code" value={avs.zipcode} onChange={(v) => setAvs((p) => ({ ...p, zipcode: v }))} />
        </>
      )}
      {step === "otp" && (
        <CardField label="One-time password (OTP)" value={otp} onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 8))} placeholder="Enter OTP" numeric />
      )}
      {step === "redirect" && (
        <Text className="font-manrope text-xs text-gray-500">
          Your bank requires extra authentication in your banking app or via SMS. Complete it, then tap below.
        </Text>
      )}
      <TouchableOpacity onPress={onSubmit} disabled={busy} className="bg-[#ff4b26] py-4 rounded-2xl items-center" style={shadow.btn}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-grotesk-bold">{submitLabel}</Text>}
      </TouchableOpacity>
      <Text className="font-manrope text-[11px] text-gray-400 text-center">Card details go straight to Flutterwave over TLS and are never stored.</Text>
    </View>
  );
}
