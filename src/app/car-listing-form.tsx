import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FormInput } from "@/components/FormInput";
import { FormSection } from "@/components/FormSection";
import { ChipSelector } from "@/components/ChipSelector";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ImageUploader } from "@/components/ImageUploader";
import { shadow } from "@/constants/shadows";
import { productsApi, sellerListingsApi, getApiError } from "@/api";
import type { CarUnitPayload } from "@/api";

const BLANK = { brand: "", model: "", year: "", price: "", min_deposit_percentage: "10", status: "available" };

export default function CarListingFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState(BLANK);
  const [units, setUnits] = useState<{ vin: string; mileage: string; color: string }[]>([{ vin: "", mileage: "", color: "" }]);
  const [existingUnitCount, setExistingUnitCount] = useState(0);

  useEffect(() => {
    if (!isEdit) return;
    productsApi.getCarById(id!)
      .then((c) => {
        setForm({ brand: c.brand, model: c.model, year: String(c.year), price: String(c.price), min_deposit_percentage: String(c.min_deposit_percentage ?? 10), status: c.status });
        setImages(c.images?.map((i) => i.image_url) ?? []);
        setExistingUnitCount(c.units?.length ?? 0);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: keyof typeof form) => (val: string) => setForm((p) => ({ ...p, [key]: val }));
  const setUnit = (i: number, key: "vin" | "mileage" | "color") => (val: string) =>
    setUnits((prev) => prev.map((u, idx) => (idx === i ? { ...u, [key]: val } : u)));
  const addUnit = () => setUnits((prev) => [...prev, { vin: "", mileage: "", color: "" }]);
  const removeUnit = (i: number) => setUnits((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.brand.trim() || !form.model.trim() || !form.year || !form.price) {
      Alert.alert("Missing Fields", "Please fill in brand, model, year, and price.");
      return;
    }
    const validUnits: CarUnitPayload[] = units
      .filter((u) => u.vin.trim())
      .map((u) => ({ vin: u.vin.trim(), mileage: Number(u.mileage) || 0, color: u.color.trim() || undefined }));

    if (!isEdit && validUnits.length === 0) {
      Alert.alert("Add a Unit", "Add at least one physical unit (VIN required).");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await sellerListingsApi.updateCar(id!, {
          brand: form.brand.trim(), model: form.model.trim(), year: Number(form.year), price: Number(form.price),
          min_deposit_percentage: Number(form.min_deposit_percentage) || undefined, status: form.status,
          images: images.map((image_url) => ({ image_url })),
        });
        if (validUnits.length > 0) await sellerListingsApi.addCarUnits(id!, validUnits);
      } else {
        await sellerListingsApi.createCar({
          brand: form.brand.trim(), model: form.model.trim(), year: Number(form.year), price: Number(form.price),
          min_deposit_percentage: Number(form.min_deposit_percentage) || undefined,
          units: validUnits, images: images.map((image_url) => ({ image_url })),
        });
      }
      router.back();
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title={isEdit ? "Edit Car Listing" : "New Car Listing"} />
      {loading ? (
        <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 60 }} />
      ) : (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="gap-5">
              <FormSection title="Vehicle Details">
                <FormInput label="Brand" required placeholder="e.g. Toyota" value={form.brand} onChangeText={set("brand")} />
                <FormInput label="Model" required placeholder="e.g. Camry" value={form.model} onChangeText={set("model")} />
                <View className="flex-row gap-3">
                  <View className="flex-1"><FormInput label="Year" required keyboardType="numeric" placeholder="2023" value={form.year} onChangeText={set("year")} /></View>
                  <View className="flex-1"><FormInput label="Min Deposit %" keyboardType="numeric" placeholder="10" value={form.min_deposit_percentage} onChangeText={set("min_deposit_percentage")} /></View>
                </View>
                <FormInput label="Price (NGN)" required keyboardType="numeric" placeholder="0.00" value={form.price} onChangeText={set("price")} />
                {isEdit && (
                  <ChipSelector
                    label="Status"
                    options={[{ value: "available", label: "Public" }, { value: "out_of_stock", label: "Hidden" }]}
                    value={form.status}
                    onChange={set("status")}
                  />
                )}
              </FormSection>

              <FormSection title="Photos">
                <ImageUploader images={images} onChange={setImages} max={10} />
              </FormSection>

              <View className="gap-3">
                <View className="flex-row items-center justify-between ml-1">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {isEdit ? `Add Units (${existingUnitCount} existing)` : "Physical Units"}
                  </Text>
                  <TouchableOpacity onPress={addUnit} className="flex-row items-center gap-1">
                    <Plus size={14} color="#f59e0b" />
                    <Text className="text-xs font-bold text-amber-500">Add Unit</Text>
                  </TouchableOpacity>
                </View>
                {units.map((u, i) => (
                  <View key={i} className="bg-white rounded-2xl p-4 gap-3" style={shadow.card}>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-gray-400">Unit {i + 1}</Text>
                      {units.length > 1 && (
                        <TouchableOpacity onPress={() => removeUnit(i)}>
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <FormInput label="VIN" placeholder="Vehicle ID number" value={u.vin} onChangeText={setUnit(i, "vin")} autoCapitalize="characters" />
                    <View className="flex-row gap-3">
                      <View className="flex-1"><FormInput label="Mileage" keyboardType="numeric" placeholder="0" value={u.mileage} onChangeText={setUnit(i, "mileage")} /></View>
                      <View className="flex-1"><FormInput label="Color" placeholder="e.g. Black" value={u.color} onChangeText={setUnit(i, "color")} /></View>
                    </View>
                  </View>
                ))}
              </View>

              <PrimaryButton label={isEdit ? "Save Changes" : "Create Listing"} loading={saving} onPress={handleSave} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
