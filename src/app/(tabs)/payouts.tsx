import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Wallet, TrendingUp, CheckCircle, X, CreditCard } from "lucide-react-native";
import { SellerGate } from "@/components/SellerGate";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { FormInput } from "@/components/FormInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BankPicker } from "@/components/BankPicker";
import { shadow } from "@/constants/shadows";
import { sellerApi, getApiError } from "@/api";
import type { SellerBalance, PayoutAccount, Payout, Bank } from "@/api";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { fmt, formatDate } from "@/utils/format";

function StatTile({ label, value, Icon, color, bg }: { label: string; value: string; Icon: any; color: string; bg: string }) {
  return (
    <View className="bg-white p-4 rounded-2xl flex-1 min-w-[45%]" style={shadow.sm}>
      <View className="w-10 h-10 rounded-full items-center justify-center mb-2" style={{ backgroundColor: bg }}>
        <Icon size={20} color={color} />
      </View>
      <Text className="text-xs font-bold text-gray-400 uppercase">{label}</Text>
      <Text className="text-lg font-extrabold text-gray-900 mt-1">{value}</Text>
    </View>
  );
}

function PayoutsScreenInner() {
  const [balance, setBalance] = useState<SellerBalance | null>(null);
  const [account, setAccount] = useState<PayoutAccount | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [bank, setBank] = useState<{ bank_code: string; bank_name: string } | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [requesting, setRequesting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [b, a, p] = await Promise.all([sellerApi.getBalance(), sellerApi.getPayoutAccount(), sellerApi.listPayouts()]);
      setBalance(b); setAccount(a); setPayouts(p.items);
    } catch {
      // keep last-known state on failure
    }
  }, []);

  const { loading, refreshing, load, onRefresh } = usePullToRefresh(fetchData);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAccountModal = () => {
    setBank(account?.bank_code ? { bank_code: account.bank_code, bank_name: account.bank_name ?? "" } : null);
    setAccountNumber(account?.account_number ?? "");
    setVerifiedName(null);
    setAccountModalOpen(true);
  };

  const handleVerify = async () => {
    if (!bank || accountNumber.trim().length < 10) {
      Alert.alert("Missing Info", "Select a bank and enter a valid account number.");
      return;
    }
    setVerifying(true);
    try {
      const res = await sellerApi.verifyPayoutAccount(accountNumber.trim(), bank.bank_code);
      if (res.verified) setVerifiedName(res.account_name ?? null);
      else Alert.alert("Verification Failed", res.error ?? "Could not verify this account.");
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!bank || accountNumber.trim().length < 10) {
      Alert.alert("Missing Info", "Select a bank and enter a valid account number.");
      return;
    }
    setSavingAccount(true);
    try {
      const saved = await sellerApi.savePayoutAccount({ account_number: accountNumber.trim(), bank_code: bank.bank_code, bank_name: bank.bank_name });
      setAccount(saved);
      setAccountModalOpen(false);
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setSavingAccount(false);
    }
  };

  const handleRequestPayout = async () => {
    const amt = Number(amount);
    if (!account) {
      Alert.alert("No Payout Account", "Configure a payout account first.");
      return;
    }
    if (!amt || amt <= 0 || amt > (balance?.available_balance ?? 0)) {
      Alert.alert("Invalid Amount", "Enter an amount within your available balance.");
      return;
    }
    setRequesting(true);
    try {
      await sellerApi.requestPayout({ amount: amt, account_number: account.account_number!, bank_code: account.bank_code!, bank_name: account.bank_name ?? "" });
      setPayoutModalOpen(false);
      setAmount("");
      load();
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setRequesting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-3 bg-white border-b border-gray-100">
        <View className="w-10 h-10 rounded-2xl bg-green-50 items-center justify-center">
          <Wallet size={18} color="#16a34a" />
        </View>
        <View>
          <Text className="text-lg font-extrabold text-gray-900">Payouts</Text>
          <Text className="text-xs text-gray-400">Balance, bank account & history</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" colors={["#f59e0b"]} />}
        >
          <View className="gap-5">
            <View className="flex-row flex-wrap gap-4">
              <StatTile label="Available" value={fmt(balance?.available_balance ?? 0)} Icon={Wallet} color="#16a34a" bg="#f0fdf4" />
              <StatTile label="Pending" value={fmt(balance?.pending_balance ?? 0)} Icon={TrendingUp} color="#d97706" bg="#fffbeb" />
              <StatTile label="Total Paid" value={fmt(balance?.total_paid ?? 0)} Icon={CheckCircle} color="#2563eb" bg="#eff6ff" />
              <StatTile label="Total Revenue" value={fmt(balance?.total_revenue ?? 0)} Icon={Wallet} color="#7e22ce" bg="#f5f3ff" />
            </View>

            <View className="bg-white rounded-2xl p-4" style={shadow.card}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-gray-400 uppercase">Payout Account</Text>
                <TouchableOpacity onPress={openAccountModal}>
                  <Text className="text-xs font-bold text-amber-500">{account ? "Edit" : "Configure"}</Text>
                </TouchableOpacity>
              </View>
              {account ? (
                <>
                  <Text className="text-sm font-bold text-gray-900">{account.bank_name}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{account.account_number}</Text>
                </>
              ) : (
                <Text className="text-sm text-gray-400">No payout account configured yet.</Text>
              )}
            </View>

            <PrimaryButton label="Request Payout" onPress={() => setPayoutModalOpen(true)} disabled={!account} />

            <View>
              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 ml-1">Payout History</Text>
              {payouts.length === 0 ? (
                <EmptyState Icon={CreditCard} title="No payouts yet" subtitle="Your payout requests will show up here." />
              ) : (
                <View className="gap-3">
                  {payouts.map((p) => (
                    <View key={p.id} className="bg-white rounded-2xl p-4" style={shadow.card}>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-extrabold text-gray-900">{fmt(p.net_amount)}</Text>
                        <StatusBadge status={p.status} />
                      </View>
                      <Text className="text-xs text-gray-400 mt-1">{p.bank_name} · {p.account_number}</Text>
                      <Text className="text-xs text-gray-400">{formatDate(p.created_at)}</Text>
                      {p.failure_reason && <Text className="text-xs text-red-500 mt-1">{p.failure_reason}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Payout account modal */}
      <Modal visible={accountModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAccountModalOpen(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
              <Text className="text-lg font-extrabold text-gray-900">Payout Account</Text>
              <TouchableOpacity onPress={() => setAccountModalOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
                <X size={18} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
              <View className="gap-4">
                <BankPicker value={bank} onSelect={(b: Bank) => { setBank({ bank_code: b.code, bank_name: b.name }); setVerifiedName(null); }} />
                <FormInput label="Account Number" keyboardType="number-pad" placeholder="0123456789" value={accountNumber} onChangeText={(v) => { setAccountNumber(v); setVerifiedName(null); }} />
                {verifiedName && (
                  <View className="flex-row items-center gap-2 bg-green-50 rounded-xl p-3">
                    <CheckCircle size={16} color="#16a34a" />
                    <Text className="text-sm font-semibold text-green-800">{verifiedName}</Text>
                  </View>
                )}
                <PrimaryButton label="Verify Account" variant="dark" loading={verifying} onPress={handleVerify} />
                <PrimaryButton label="Save Account" loading={savingAccount} onPress={handleSaveAccount} disabled={!verifiedName} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Request payout modal */}
      <Modal visible={payoutModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPayoutModalOpen(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
              <Text className="text-lg font-extrabold text-gray-900">Request Payout</Text>
              <TouchableOpacity onPress={() => setPayoutModalOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
                <X size={18} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
              <View className="gap-4">
                <Text className="text-xs text-gray-500">Available balance: {fmt(balance?.available_balance ?? 0)}</Text>
                <FormInput label="Amount (NGN)" keyboardType="numeric" placeholder="0.00" value={amount} onChangeText={setAmount} />
                <PrimaryButton label="Request Payout" loading={requesting} onPress={handleRequestPayout} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

export default function PayoutsScreen() {
  return (
    <SellerGate>
      <PayoutsScreenInner />
    </SellerGate>
  );
}
