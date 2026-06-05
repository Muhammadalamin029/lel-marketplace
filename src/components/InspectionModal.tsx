import { useState } from "react";
import {
  View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert,
  Platform, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { X, Calendar, Clock, Shield, Info } from "lucide-react-native";
import { shadow } from "@/constants/shadows";
import { inspectionsApi } from "@/api";

type AssetType = "vehicle" | "real_estate";

interface Props {
  visible: boolean;
  onClose: () => void;
  assetId: string;
  assetType: AssetType;
  assetTitle: string;
  /** vehicles pass the first unit id */
  unitId?: string;
}

export function InspectionModal({ visible, onClose, assetId, assetType, assetTitle, unitId }: Props) {
  const router = useRouter();
  const isVehicle = assetType === "vehicle";

  const [date, setDate] = useState<Date>(() => {
    // Default to tomorrow at 10:00
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      const merged = new Date(selected);
      merged.setHours(date.getHours(), date.getMinutes());
      setDate(merged);
    }
  };

  const onTimeChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) {
      const merged = new Date(date);
      merged.setHours(selected.getHours(), selected.getMinutes());
      setDate(merged);
    }
  };

  const formattedDate = date.toLocaleDateString("en-NG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-NG", {
    hour: "2-digit", minute: "2-digit",
  });

  // minimum date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  const handleConfirm = async () => {
    const now = new Date();
    if (date <= now) {
      Alert.alert("Invalid Date", "Please select a future date and time for the inspection.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isoDate = date.toISOString().replace("Z", "").split(".")[0]; // yyyy-MM-dd'T'HH:mm:ss
      await inspectionsApi.schedule({
        asset_type: isVehicle ? "automotive" : "property",
        asset_id: assetId,
        unit_id: unitId,
        inspection_date: isoDate,
      });

      onClose();
      Alert.alert(
        isVehicle ? "Inspection Requested!" : "Viewing Requested!",
        `The ${isVehicle ? "seller" : "agent"} has been notified and will confirm a suitable time.`,
        [
          { text: "View My Inspections", onPress: () => router.push("/inspections") },
          { text: "OK", style: "cancel" },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        "Booking Failed",
        e?.response?.data?.detail ?? e?.message ?? "Could not schedule at this time. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-gray-900">
              {isVehicle ? "Request Inspection" : "Book a Viewing"}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>{assetTitle}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center ml-3"
          >
            <X size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
          <View className="gap-5 pb-10">

            {/* Description */}
            <Text className="text-sm text-gray-600 leading-relaxed">
              {isVehicle
                ? "Propose a preferred date and time for your visit. The seller will review and confirm or set a fixed time."
                : "The agent will receive your request and confirm a convenient viewing time for the property."}
            </Text>

            {/* Date picker */}
            <View className="gap-2">
              <Text className="text-sm font-bold text-gray-700">
                {isVehicle ? "Proposed Date & Time" : "Preferred Viewing Date & Time"}
              </Text>

              <View className="flex-row gap-3">
                {/* Date */}
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center gap-2"
                  style={shadow.sm}
                >
                  <Calendar size={18} color="#f59e0b" />
                  <View className="flex-1">
                    <Text className="text-[10px] text-gray-400 font-semibold uppercase">Date</Text>
                    <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>{formattedDate}</Text>
                  </View>
                </TouchableOpacity>

                {/* Time */}
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center gap-2"
                  style={shadow.sm}
                >
                  <Clock size={18} color="#f59e0b" />
                  <View>
                    <Text className="text-[10px] text-gray-400 font-semibold uppercase">Time</Text>
                    <Text className="text-sm font-bold text-gray-900">{formattedTime}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* iOS inline pickers */}
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  minimumDate={minDate}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={date}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onTimeChange}
                />
              )}
            </View>

            {/* Selected summary */}
            <View className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <Text className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Selected</Text>
              <Text className="text-sm font-bold text-amber-900">{formattedDate}</Text>
              <Text className="text-sm text-amber-700">{formattedTime}</Text>
            </View>

            {/* Info note */}
            <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex-row gap-3">
              <Info size={16} color="#3b82f6" style={{ marginTop: 1 }} />
              <View className="flex-1">
                <Text className="text-sm text-blue-800 leading-relaxed">
                  {isVehicle
                    ? "Location details will be shared once the seller confirms your inspection."
                    : "The exact location and agent contact will be revealed once the viewing is confirmed."}
                </Text>
              </View>
            </View>

            {/* Free inspection badge */}
            <View className="bg-green-50 rounded-2xl p-4 border border-green-100 flex-row items-center gap-3">
              <Shield size={20} color="#22c55e" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-green-800">Free Physical Inspection</Text>
                <Text className="text-xs text-green-600 mt-0.5">
                  There is no charge for scheduling an inspection on LEL Marketplace.
                </Text>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isSubmitting}
              className="bg-amber-400 py-4 rounded-2xl items-center"
              style={shadow.btn}
            >
              {isSubmitting
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">
                    {isVehicle ? "Confirm Booking" : "Confirm Request"}
                  </Text>}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
