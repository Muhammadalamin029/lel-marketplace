import { useEffect, useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FormInput } from "@/components/FormInput";
import { FormSection } from "@/components/FormSection";
import { ChipSelector } from "@/components/ChipSelector";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ImageUploader } from "@/components/ImageUploader";
import { categoriesApi, productsApi, sellerListingsApi, getApiError } from "@/api";
import type { Category, ProductPayload } from "@/api";

const BLANK = { name: "", description: "", price: "", stock_quantity: "", category_id: "", status: "active" as "active" | "inactive" };

export default function ProductFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    productsApi.getById(id!)
      .then((p) => {
        setForm({
          name: p.name, description: p.description ?? "", price: String(p.price),
          stock_quantity: String(p.stock_quantity), category_id: p.category?.id ?? "",
          status: (p.status as "active" | "inactive") ?? "active",
        });
        setImages(p.images?.map((i) => i.image_url) ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: keyof typeof form) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.category_id) {
      Alert.alert("Missing Fields", "Please fill in name, price, and category.");
      return;
    }
    const payload: ProductPayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity) || 0,
      category_id: form.category_id,
      images: images.map((image_url) => ({ image_url })),
      ...(isEdit ? { status: form.status } : {}),
    };
    setSaving(true);
    try {
      if (isEdit) await sellerListingsApi.updateProduct(id!, payload);
      else await sellerListingsApi.createProduct(payload);
      router.back();
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title={isEdit ? "Edit Product" : "New Product"} />
      {loading ? (
        <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 60 }} />
      ) : (
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="gap-5">
              <FormSection title="Basic Info">
                <FormInput label="Name" required placeholder="e.g. Wireless Headphones" value={form.name} onChangeText={set("name")} />
                <FormInput label="Description" placeholder="Describe the product" multiline numberOfLines={4} textAlignVertical="top" style={{ minHeight: 90 }} value={form.description} onChangeText={set("description")} />
                <ChipSelector
                  label="Category" required scroll
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  value={form.category_id}
                  onChange={set("category_id")}
                />
              </FormSection>

              <FormSection title="Pricing & Stock">
                <FormInput label="Price (NGN)" required keyboardType="numeric" placeholder="0.00" value={form.price} onChangeText={set("price")} />
                <FormInput label="Stock Quantity" keyboardType="numeric" placeholder="0" value={form.stock_quantity} onChangeText={set("stock_quantity")} />
                {isEdit && (
                  <ChipSelector
                    label="Status"
                    options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
                    value={form.status}
                    onChange={set("status")}
                  />
                )}
              </FormSection>

              <FormSection title="Photos">
                <ImageUploader images={images} onChange={setImages} max={6} />
              </FormSection>

              <PrimaryButton label={isEdit ? "Save Changes" : "Create Product"} loading={saving} onPress={handleSave} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
