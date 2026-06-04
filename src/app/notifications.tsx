import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { TabSelector } from "@/components/TabSelector";
import { Bell, Package, CreditCard, Calendar, ShieldCheck, MessageCircle } from "lucide-react-native";
import { shadow } from "@/constants/shadows";
import { formatDate } from "@/utils/format";

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "order", title: "Order Shipped", message: "Your order #ORD-2023-8942 has been shipped.", time: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: "2", type: "payment", title: "Payment Successful", message: "Payment of ₦1,200,000 for your order was confirmed.", time: new Date(Date.now() - 86400000).toISOString(), read: false },
  { id: "3", type: "inspection", title: "Inspection Confirmed", message: "Your inspection for Toyota Camry 2022 is confirmed for June 10.", time: new Date(Date.now() - 2 * 86400000).toISOString(), read: true },
  { id: "4", type: "agreement", title: "Agreement Approved", message: "Your installment plan for 3-Bed Apartment Lekki is now active.", time: new Date(Date.now() - 3 * 86400000).toISOString(), read: true },
  { id: "5", type: "system", title: "Welcome to LEL Marketplace", message: "Your account is verified. Start exploring verified listings!", time: new Date(Date.now() - 7 * 86400000).toISOString(), read: true },
];

type NotifType = { id: string; type: string; title: string; message: string; time: string; read: boolean };

const TABS = ["All", "Unread"] as const;

function getIcon(type: string) {
  switch (type) {
    case "order": return { Icon: Package, bg: "#eff6ff", color: "#3b82f6" };
    case "payment": return { Icon: CreditCard, bg: "#f0fdf4", color: "#22c55e" };
    case "inspection": return { Icon: Calendar, bg: "#fffbeb", color: "#f59e0b" };
    case "agreement": return { Icon: ShieldCheck, bg: "#faf5ff", color: "#a855f7" };
    default: return { Icon: Bell, bg: "#f3f4f6", color: "#6b7280" };
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  return formatDate(iso);
}

function NotifCard({ notif, onPress }: { notif: NotifType; onPress: () => void }) {
  const { Icon, bg, color } = getIcon(notif.type);
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row gap-3 p-4 rounded-2xl mb-3 ${notif.read ? "bg-white" : "bg-amber-50"}`}
      style={shadow.card}
    >
      <View className="w-10 h-10 rounded-full items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
        <Icon size={18} color={color} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="text-sm font-bold text-gray-900 flex-1">{notif.title}</Text>
          {!notif.read && <View className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" />}
        </View>
        <Text className="text-xs text-gray-500 mt-0.5 leading-relaxed" numberOfLines={2}>{notif.message}</Text>
        <Text className="text-[10px] text-gray-400 mt-1.5 font-medium">{timeAgo(notif.time)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("All");
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const filtered = activeTab === "Unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        rightSlot={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} className="px-3 py-1 bg-amber-50 rounded-full">
              <Text className="text-xs font-semibold text-amber-600">Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View className="px-5 pt-4 pb-2">
        <TabSelector tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState Icon={Bell} title="No notifications" subtitle={activeTab === "Unread" ? "You're all caught up!" : "Nothing here yet."} />
        ) : (
          <View className="pb-10">
            {filtered.map((n) => (
              <NotifCard key={n.id} notif={n} onPress={() => markRead(n.id)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
