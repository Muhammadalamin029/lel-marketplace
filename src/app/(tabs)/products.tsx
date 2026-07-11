import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, TextInput, ActivityIndicator, Alert, Image, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, Search, Minus, Edit2, Trash2 } from "lucide-react-native";
import { SellerGate } from "@/components/SellerGate";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { sellerListingsApi, getApiError } from "@/api";
import type { Product, Car, Property, SellerProfileData } from "@/api";
import { useAuthStore } from "@/store/authStore";
import { listingMeta } from "@/utils/sellerType";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { fmt } from "@/utils/format";

function ListingRow({
  title, subtitle, price, status, imageUrl, Icon, onPress, onEdit, onDelete,
}: {
  title: string; subtitle: string; price: number; status: string; imageUrl?: string; Icon: any;
  onPress: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} className="bg-white rounded-2xl p-3 flex-row items-center gap-3" style={shadow.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="w-14 h-14 rounded-xl" resizeMode="cover" />
      ) : (
        <View className="w-14 h-14 rounded-xl bg-amber-50 items-center justify-center">
          <Icon size={22} color="#f59e0b" />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>{title}</Text>
        <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>{subtitle}</Text>
        <View className="flex-row items-center gap-2 mt-1.5">
          <Text className="text-sm font-extrabold text-gray-900">{fmt(price)}</Text>
          <StatusBadge status={status} />
        </View>
      </View>
      <View className="gap-2">
        <TouchableOpacity onPress={onEdit} className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
          <Edit2 size={14} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
          <Trash2 size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ProductsScreenInner() {
  const router = useRouter();
  const sellerType = ((useAuthStore((s) => s.profile) as SellerProfileData)?.seller_type) ?? "retailer";
  const meta = listingMeta(sellerType);

  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const listingCount = sellerType === "retailer" ? products.length : sellerType === "car_dealer" ? cars.length : properties.length;

  const fetchData = useCallback(async () => {
    try {
      if (sellerType === "retailer") {
        const { items } = await sellerListingsApi.listProducts({ search: search || undefined });
        setProducts(items);
      } else if (sellerType === "car_dealer") {
        setCars(await sellerListingsApi.listCars());
      } else {
        setProperties(await sellerListingsApi.listProperties());
      }
    } catch {
      // leave list empty on failure
    }
  }, [sellerType, search]);

  const { loading, refreshing, load, onRefresh } = usePullToRefresh(fetchData);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const adjustStock = async (product: Product, delta: number) => {
    const next = Math.max(0, product.stock_quantity + delta);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock_quantity: next } : p)));
    try {
      await sellerListingsApi.updateStock(product.id, next);
    } catch (e) {
      Alert.alert("Error", getApiError(e));
      load();
    }
  };

  const confirmDelete = (title: string, onConfirm: () => void) => {
    Alert.alert("Delete Listing", `Remove "${title}"? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onConfirm },
    ]);
  };

  const deleteProduct = (p: Product) => confirmDelete(p.name, async () => {
    try { await sellerListingsApi.deleteProduct(p.id); setProducts((prev) => prev.filter((x) => x.id !== p.id)); }
    catch (e) { Alert.alert("Error", getApiError(e)); }
  });
  const deleteCar = (c: Car) => confirmDelete(`${c.brand} ${c.model}`, async () => {
    try { await sellerListingsApi.deleteCar(c.id); setCars((prev) => prev.filter((x) => x.id !== c.id)); }
    catch (e) { Alert.alert("Error", getApiError(e)); }
  });
  const deleteProperty = (p: Property) => confirmDelete(p.title, async () => {
    try { await sellerListingsApi.deleteProperty(p.id); setProperties((prev) => prev.filter((x) => x.id !== p.id)); }
    catch (e) { Alert.alert("Error", getApiError(e)); }
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-2xl bg-amber-50 items-center justify-center">
            <meta.icon size={18} color="#d97706" />
          </View>
          <View>
            <Text className="text-lg font-extrabold text-gray-900">My {meta.label}</Text>
            <Text className="text-xs text-gray-400">{listingCount} listing{listingCount === 1 ? "" : "s"}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push(meta.addRoute as any)} className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center" style={shadow.sm}>
          <Plus size={20} color="#f59e0b" />
        </TouchableOpacity>
      </View>

      <View className="px-5 pt-4">
        <View className="flex-row items-center border border-gray-200 rounded-xl bg-white px-3">
          <Search size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 p-3 text-sm text-gray-900"
            placeholder={`Search ${meta.label.toLowerCase()}`}
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={load}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" colors={["#f59e0b"]} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 60 }} />
        ) : sellerType === "retailer" ? (
          products.length === 0 ? (
            <EmptyState Icon={meta.icon} title="No products yet" subtitle="Tap + to list your first product." />
          ) : (
            <View className="gap-3">
              {products.map((p) => (
                <View key={p.id} className="bg-white rounded-2xl p-3" style={shadow.card}>
                  <TouchableOpacity onPress={() => router.push(`/product-form?id=${p.id}` as any)} className="flex-row items-center gap-3">
                    {p.images?.[0] ? (
                      <Image source={{ uri: p.images[0].image_url }} className="w-14 h-14 rounded-xl" resizeMode="cover" />
                    ) : (
                      <View className="w-14 h-14 rounded-xl bg-amber-50 items-center justify-center">
                        <meta.icon size={22} color="#f59e0b" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>{p.name}</Text>
                      <Text className="text-xs text-gray-400 mt-0.5">{p.category?.name}</Text>
                      <View className="flex-row items-center gap-2 mt-1.5">
                        <Text className="text-sm font-extrabold text-gray-900">{fmt(p.price)}</Text>
                        <StatusBadge status={p.stock_quantity === 0 ? "out_of_stock" : p.status} label={p.stock_quantity === 0 ? "Out of stock" : p.status} />
                      </View>
                    </View>
                    <View className="gap-2">
                      <TouchableOpacity onPress={() => router.push(`/product-form?id=${p.id}` as any)} className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                        <Edit2 size={14} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteProduct(p)} className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                  <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <Text className="text-xs font-bold text-gray-400 uppercase">Stock</Text>
                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity onPress={() => adjustStock(p, -1)} className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center">
                        <Minus size={14} color="#374151" />
                      </TouchableOpacity>
                      <Text className="text-sm font-bold text-gray-900 w-8 text-center">{p.stock_quantity}</Text>
                      <TouchableOpacity onPress={() => adjustStock(p, 1)} className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center">
                        <Plus size={14} color="#374151" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : sellerType === "car_dealer" ? (
          cars.length === 0 ? (
            <EmptyState Icon={meta.icon} title="No car listings yet" subtitle="Tap + to add a listing." />
          ) : (
            <View className="gap-3">
              {cars.map((c) => (
                <ListingRow
                  key={c.id}
                  Icon={meta.icon}
                  title={`${c.brand} ${c.model} (${c.year})`}
                  subtitle={`${c.units?.length ?? 0} unit${c.units?.length === 1 ? "" : "s"}`}
                  price={c.price}
                  status={c.status}
                  imageUrl={c.images?.[0]?.image_url}
                  onPress={() => router.push(`/car-listing-form?id=${c.id}` as any)}
                  onEdit={() => router.push(`/car-listing-form?id=${c.id}` as any)}
                  onDelete={() => deleteCar(c)}
                />
              ))}
            </View>
          )
        ) : (
          properties.length === 0 ? (
            <EmptyState Icon={meta.icon} title="No property listings yet" subtitle="Tap + to add a listing." />
          ) : (
            <View className="gap-3">
              {properties.map((p) => (
                <ListingRow
                  key={p.id}
                  Icon={meta.icon}
                  title={p.title}
                  subtitle={p.location}
                  price={p.price}
                  status={p.status}
                  imageUrl={p.images?.[0]?.image_url}
                  onPress={() => router.push(`/property-listing-form?id=${p.id}` as any)}
                  onEdit={() => router.push(`/property-listing-form?id=${p.id}` as any)}
                  onDelete={() => deleteProperty(p)}
                />
              ))}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ProductsScreen() {
  return (
    <SellerGate>
      <ProductsScreenInner />
    </SellerGate>
  );
}
