import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  addMarketProduct,
  deleteMarketProduct,
  nextMarketProductId,
  updateMarketProduct,
  fetchSellerProducts,
} from "../../lib/market-store";
import { useUser, logout, supabase } from "../../lib/auth-store";
import BottomNav from "../../components/BottomNav";
import { useCategories, fetchCategories } from "../../lib/market-store";

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Organic Tomatoes",
    price: "4.99",
    unit: "lb",
    stock: 150,
    sold: 450,
    category: "Vegetables",
    description: "Fresh, organic tomatoes picked daily",
    image:
      "https://images.unsplash.com/photo-1546470427-227c7369a9b9?w=300&fit=crop",
  },
  {
    id: 2,
    name: "Mixed Vegetables",
    price: "8.99",
    unit: "basket",
    stock: 80,
    sold: 220,
    category: "Vegetables",
    description: "A fresh mix of seasonal vegetables",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&fit=crop",
  },
];

const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Dairy",
  "Grains",
  "Poultry",
  "Other",
];
const UNITS = [
  "lb",
  "kg",
  "basket",
  "dozen",
  "gallon",
  "jar",
  "bag",
  "ear",
  "pint",
  "piece",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcRevenue = (price, sold) =>
  (parseFloat(price || 0) * (sold || 0)).toFixed(2);
const totalRevenue = (products) =>
  products.reduce((sum, p) => sum + parseFloat(p.price) * p.sold, 0).toFixed(2);
const totalSold = (products) => products.reduce((sum, p) => sum + p.sold, 0);
const emptyForm = () => ({
  name: "",
  price: "",
  unit: "lb",
  stock: "",
  categoryId: null,
  description: "",
  image: "",
});

// ─── Product Form Modal ───────────────────────────────────────────────────────

function ProductFormModal({ visible, onClose, onSave, editProduct }) {
  const categories = useCategories();
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, []);

  useEffect(() => {
    if (editProduct) {
      setForm({
        name: editProduct.name,
        price: editProduct.price,
        unit: editProduct.unit,
        stock: String(editProduct.stock),
        categoryId: editProduct.categoryId,
        description: editProduct.description || "",
        image: editProduct.image || "",
      });
    } else {
      setForm(emptyForm()); // emptyForm() should set categoryId: null
    }
    setErrors({});
    setImageError("");
  }, [editProduct, visible]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.price.trim() || isNaN(form.price) || parseFloat(form.price) <= 0)
      e.price = "Enter a valid price";
    if (!form.stock.trim() || isNaN(form.stock) || parseInt(form.stock) < 0)
      e.stock = "Enter a valid stock quantity";
    if (!form.categoryId) e.categoryId = "Please select a category";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const imageUrl =
      form.image.trim() ||
      `https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&fit=crop`;
    onSave({
      name: form.name.trim(),
      price: parseFloat(form.price).toFixed(2),
      unit: form.unit,
      stock: parseInt(form.stock),
      categoryId: form.categoryId,
      description: form.description.trim(),
      image: imageUrl,
    });
    setForm(emptyForm());
    setErrors({});
    setImageError("");
  };

  const handleClose = () => {
    setForm(emptyForm());
    setErrors({});
    setImageError("");
    onClose();
  };

  const validateImageUrl = (url) => {
    if (!url.trim()) {
      setImageError("");
      return;
    }
    try {
      new URL(url);
      setImageError("");
    } catch (_e) {
      setImageError("Please enter a valid image URL");
    }
  };

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Denied",
          "We need access to your photo library to upload images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Use the local URI directly — React Native Image supports local file URIs
        set("image", result.assets[0].uri);
        setImageError("");
      }
    } catch (error) {
      setUploadingImage(false);
      Alert.alert(
        "Error",
        "Failed to pick image: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>
                {editProduct ? "Edit Product" : "Add New Product"}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.modalClose}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Product Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Product Name *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="e.g. Organic Tomatoes"
                  placeholderTextColor="#9ca3af"
                  value={form.name}
                  onChangeText={(v) => set("name", v)}
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              {/* Price + Unit */}
              <View style={styles.row}>
                <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                  <Text style={styles.fieldLabel}>Price ($) *</Text>
                  <TextInput
                    style={[styles.input, errors.price && styles.inputError]}
                    placeholder="0.00"
                    placeholderTextColor="#9ca3af"
                    value={form.price}
                    onChangeText={(v) => set("price", v)}
                    keyboardType="decimal-pad"
                  />
                  {errors.price && (
                    <Text style={styles.errorText}>{errors.price}</Text>
                  )}
                </View>
                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.fieldLabel}>Unit</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 6 }}
                  >
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {UNITS.map((u) => (
                        <TouchableOpacity
                          key={u}
                          onPress={() => set("unit", u)}
                          style={[
                            styles.chip,
                            form.unit === u && styles.chipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              form.unit === u && styles.chipTextSelected,
                            ]}
                          >
                            {u}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              {/* Stock */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Stock Quantity *</Text>
                <TextInput
                  style={[styles.input, errors.stock && styles.inputError]}
                  placeholder="e.g. 100"
                  placeholderTextColor="#9ca3af"
                  value={form.stock}
                  onChangeText={(v) => set("stock", v)}
                  keyboardType="number-pad"
                />
                {errors.stock && (
                  <Text style={styles.errorText}>{errors.stock}</Text>
                )}
              </View>

              {/* Category */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.chipRow}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => set("categoryId", c.id)}
                      style={[
                        styles.chip,
                        form.categoryId === c.id && styles.chipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          form.categoryId === c.id && styles.chipTextSelected,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.categoryId && (
                  <Text style={styles.errorText}>{errors.categoryId}</Text>
                )}
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your product..."
                  placeholderTextColor="#9ca3af"
                  value={form.description}
                  onChangeText={(v) => set("description", v)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Image URL */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Product Image URL</Text>
                <TextInput
                  style={[styles.input, imageError && styles.inputError]}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor="#9ca3af"
                  value={form.image}
                  onChangeText={(v) => {
                    set("image", v);
                    validateImageUrl(v);
                  }}
                />
                {imageError && (
                  <Text style={styles.errorText}>{imageError}</Text>
                )}
                <Text style={styles.helperText}>
                  Optional: Paste a direct image URL to customize the product
                  image
                </Text>
              </View>

              {/* Upload Image Button */}
              <TouchableOpacity
                style={styles.uploadImageBtn}
                onPress={pickImage}
                disabled={uploadingImage}
              >
                <Ionicons
                  name={
                    uploadingImage
                      ? "hourglass-outline"
                      : "cloud-upload-outline"
                  }
                  size={18}
                  color="#fff"
                />
                <Text style={styles.uploadImageBtnText}>
                  {uploadingImage
                    ? "Processing..."
                    : "Upload Image from Device"}
                </Text>
              </TouchableOpacity>

              {/* Image Preview */}
              {form.image.trim() && !imageError && (
                <View style={styles.imagePreviewContainer}>
                  <Text style={styles.imagePreviewLabel}>Image Preview</Text>
                  <Image
                    source={{ uri: form.image }}
                    style={styles.imagePreview}
                    onError={() => setImageError("Failed to load image")}
                  />
                </View>
              )}

              {/* Price preview */}
              {form.price &&
                form.unit &&
                !isNaN(form.price) &&
                parseFloat(form.price) > 0 && (
                  <View style={styles.previewBadge}>
                    <Ionicons
                      name="pricetag-outline"
                      size={14}
                      color="#10b981"
                    />
                    <Text style={styles.previewText}>
                      Preview: ${parseFloat(form.price).toFixed(2)}/{form.unit}
                    </Text>
                  </View>
                )}

              {/* Save */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Ionicons
                  name={
                    editProduct
                      ? "checkmark-circle-outline"
                      : "add-circle-outline"
                  }
                  size={20}
                  color="#fff"
                />
                <Text style={styles.saveBtnText}>
                  {editProduct ? "Save Changes" : "Add Product"}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SellerScreen() {
  const user = useUser();
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;
    setLoading(true);
    const dbProducts = await fetchSellerProducts(user.id);
    if (dbProducts && dbProducts.length > 0) {
      setProducts(dbProducts);
    }
    setLoading(false);
  };

  // Replace this with real alert count from your context/store later
  const activeAlerts = 2;

  const goToAlerts = () => router.push("/alerts");

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };
  const openAdd = () => {
    setEditProduct(null);
    setModalVisible(true);
  };
  const openEdit = (product) => {
    setEditProduct(product);
    setModalVisible(true);
  };

  const handleSave = async (formData) => {
    if (!user) return;

    try {
      if (editProduct) {
        await updateMarketProduct(editProduct.id, {
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          unit: `/${formData.unit}`,
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === editProduct.id ? { ...p, ...formData } : p))
        );
        Alert.alert("Updated", `"${formData.name}" has been updated.`);
      } else {
        await addMarketProduct(
          {
            name: formData.name,
            rating: 4.5,
            stock: formData.stock,
            description: formData.description,
            price: parseFloat(formData.price),
            unit: `/${formData.unit}`,
            image: formData.image,
            featured: false,
            organic: true,
            categoryId: formData.categoryId,
          },
          user.id
        );

        // Refresh products to get the new ID from DB
        await loadProducts();
        Alert.alert(
          "Added",
          `"${formData.name}" has been added to your listings.`
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save product. Please try again.");
    }

    setModalVisible(false);
    setEditProduct(null);
  };

  const handleDelete = (product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMarketProduct(product.id);
              setProducts((prev) => prev.filter((p) => p.id !== product.id));
            } catch (e) {
              Alert.alert("Error", "Failed to delete product.");
            }
          },
        },
      ]
    );
  };

  // Role protection
  useEffect(() => {
    if (user && user.role !== "seller" && user.role !== "admin") {
      router.replace("/");
    }
  }, [user]);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Verifying access...</Text>
      </View>
    );
  }

  if (user.role !== "seller" && user.role !== "admin") {
    return null; // Redirecting via useEffect
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <Ionicons name="storefront" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Seller Dashboard</Text>
            <Text style={styles.headerSubtitle}>Manage your products</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Shield alert button */}
          <TouchableOpacity style={styles.alertIconBtn} onPress={goToAlerts}>
            <Ionicons name="shield" size={22} color="#fff" />
            {activeAlerts > 0 && (
              <View style={styles.alertIconBadge}>
                <Text style={styles.alertIconBadgeText}>{activeAlerts}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Text
              style={styles.userName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user?.fullName || "Guest"}
            </Text>
            <Text style={styles.userRole}>{user?.role || "Seller"}</Text>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Red Alert Banner ── */}
        {activeAlerts > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={goToAlerts}
            activeOpacity={0.85}
          >
            <View style={styles.alertBannerLeft}>
              <Ionicons name="warning" size={20} color="#fff" />
              <View>
                <Text style={styles.alertBannerTitle}>
                  {activeAlerts} Active Security Alert
                  {activeAlerts > 1 ? "s" : ""}
                </Text>
                <Text style={styles.alertBannerSub}>
                  Tap to view and respond
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ── Stats ── */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.revenueCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Total Revenue</Text>
              <Ionicons
                name="cash-outline"
                size={20}
                color="rgba(255,255,255,0.8)"
              />
            </View>
            <Text style={styles.statValue}>${totalRevenue(products)}</Text>
            <Text style={styles.statChange}>+12% from last month</Text>
          </View>

          <View style={[styles.statCard, styles.soldCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Products Sold</Text>
              <Ionicons
                name="trending-up"
                size={20}
                color="rgba(255,255,255,0.8)"
              />
            </View>
            <Text style={styles.statValue}>{totalSold(products)}</Text>
            <Text style={styles.statChange}>+8% from last month</Text>
          </View>

          <View style={[styles.statCard, styles.activeCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Active Products</Text>
              <Ionicons
                name="pricetag-outline"
                size={20}
                color="rgba(255,255,255,0.8)"
              />
            </View>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statChange}>Listed products</Text>
          </View>
        </View>

        {/* ── Farm Security Card ── */}
        <TouchableOpacity
          style={styles.securityCard}
          onPress={goToAlerts}
          activeOpacity={0.85}
        >
          <View style={styles.securityCardLeft}>
            <View style={styles.securityCardIcon}>
              <Ionicons name="shield-checkmark" size={22} color="#ef4444" />
            </View>
            <View>
              <Text style={styles.securityCardTitle}>Farm Security Center</Text>
              <Text style={styles.securityCardSub}>
                Monitor intruder alerts · Call authorities · View history
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </TouchableOpacity>

        {/* ── Add Product Button ── */}
        <TouchableOpacity style={styles.addProductButton} onPress={openAdd}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addProductText}>Add New Product</Text>
        </TouchableOpacity>

        {/* ── Products Table ── */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Products</Text>
            <Text style={styles.sectionSubtitle}>
              {products.length} listing{products.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={56} color="#d1d5db" />
              <Text style={styles.emptyText}>No products yet</Text>
              <Text style={styles.emptySub}>
                Tap Add New Product to get started
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.thCell, { flex: 2.2 }]}>Product</Text>
                <Text style={[styles.thCell, { flex: 1.4 }]}>Price</Text>
                <Text
                  style={[styles.thCell, { flex: 0.9, textAlign: "center" }]}
                >
                  Stock
                </Text>
                <Text
                  style={[styles.thCell, { flex: 0.9, textAlign: "center" }]}
                >
                  Sold
                </Text>
                <Text style={[styles.thCell, { flex: 1.5 }]}>Revenue</Text>
                <Text style={[styles.thCell, { flex: 1, textAlign: "center" }]}>
                  Actions
                </Text>
              </View>

              {products.map((product, index) => (
                <View
                  key={product.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && styles.tableRowAlt,
                  ]}
                >
                  <View style={{ flex: 2.2, minWidth: 0 }}>
                    <View style={styles.productThumbRow}>
                      <Image
                        source={{ uri: product.image }}
                        style={styles.productThumb}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={styles.productName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {product.name}
                        </Text>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>
                            {product.category}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Text
                    style={[styles.tdCell, styles.priceText, { flex: 1.4 }]}
                  >
                    ${product.price}
                    <Text style={styles.unitText}>/{product.unit}</Text>
                  </Text>

                  <View style={{ flex: 0.9, alignItems: "center" }}>
                    <Text style={[styles.tdCell, styles.cyanText]}>
                      {product.stock}
                    </Text>
                  </View>

                  <View style={{ flex: 0.9, alignItems: "center" }}>
                    <Text style={[styles.tdCell, styles.cyanText]}>
                      {product.sold}
                    </Text>
                  </View>

                  <Text
                    style={[styles.tdCell, styles.greenText, { flex: 1.5 }]}
                  >
                    ${calcRevenue(product.price, product.sold)}
                  </Text>

                  <View style={[styles.actionsCell, { flex: 1 }]}>
                    <TouchableOpacity
                      style={styles.actionBtnEdit}
                      onPress={() => openEdit(product)}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={15}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtnDelete}
                      onPress={() => handleDelete(product)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={15}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Totals row */}
              <View style={styles.totalsRow}>
                <Text style={[styles.totalLabel, { flex: 2.2 }]}>Totals</Text>
                <Text style={{ flex: 1.4 }} />
                <Text
                  style={[
                    styles.totalLabel,
                    { flex: 0.9, textAlign: "center" },
                  ]}
                >
                  {products.reduce((s, p) => s + p.stock, 0)}
                </Text>
                <Text
                  style={[
                    styles.totalLabel,
                    { flex: 0.9, textAlign: "center" },
                  ]}
                >
                  {totalSold(products)}
                </Text>
                <Text
                  style={[styles.totalLabel, styles.greenText, { flex: 1.5 }]}
                >
                  ${totalRevenue(products)}
                </Text>
                <View style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <BottomNav />

      <ProductFormModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditProduct(null);
        }}
        onSave={handleSave}
        editProduct={editProduct}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdf4", overflow: "hidden" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#10b981",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logoIcon: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
    minWidth: 0,
  },
  notificationButton: { padding: 8 },
  userInfo: { alignItems: "flex-end", flexShrink: 1, minWidth: 0 },
  userName: { fontSize: 14, fontWeight: "600", color: "#fff" },
  userRole: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  logoutButton: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  // Alert icon in header
  alertIconBtn: { position: "relative", padding: 8 },
  alertIconBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  alertIconBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },

  // Alert banner
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ef4444",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  alertBannerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  alertBannerTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  alertBannerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 1,
  },

  // Security card
  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  securityCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  securityCardIcon: {
    width: 44,
    height: 44,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  securityCardTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  securityCardSub: { fontSize: 11, color: "#6b7280", marginTop: 2 },

  // Content
  content: { flex: 1, padding: 16, paddingBottom: 120 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
  },
  loadingText: { marginTop: 12, color: "#10b981", fontSize: 14 },
  statsContainer: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, padding: 14, borderRadius: 16 },
  revenueCard: { backgroundColor: "#10b981" },
  soldCard: { backgroundColor: "#06b6d4" },
  activeCard: { backgroundColor: "#d946ef" },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statChange: { fontSize: 10, color: "rgba(255,255,255,0.8)" },

  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  addProductText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Products section
  productsSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#111827" },
  sectionSubtitle: { fontSize: 13, color: "#6b7280" },

  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#ecfdf5",
    borderRadius: 10,
    marginBottom: 6,
  },
  thCell: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    flexShrink: 1,
    minWidth: 0,
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  tableRowAlt: { backgroundColor: "#fafafa" },

  tdCell: {
    fontSize: 13,
    color: "#374151",
    flexShrink: 1,
    minWidth: 0,
  },
  priceText: { fontWeight: "600", color: "#111827" },
  unitText: { fontSize: 11, fontWeight: "400", color: "#9ca3af" },

  productThumbRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  productThumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    borderWidth: 1,
    borderColor: "#f0fdf4",
  },
  productName: { fontSize: 13.5, fontWeight: "600", color: "#111827" },

  categoryBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: "#16a34a",
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  cyanText: { color: "#0891b2", fontWeight: "600" },
  greenText: { color: "#059669", fontWeight: "700" },

  actionsCell: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    flexShrink: 0,
  },
  actionBtnEdit: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnDelete: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },

  totalsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginTop: 6,
  },
  totalLabel: { fontSize: 13, fontWeight: "700", color: "#374151" },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 14,
    fontWeight: "600",
  },
  emptySub: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 8,
    maxHeight: "92%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  modalTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  modalClose: { padding: 4 },
  formScroll: { flexGrow: 0 },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#fafafa",
  },
  inputError: { borderColor: "#ef4444" },
  textArea: { height: 80, paddingTop: 10 },
  errorText: { fontSize: 12, color: "#ef4444", marginTop: 4 },
  row: { flexDirection: "row", marginBottom: 0 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  chipSelected: { backgroundColor: "#10b981", borderColor: "#10b981" },
  chipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  chipTextSelected: { color: "#fff" },

  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewText: { fontSize: 13, color: "#10b981", fontWeight: "600" },

  imagePreviewContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  imagePreviewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    padding: 12,
    paddingBottom: 8,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    backgroundColor: "#e5e7eb",
    resizeMode: "cover",
  },
  helperText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 6,
    fontStyle: "italic",
  },

  uploadImageBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  uploadImageBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  saveBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
