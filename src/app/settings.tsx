import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Switch, StatusBar,
  Alert, Modal, TextInput, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { shadow } from "@/constants/shadows";
import { Bell, Lock, Globe, Trash2, ChevronRight, Shield, Eye, EyeOff, KeyRound, X } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { authApi, notificationsApi } from "@/api";
import type { NotificationPreferences } from "@/api";

type ToggleSetting = { id: string; label: string; subtitle: string; value: boolean };
type NotifDraft = {
  email_order: boolean;
  email_promo: boolean;
  push_order: boolean;
  push_promo: boolean;
  inapp_order: boolean;
  inapp_promo: boolean;
};

export default function SettingsScreen() {
  useRequireAuth();
  const router = useRouter();
  const { changePassword, logout } = useAuthStore();

  const [settings, setSettings] = useState<ToggleSetting[]>([
    { id: "dark_mode",    label: "Dark Mode",            subtitle: "Easier on the eyes at night", value: false },
    { id: "biometric",    label: "Biometric Login",      subtitle: "Use Face ID / fingerprint to sign in", value: false },
  ]);
  const [notifPreferences, setNotifPreferences] = useState<NotificationPreferences | null>(null);
  const [notifDraft, setNotifDraft] = useState<NotifDraft | null>(null);
  const [savingNotif, setSavingNotif] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Password change modal
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const resetPwForm = () => { setCurrentPw(""); setNewPw(""); setConfirmPw(""); };

  useEffect(() => {
    notificationsApi.getPreferences()
      .then((prefs) => {
        setNotifPreferences(prefs);
        setNotifDraft({
          email_order: prefs.email_notifications.order_updates,
          email_promo: prefs.email_notifications.promotional_offers,
          push_order: prefs.push_notifications.order_updates,
          push_promo: prefs.push_notifications.promotional_offers,
          inapp_order: prefs.in_app_notifications.order_updates,
          inapp_promo: prefs.in_app_notifications.promotional_offers,
        });
      })
      .catch(() => {});
  }, []);

  const handleChangePassword = async () => {
    if (!currentPw) { Alert.alert("Required", "Please enter your current password."); return; }
    if (newPw.length < 8) { Alert.alert("Too Short", "New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { Alert.alert("Mismatch", "New passwords do not match."); return; }
    setChangingPw(true);
    try {
      await changePassword(currentPw, newPw);
      setPwModalOpen(false);
      resetPwForm();
      Alert.alert("Password Changed", "Your password has been updated successfully.");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? e?.message ?? "Failed to change password.");
    } finally {
      setChangingPw(false);
    }
  };

  const toggle = (id: string) =>
    setSettings((prev) => prev.map((s) => s.id === id ? { ...s, value: !s.value } : s));

  const SECTIONS = [
    { title: "Appearance & Security",  items: settings },
  ];

  const saveNotificationPreferences = async () => {
    if (!notifDraft || !notifPreferences) return;
    setSavingNotif(true);
    try {
      const next = await notificationsApi.updatePreferences({
        email_notifications: {
          ...notifPreferences.email_notifications,
          order_updates: notifDraft.email_order,
          promotional_offers: notifDraft.email_promo,
        },
        push_notifications: {
          ...notifPreferences.push_notifications,
          order_updates: notifDraft.push_order,
          promotional_offers: notifDraft.push_promo,
        },
        in_app_notifications: {
          ...notifPreferences.in_app_notifications,
          order_updates: notifDraft.inapp_order,
          promotional_offers: notifDraft.inapp_promo,
        },
      });
      setNotifPreferences(next);
      Alert.alert("Preferences saved", "Your notification preferences have been updated.");
    } catch (e: any) {
      Alert.alert("Save failed", e?.response?.data?.detail ?? e?.message ?? "Could not update notification preferences.");
    } finally {
      setSavingNotif(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This permanently deletes your account and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await authApi.deleteAccount();
              await logout();
              router.replace("/(auth)/login");
            } catch (e: any) {
              Alert.alert("Delete failed", e?.response?.data?.detail ?? e?.message ?? "Could not delete your account.");
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  };

  const ACTIONS = [
    { icon: Globe,  label: "Language",       value: "English", onPress: () => {} },
    { icon: Shield, label: "Privacy Policy",  onPress: () => router.push("/privacy") },
    { icon: Lock,   label: "Terms of Service",onPress: () => router.push("/terms") },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Settings" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-5 gap-6">

          {/* Toggle sections */}
          {notifDraft && (
            <View>
              <Text className="text-xs font-grotesk-bold text-gray-400 uppercase tracking-wider mb-3">Notifications</Text>
              <View className="bg-white rounded-2xl overflow-hidden" style={shadow.md}>
                {[
                  { key: "email_order", label: "Email order updates", subtitle: "Order status and delivery updates" },
                  { key: "email_promo", label: "Email promotions", subtitle: "Sales and marketing emails" },
                  { key: "push_order", label: "Push order updates", subtitle: "Push notifications for orders" },
                  { key: "push_promo", label: "Push promotions", subtitle: "Push notifications for offers" },
                  { key: "inapp_order", label: "In-app order updates", subtitle: "Order notifications inside the app" },
                  { key: "inapp_promo", label: "In-app promotions", subtitle: "Offers and announcements inside the app" },
                ].map((item, i) => (
                  <View key={item.key} className={`flex-row items-center px-4 py-4 ${i < 5 ? "border-b border-gray-100" : ""}`}>
                    <View className="flex-1">
                      <Text className="text-sm font-grotesk-semibold text-gray-900">{item.label}</Text>
                      <Text className="font-manrope text-xs text-gray-400 mt-0.5">{item.subtitle}</Text>
                    </View>
                    <Switch
                      value={notifDraft[item.key as keyof NotifDraft]}
                      onValueChange={(value) => setNotifDraft((prev) => prev ? { ...prev, [item.key]: value } : prev)}
                      trackColor={{ false: "#e5e7eb", true: "#fbbf24" }}
                      thumbColor="#fff"
                    />
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={saveNotificationPreferences}
                disabled={savingNotif}
                className="bg-[#ff4b26] py-3.5 rounded-2xl items-center mt-3"
                style={shadow.btn}
              >
                {savingNotif ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-grotesk-bold">Save preferences</Text>}
              </TouchableOpacity>
            </View>
          )}

          {SECTIONS.map((section) => (
            <View key={section.title}>
              <Text className="text-xs font-grotesk-bold text-gray-400 uppercase tracking-wider mb-3">{section.title}</Text>
              <View className="bg-white rounded-2xl overflow-hidden" style={shadow.md}>
                {section.items.map((item, i) => (
                  <View key={item.id} className={`flex-row items-center px-4 py-4 ${i < section.items.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <View className="flex-1">
                      <Text className="text-sm font-grotesk-semibold text-gray-900">{item.label}</Text>
                      <Text className="font-manrope text-xs text-gray-400 mt-0.5">{item.subtitle}</Text>
                    </View>
                    <Switch
                      value={item.value}
                      onValueChange={() => toggle(item.id)}
                      trackColor={{ false: "#e5e7eb", true: "#fbbf24" }}
                      thumbColor="#fff"
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Account Security */}
          <View>
            <Text className="text-xs font-grotesk-bold text-gray-400 uppercase tracking-wider mb-3">Account Security</Text>
            <View className="bg-white rounded-2xl overflow-hidden" style={shadow.md}>
              <TouchableOpacity
                onPress={() => setPwModalOpen(true)}
                className="flex-row items-center px-4 py-4"
              >
                <KeyRound size={18} color="#6b7280" style={{ marginRight: 12 }} />
                <View className="flex-1">
                  <Text className="text-sm font-grotesk-semibold text-gray-900">Change Password</Text>
                  <Text className="font-manrope text-xs text-gray-400 mt-0.5">Update your account password</Text>
                </View>
                <ChevronRight size={16} color="#d1d5db" />
              </TouchableOpacity>
            </View>
          </View>

          {/* General */}
          <View>
            <Text className="text-xs font-grotesk-bold text-gray-400 uppercase tracking-wider mb-3">General</Text>
            <View className="bg-white rounded-2xl overflow-hidden" style={shadow.md}>
              {ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={action.label}
                    onPress={action.onPress}
                    className={`flex-row items-center px-4 py-4 ${i < ACTIONS.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <Icon size={18} color="#6b7280" style={{ marginRight: 12 }} />
                    <Text className="text-sm font-grotesk-semibold text-gray-900 flex-1">{action.label}</Text>
                    {action.value && <Text className="font-manrope text-sm text-gray-400 mr-2">{action.value}</Text>}
                    <ChevronRight size={16} color="#d1d5db" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Danger zone */}
          <View>
            <Text className="text-xs font-grotesk-bold text-red-400 uppercase tracking-wider mb-3">Danger Zone</Text>
            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
              className="bg-white border border-red-100 rounded-2xl px-4 py-4 flex-row items-center gap-3"
              style={shadow.md}
            >
              <Trash2 size={18} color="#ef4444" />
              <View className="flex-1">
                <Text className="text-sm font-grotesk-semibold text-red-600">Delete Account</Text>
                <Text className="font-manrope text-xs text-gray-400">This action is permanent and cannot be undone.</Text>
              </View>
              {deletingAccount && <ActivityIndicator color="#ef4444" />}
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <Text className="font-manrope text-xs text-gray-300">LEL Marketplace · v1.0.0</Text>
          </View>

        </View>
      </ScrollView>

      {/* ── Change Password Modal ── */}
      <Modal visible={pwModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPwModalOpen(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
            <Text className="text-lg font-grotesk-extrabold text-gray-900">Change Password</Text>
            <TouchableOpacity onPress={() => { setPwModalOpen(false); resetPwForm(); }} className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
              <X size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
            <View className="gap-5 pb-10">

              {[
                { label: "Current Password", value: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                { label: "New Password",     value: newPw,     set: setNewPw,     show: showNew,     toggle: () => setShowNew(!showNew) },
                { label: "Confirm New Password", value: confirmPw, set: setConfirmPw, show: showNew, toggle: () => setShowNew(!showNew) },
              ].map(({ label, value, set, show, toggle }) => (
                <View key={label} className="gap-2">
                  <Text className="text-sm font-grotesk-bold text-gray-700">{label}</Text>
                  <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 px-4">
                    <TextInput
                      className="flex-1 py-3.5 text-sm text-gray-900"
                      placeholder={`Enter ${label.toLowerCase()}`}
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={set}
                      secureTextEntry={!show}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={toggle} className="p-1">
                      {show ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {newPw.length > 0 && newPw.length < 8 && (
                <Text className="font-grotesk text-xs text-red-500">Password must be at least 8 characters.</Text>
              )}

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={changingPw}
                className="bg-[#ff4b26] py-4 rounded-2xl items-center"
                style={shadow.btn}
              >
                {changingPw ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-grotesk-bold">Update Password</Text>}
              </TouchableOpacity>

            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
