import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import BottomNav from "../../components/BottomNav";
import { useAuthInitialized } from "../../lib/auth-store";
import { FetchAllProducts } from "../../backend/actions";
import ProductCard from "../../components/ProductCard";
import { useCartStore } from "../../lib/cart-store";
import { useWishlistStore } from "../../lib/wishlist-store";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Dairy", "Grains"];

// ─── Cart Modal ───────────────────────────────────────────────────────────────

function CartModal({
  visible,
  onClose,
  cart,
  onUpdateQty,
  onRemove,
  onCheckout,
}) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>My Cart</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <Text style={styles.emptyCartSub}>Add some fresh products!</Text>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.cartList}
                showsVerticalScrollIndicator={false}
              >
                {cart.map((item) => (
                  <View key={item.id} style={styles.cartItem}>
                    <Image source={item.image} style={styles.cartItemImage} />
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cartItemPrice}>
                        ${(item.price * item.qty).toFixed(2)}
                      </Text>
                      <Text style={styles.cartItemUnit}>
                        ${item.price.toFixed(2)}
                        {item.unit}
                      </Text>
                    </View>
                    <View style={styles.qtyControl}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => onUpdateQty(item.id, item.qty - 1)}
                      >
                        <Ionicons name="remove" size={16} color="#374151" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.qty}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => onUpdateQty(item.id, item.qty + 1)}
                      >
                        <Ionicons name="add" size={16} color="#374151" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => onRemove(item.id)}
                      style={styles.removeBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.cartSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)
                  </Text>
                  <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <Text style={[styles.summaryValue, { color: "#10b981" }]}>
                    Free
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={onCheckout}
                >
                  <Ionicons name="card-outline" size={18} color="#fff" />
                  <Text style={styles.checkoutText}>Checkout</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BuyerScreen() {
  // ✅ Fixed: useAuthStore called as a hook, not .useState()
  const initialized = useAuthInitialized();

  const [products, setProducts] = useState([]);
  const params = useLocalSearchParams();
  const initialSearch = Array.isArray(params.search)
    ? params.search[0]
    : params.search;

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartVisible, setCartVisible] = useState(false);
  const [wishlistVisible, setWishlistVisible] = useState(false);

  const {
    wishlist,
    toggleWishlist,
    hydrate: hydrateWishlist,
  } = useWishlistStore();

  const { cart, addToCart, updateQty, removeFromCart } = useCartStore();
  const hydrateCart = useCartStore((s) => s.hydrate);

  const getProducts = async () => {
    try {
      const data = await FetchAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    hydrateCart();
    hydrateWishlist();

    if (typeof initialSearch === "string" && initialSearch.trim()) {
      setSearchQuery(initialSearch);
    }

    getProducts();

    if (params.addProduct) {
      try {
        const product = JSON.parse(decodeURIComponent(params.addProduct));
        addToCart(product);
        router.setParams({ addProduct: undefined });
      } catch (e) {
        console.error("Failed to parse addProduct param:", e);
      }
    }
  }, [initialSearch]);

  // ── Filtered products ──────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "All" || p.category === selectedCategory;
      const matchesSearch =
        !query ||
        (p.name || "").toLowerCase().includes(query) ||
        (p.description || "").toLowerCase().includes(query) ||
        (p.farm || "").toLowerCase().includes(query) ||
        (p.category || "").toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // ── Wishlisted products ────────────────────────────────────────────────────
  // ✅ Fixed: wishlist holds objects, so filter by ID using .some()
  const wishlistedProducts = products.filter((p) =>
    wishlist.some((item) => item.id === p.id)
  );

  // ── Checkout ───────────────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please add items before checkout");
      return;
    }
    setCartVisible(false);
    router.push({
      pathname: "/checkout",
      params: { cart: encodeURIComponent(JSON.stringify(cart)) },
    });
  };

  const handleAccount = () => {
    router.push("/account");
  };

  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <Ionicons name="leaf" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.logoText}>FarmConnect</Text>
            <Text style={styles.logoSubtext}>Fresh from Farm to You</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color="#6b7280" />
          </TouchableOpacity>

          {/* Wishlist button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setWishlistVisible(true)}
          >
            <Ionicons name="heart-outline" size={22} color="#6b7280" />
            {wishlist.length > 0 && (
              <View style={styles.iconBadge}>
                <Text style={styles.iconBadgeText}>{wishlist.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Cart button */}
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => setCartVisible(true)}
          >
            <Ionicons name="cart" size={20} color="#fff" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAccount}
            style={styles.profileButton}
          >
            <Ionicons name="person-circle" size={32} color="#10b981" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search fresh products..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner — only show when not searching */}
        {searchQuery.length === 0 && (
          <View style={styles.banner}>
            <View style={styles.bannerHeader}>
              <Ionicons name="trending-up" size={18} color="#fff" />
              <View style={styles.trendingBadge}>
                <Text style={styles.trendingText}>Trending Now</Text>
              </View>
            </View>
            <Text style={styles.bannerTitle}>
              Fresh Farm Products Delivered Daily
            </Text>
            <Text style={styles.bannerSubtitle}>
              Shop organic produce directly from local farmers. Quality
              guaranteed, sustainable agriculture supported.
            </Text>
            <View style={styles.bannerButtons}>
              <TouchableOpacity
                style={styles.shopNowButton}
                onPress={() => setSelectedCategory("All")}
              >
                <Text style={styles.shopNowText}>Shop Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.learnMoreButton}>
                <Text style={styles.learnMoreText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Featured — only when not searching/filtering */}
        {searchQuery.length === 0 && selectedCategory === "All" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={18} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Featured Products</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {products
                .filter((p) => p.featured)
                .map((product) => (
                  <ProductCard key={product.id} product={product} compact />
                ))}
            </ScrollView>
          </View>
        )}

        {/* Category Filter */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
            Browse by Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category &&
                      styles.categoryChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category &&
                        styles.categoryChipTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Products Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery
                ? `Results for "${searchQuery}"`
                : selectedCategory === "All"
                ? "All Products"
                : selectedCategory}
            </Text>
            <Text style={styles.resultCount}>
              {filteredProducts.length} items
            </Text>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text style={styles.noResultsText}>No products found</Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
              >
                <Text style={styles.clearFilters}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {/* ✅ Fixed: added missing key prop */}
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav />

      {/* Cart Modal */}
      <CartModal
        visible={cartVisible}
        onClose={() => setCartVisible(false)}
        cart={cart}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />

      {/* Wishlist Modal */}
      <Modal visible={wishlistVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>Wishlist</Text>
                <TouchableOpacity
                  onPress={() => setWishlistVisible(false)}
                  style={styles.modalClose}
                >
                  <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {wishlistedProducts.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="heart-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyCartText}>Your wishlist is empty</Text>
                <Text style={styles.emptyCartSub}>
                  Tap the heart on any product to save it.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.cartList}>
                {wishlistedProducts.map((product) => (
                  <View key={product.id} style={styles.cartItem}>
                    <Image
                      source={product.image}
                      style={styles.cartItemImage}
                    />
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text style={styles.cartItemPrice}>
                        ${product.price.toFixed(2)}
                        {product.unit}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => {
                        addToCart(product);
                        setWishlistVisible(false);
                      }}
                    >
                      <Ionicons name="cart-outline" size={14} color="#fff" />
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                    {/* ✅ Fixed: pass full product object, not product.id */}
                    <TouchableOpacity
                      onPress={() => toggleWishlist(product)}
                      style={{ marginLeft: 8 }}
                    >
                      <Ionicons name="heart" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logoIcon: {
    width: 36,
    height: 36,
    backgroundColor: "#10b981",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoText: { fontSize: 16, fontWeight: "bold", color: "#10b981" },
  logoSubtext: { fontSize: 11, color: "#6b7280" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: { padding: 8, position: "relative" },
  iconBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  cartButton: {
    backgroundColor: "#10b981",
    padding: 8,
    borderRadius: 8,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  profileButton: { marginLeft: 4 },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 8,
    fontSize: 15,
    color: "#111827",
  },

  // Content
  content: { flex: 1, paddingBottom: 120 },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 0,
  },
  resultCount: { fontSize: 13, color: "#6b7280" },

  // Banner
  banner: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#10b981",
  },
  bannerHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  trendingBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  trendingText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "#d1fae5",
    lineHeight: 20,
    marginBottom: 16,
  },
  bannerButtons: { flexDirection: "row", gap: 12 },
  shopNowButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopNowText: { color: "#10b981", fontWeight: "600" },
  learnMoreButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  learnMoreText: { color: "#fff", fontWeight: "600" },

  // Categories
  categoryContainer: { flexDirection: "row", gap: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  categoryChipSelected: { backgroundColor: "#10b981", borderColor: "#10b981" },
  categoryChipText: { color: "#374151", fontWeight: "500" },
  categoryChipTextSelected: { color: "#fff" },

  // Product grid
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },

  // Empty states
  noResults: { alignItems: "center", paddingVertical: 40 },
  noResultsText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 12,
    fontWeight: "500",
  },
  clearFilters: { marginTop: 8, color: "#10b981", fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 32,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  modalClose: { padding: 4 },
  addButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    marginLeft: 8,
  },
  addButtonText: { color: "#fff" },

  // Cart items
  cartList: { paddingHorizontal: 20, paddingTop: 8 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 12,
  },
  cartItemImage: { width: 56, height: 56, borderRadius: 10 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
    marginTop: 2,
  },
  cartItemUnit: { fontSize: 11, color: "#9ca3af" },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    minWidth: 20,
    textAlign: "center",
  },
  removeBtn: { padding: 4 },

  // Cart summary
  cartSummary: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: "#6b7280" },
  summaryValue: { fontSize: 14, fontWeight: "500", color: "#111827" },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginBottom: 16,
  },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#10b981" },
  checkoutBtn: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // Empty cart/wishlist
  emptyCart: { alignItems: "center", paddingVertical: 48 },
  emptyCartText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyCartSub: { fontSize: 14, color: "#9ca3af", marginTop: 6 },
});
