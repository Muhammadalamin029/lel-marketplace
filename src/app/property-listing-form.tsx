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
import type { PropertyUnitPayload } from "@/api";

const LISTING_TYPES = ["sale", "rental", "professional"] as const;
const STATUSES = ["available", "reserved", "sold", "rented"] as const;
const BLANK = { title: "", description: "", location: "", price: "", listing_type: "sale" as (typeof LISTING_TYPES)[number], status: "available" as (typeof STATUSES)[number] };

export default function PropertyListingFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState(BLANK);
  const [units, setUnits] = useState<PropertyUnitPayload[]>([{ unit_name: "", unit_number: "" }]);

  useEffect(() => {
    if (!isEdit) return;
    productsApi.getPropertyById(id!)
      .then((p) => {
        setForm({
          title: p.title, description: p.description ?? "", location: p.location, price: String(p.price),
          listing_type: (p.listing_type as any) ?? "sale", status: (p.status as any) ?? "available",
        });
        setImages(p.images?.map((i) => i.image_url) ?? []);
        if (p.units?.length) setUnits(p.units.map((u) => ({ unit_name: (u as any).unit_name ?? "", unit_number: u.unit_number ?? "" })));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: keyof typeof form) => (val: string) => setForm((p) => ({ ...p, [key]: val }));
  const setUnit = (i: number, key: keyof PropertyUnitPayload) => (val: string) =>
    setUnits((prev) => prev.map((u, idx) => (idx === i ? { ...u, [key]: val } : u)));
  const addUnit = () => setUnits((prev) => [...prev, { unit_name: "", unit_number: "" }]);
  const removeUnit = (i: number) => setUnits((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.title.trim() || !form.location.trim() || !form.price) {
      Alert.alert("Missing Fields", "Please fill in title, location, and price.");
      return;
    }
    if (!isEdit && images.length === 0) {
      Alert.alert("Add an Image", "At least one image is required.");
      return;
    }
    const validUnits = units.filter((u) => u.unit_name?.trim() || u.unit_number?.trim());

    setSaving(true);
    try {
      if (isEdit) {
        await sellerListingsApi.updateProperty(id!, {
          title: form.title.trim(), description: form.description.trim() || undefined, location: form.location.trim(),
          price: Number(form.price), listing_type: form.listing_type, status: form.status,
          images: images.map((image_url) => ({ image_url })),
        });
      } else {
        await sellerListingsApi.createProperty({
          title: form.title.trim(), description: form.description.trim() || undefined, location: form.location.trim(),
          price: Number(form.price), listing_type: form.listing_type, buildings_count: validUnits.length || 1,
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
      <ScreenHeader title={isEdit ? "Edit Property" : "New Property"} />
      {loading ? (
        <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 60 }} />
      ) : (
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="gap-5">
              <FormSection title="Property Details">
                <FormInput label="Title" required placeholder="e.g. 3-Bedroom Duplex, Lekki" value={form.title} onChangeText={set("title")} />
                <FormInput label="Description" placeholder="Describe the property" multiline numberOfLines={4} textAlignVertical="top" style={{ minHeight: 90 }} value={form.description} onChangeText={set("description")} />
                <FormInput label="Location" required placeholder="e.g. Lekki Phase 1, Lagos" value={form.location} onChangeText={set("location")} />
                <FormInput label="Price (NGN)" required keyboardType="numeric" placeholder="0.00" value={form.price} onChangeText={set("price")} />
                <ChipSelector
                  label="Listing Type"
                  options={LISTING_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                  value={form.listing_type}
                  onChange={set("listing_type")}
                />
                {isEdit && (
                  <ChipSelector
                    label="Status"
                    options={STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
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
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">Buildings / Units</Text>
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
                    <View className="flex-row gap-3">
                      <View className="flex-1"><FormInput label="Block / Name" placeholder="e.g. Block A" value={u.unit_name} onChangeText={setUnit(i, "unit_name")} /></View>
                      <View className="flex-1"><FormInput label="Unit Number" placeholder="e.g. Flat 101" value={u.unit_number} onChangeText={setUnit(i, "unit_number")} /></View>
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
