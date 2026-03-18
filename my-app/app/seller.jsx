import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_PRODUCTS = [
  { id: 1, name: "Organic Tomatoes", price: "4.99", unit: "lb", stock: 150, sold: 450, category: "Vegetables", description: "Fresh, organic tomatoes picked daily" },
  { id: 2, name: "Mixed Vegetables", price: "8.99", unit: "basket", stock: 80, sold: 220, category: "Vegetables", description: "A fresh mix of seasonal vegetables" },
];

const CATEGORIES = ["Vegetables", "Fruits", "Dairy", "Grains", "Poultry", "Other"];
const UNITS = ["lb", "kg", "basket", "dozen", "gallon", "jar", "bag", "ear", "pint", "piece"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcRevenue = (price, sold) => (parseFloat(price || 0) * (sold || 0)).toFixed(2);
const totalRevenue = (products) => products.reduce((sum, p) => sum + parseFloat(p.price) * p.sold, 0).toFixed(2);
const totalSold = (products) => products.reduce((sum, p) => sum + p.sold, 0);
const emptyForm = () => ({ name: "", price: "", unit: "lb", stock: "", category: "Vegetables", description: "" });

// ─── Product Form Modal ───────────────────────────────────────────────────────

function ProductFormModal({ visible, onClose, onSave, editProduct }) {
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  useState(() => {
    if (editProduct) {
      setForm({
        name: editProduct.name,
        price: editProduct.price,
        unit: editProduct.unit,
        stock: String(editProduct.stock),
        category: editProduct.category,
        description: editProduct.description || "",
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      price: parseFloat(form.price).toFixed(2),
      unit: form.unit,
      stock: parseInt(form.stock),
      category: form.category,
      description: form.description.trim(),
    });
    setForm(emptyForm());
    setErrors({});
  };

  const handleClose = () => {
    setForm(emptyForm());
    setErrors({});
    onClose();
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
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Price + Unit row */}
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
                  {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                </View>
                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.fieldLabel}>Unit</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {UNITS.map((u) => (
                        <TouchableOpacity
                          key={u}
                          onPress={() => set("unit", u)}
                          style={[styles.chip, form.unit === u && styles.chipSelected]}
                        >
                          <Text style={[styles.chipText, form.unit === u && styles.chipTextSelected]}>
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
                {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
              </View>

              {/* Category */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.chipRow}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => set("category", c)}
                      style={[styles.chip, form.category === c && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, form.category === c && styles.chipTextSelected]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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

              {/* Preview price string */}
              {form.price && form.unit && !isNaN(form.price) && parseFloat(form.price) > 0 && (
                <View style={styles.previewBadge}>
                  <Ionicons name="pricetag-outline" size={14} color="#10b981" />
                  <Text style={styles.previewText}>
                    Preview: ${parseFloat(form.price).toFixed(2)}/{form.unit}
                  </Text>
                </View>
              )}

              {/* Save button */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Ionicons
                  name={editProduct ? "checkmark-circle-outline" : "add-circle-outline"}
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
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const handleLogout = () => router.replace("/");

  const openAdd = () => { setEditProduct(null); setModalVisible(true); };
  const openEdit = (product) => { setEditProduct(product); setModalVisible(true); };

  const handleSave = (formData) => {
    if (editProduct) {
      setProducts((prev) =>
        prev.map((p) => p.id === editProduct.id ? { ...p, ...formData } : p)
      );
      Alert.alert("Updated", `"${formData.name}" has been updated.`);
    } else {
      setProducts((prev) => [...prev, { id: Date.now(), sold: 0, ...formData }]);
      Alert.alert("Added", `"${formData.name}" has been added to your listings.`);
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
          onPress: () => setProducts((prev) => prev.filter((p) => p.id !== product.id)),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>marydoo211</Text>
            <Text style={styles.userRole}>Seller</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.revenueCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Total Revenue</Text>
              <Ionicons name="cash-outline" size={20} color="rgba(255,255,255,0.8)" />
            </View>
            <Text style={styles.statValue}>${totalRevenue(products)}</Text>
            <Text style={styles.statChange}>+12% from last month</Text>
          </View>
          <View style={[styles.statCard, styles.soldCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Products Sold</Text>
              <Ionicons name="trending-up" size={20} color="rgba(255,255,255,0.8)" />
            </View>
            <Text style={styles.statValue}>{totalSold(products)}</Text>
            <Text style={styles.statChange}>+8% from last month</Text>
          </View>
          <View style={[styles.statCard, styles.activeCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Active Products</Text>
              <Ionicons name="pricetag-outline" size={20} color="rgba(255,255,255,0.8)" />
            </View>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statChange}>Listed products</Text>
          </View>
        </View>

        {/* Add button */}
        <TouchableOpacity style={styles.addProductButton} onPress={openAdd}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addProductText}>Add New Product</Text>
        </TouchableOpacity>

        {/* Products Section */}
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
              <Text style={styles.emptySub}>Tap "Add New Product" to get started</Text>
            </View>
          ) : (
            <>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.thCell, { flex: 2.2 }]}>Product</Text>
                <Text style={[styles.thCell, { flex: 1.4 }]}>Price</Text>
                <Text style={[styles.thCell, { flex: 0.9, textAlign: "center" }]}>Stock</Text>
                <Text style={[styles.thCell, { flex: 0.9, textAlign: "center" }]}>Sold</Text>
                <Text style={[styles.thCell, { flex: 1.5 }]}>Revenue</Text>
                <Text style={[styles.thCell, { flex: 1, textAlign: "center" }]}>Actions</Text>
              </View>

              {products.map((product, index) => (
                <View
                  key={product.id}
                  style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
                >
                  {/* Name + category badge */}
                  <View style={{ flex: 2.2 }}>
                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{product.category}</Text>
                    </View>
                  </View>

                  <Text style={[styles.tdCell, { flex: 1.4 }]}>
                    ${product.price}/{product.unit}
                  </Text>
                  <Text style={[styles.tdCell, styles.cyanText, { flex: 0.9, textAlign: "center" }]}>
                    {product.stock}
                  </Text>
                  <Text style={[styles.tdCell, styles.cyanText, { flex: 0.9, textAlign: "center" }]}>
                    {product.sold}
                  </Text>
                  <Text style={[styles.tdCell, styles.greenText, { flex: 1.5 }]}>
                    ${calcRevenue(product.price, product.sold)}
                  </Text>

                  <View style={[styles.actionsCell, { flex: 1 }]}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(product)}>
                      <Ionicons name="pencil-outline" size={17} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(product)}>
                      <Ionicons name="trash-outline" size={17} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Totals row */}
              <View style={styles.totalsRow}>
                <Text style={[styles.totalLabel, { flex: 2.2 }]}>Totals</Text>
                <Text style={{ flex: 1.4 }} />
                <Text style={[styles.totalLabel, { flex: 0.9, textAlign: "center" }]}>
                  {products.reduce((s, p) => s + p.stock, 0)}
                </Text>
                <Text style={[styles.totalLabel, { flex: 0.9, textAlign: "center" }]}>
                  {totalSold(products)}
                </Text>
                <Text style={[styles.totalLabel, styles.greenText, { flex: 1.5 }]}>
                  ${totalRevenue(products)}
                </Text>
                <View style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <ProductFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditProduct(null); }}
        onSave={handleSave}
        editProduct={editProduct}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: "#f0fdf4" },
  header:               { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: "#10b981" },
  headerLeft:           { flexDirection: "row", alignItems: "center" },
  logoIcon:             { width: 44, height: 44, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  headerTitle:          { fontSize: 18, fontWeight: "bold", color: "#fff" },
  headerSubtitle:       { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  headerRight:          { flexDirection: "row", alignItems: "center", gap: 12 },
  notificationButton:   { padding: 8 },
  userInfo:             { alignItems: "flex-end" },
  userName:             { fontSize: 14, fontWeight: "600", color: "#fff" },
  userRole:             { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  logoutButton:         { width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, justifyContent: "center", alignItems: "center" },

  content:              { flex: 1, padding: 16 },
  statsContainer:       { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard:             { flex: 1, padding: 14, borderRadius: 16 },
  revenueCard:          { backgroundColor: "#10b981" },
  soldCard:             { backgroundColor: "#06b6d4" },
  activeCard:           { backgroundColor: "#d946ef" },
  statHeader:           { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  statLabel:            { fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: "500", flex: 1 },
  statValue:            { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  statChange:           { fontSize: 10, color: "rgba(255,255,255,0.8)" },

  addProductButton:     { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#10b981", paddingVertical: 13, paddingHorizontal: 20, borderRadius: 10, marginBottom: 20, gap: 8 },
  addProductText:       { color: "#fff", fontSize: 15, fontWeight: "700" },

  productsSection:      { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 20 },
  sectionHeader:        { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 },
  sectionTitle:         { fontSize: 17, fontWeight: "bold", color: "#111827" },
  sectionSubtitle:      { fontSize: 13, color: "#6b7280" },

  tableHeader:          { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 4, backgroundColor: "#f0fdf4", borderRadius: 8, marginBottom: 4 },
  thCell:               { fontSize: 11, fontWeight: "700", color: "#10b981" },
  tableRow:             { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tableRowAlt:          { backgroundColor: "#fafafa" },
  tdCell:               { fontSize: 13, color: "#374151" },
  productName:          { fontSize: 13, fontWeight: "600", color: "#10b981" },
  categoryBadge:        { marginTop: 3, alignSelf: "flex-start", backgroundColor: "#dcfce7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  categoryBadgeText:    { fontSize: 10, color: "#16a34a", fontWeight: "600" },
  cyanText:             { color: "#06b6d4", fontWeight: "500" },
  greenText:            { color: "#10b981", fontWeight: "600" },
  actionsCell:          { flexDirection: "row", gap: 8, justifyContent: "center" },
  actionBtn:            { padding: 4 },
  totalsRow:            { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 4, borderTopWidth: 2, borderTopColor: "#e5e7eb", marginTop: 4 },
  totalLabel:           { fontSize: 13, fontWeight: "700", color: "#374151" },

  emptyState:           { alignItems: "center", paddingVertical: 40 },
  emptyText:            { fontSize: 16, color: "#9ca3af", marginTop: 12, fontWeight: "600" },
  emptySub:             { fontSize: 13, color: "#d1d5db", marginTop: 4 },

  modalOverlay:         { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet:           { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 8, maxHeight: "92%" },
  modalHandle:          { width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  modalTitleRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", marginBottom: 16 },
  modalTitle:           { fontSize: 18, fontWeight: "bold", color: "#111827" },
  modalClose:           { padding: 4 },
  formScroll:           { flexGrow: 0 },

  fieldGroup:           { marginBottom: 16 },
  fieldLabel:           { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input:                { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#111827", backgroundColor: "#fafafa" },
  inputError:           { borderColor: "#ef4444" },
  textArea:             { height: 80, paddingTop: 10 },
  errorText:            { fontSize: 12, color: "#ef4444", marginTop: 4 },
  row:                  { flexDirection: "row", marginBottom: 0 },

  chipRow:              { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip:                 { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  chipSelected:         { backgroundColor: "#10b981", borderColor: "#10b981" },
  chipText:             { fontSize: 13, color: "#374151", fontWeight: "500" },
  chipTextSelected:     { color: "#fff" },

  previewBadge:         { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", padding: 10, borderRadius: 8, marginBottom: 16 },
  previewText:          { fontSize: 13, color: "#10b981", fontWeight: "600" },
  saveBtn:              { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#10b981", paddingVertical: 14, borderRadius: 12, gap: 8, marginBottom: 8 },
  saveBtnText:          { color: "#fff", fontSize: 16, fontWeight: "bold" },
});