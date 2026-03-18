import { useState, useMemo } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRODUCTS = [
  { id: 1, name: "Organic Tomatoes", rating: 4.8, stock: 150, description: "Fresh, organic tomatoes picked daily", farm: "Green Valley Farm, California", price: 4.99, unit: "/lb", image: "https://images.unsplash.com/photo-1546470427-227c7369a9b9?w=300", featured: true, organic: true, category: "Vegetables" },
  { id: 2, name: "Fresh Apples", rating: 4.9, stock: 200, description: "Crisp and sweet apples from local orchards", farm: "Sunrise Orchards, Washington", price: 3.49, unit: "/lb", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300", featured: true, organic: true, category: "Fruits" },
  { id: 3, name: "Free-Range Eggs", rating: 5, stock: 120, description: "Organic eggs from happy free range chickens", farm: "Hilltop Farm, Vermont", price: 6.99, unit: "/dozen", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300", featured: true, organic: true, category: "Dairy" },
  { id: 4, name: "Honey", rating: 4.9, stock: 95, description: "Raw, unfiltered local honey", farm: "Prairie Fields, Kansas", price: 12.99, unit: "/jar", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300", featured: true, organic: true, category: "Grains" },
  { id: 5, name: "Farm Fresh Milk", rating: 4.7, stock: 75, description: "Fresh whole milk from grass fed cows", farm: "Happy Cow Dairy, Wisconsin", price: 5.99, unit: "/gallon", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300", featured: false, organic: true, category: "Dairy" },
  { id: 6, name: "Sweet Corn", rating: 4.6, stock: 180, description: "Sun-ripened sweet corn, harvested fresh", farm: "Sunrise Orchards, Washington", price: 0.99, unit: "/ear", image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=300", featured: false, organic: false, category: "Vegetables" },
  { id: 7, name: "Wild Blueberries", rating: 4.8, stock: 60, description: "Hand-picked wild blueberries, antioxidant-rich", farm: "Blue Ridge Farm, Maine", price: 8.49, unit: "/pint", image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=300", featured: false, organic: true, category: "Fruits" },
  { id: 8, name: "Whole Wheat Flour", rating: 4.5, stock: 90, description: "Stone-ground whole wheat flour, nutrient-dense", farm: "Prairie Fields, Kansas", price: 4.29, unit: "/bag", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300", featured: false, organic: false, category: "Grains" },
];

const CATEGORIES = ["All", "Vegetables", "Fruits", "Dairy", "Grains"];

// ─── Cart Modal ───────────────────────────────────────────────────────────────

function CartModal({ visible, onClose, cart, onUpdateQty, onRemove, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Modal Header */}
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
              <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
                {cart.map((item) => (
                  <View key={item.id} style={styles.cartItem}>
                    <Image source={{ uri: item.image }} style={styles.cartItemImage} />
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>${(item.price * item.qty).toFixed(2)}</Text>
                      <Text style={styles.cartItemUnit}>${item.price.toFixed(2)}{item.unit}</Text>
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
                    <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.removeBtn}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              {/* Summary */}
              <View style={styles.cartSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)</Text>
                  <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <Text style={[styles.summaryValue, { color: "#10b981" }]}>Free</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckout}>
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

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, compact, onAddToCart, isWishlisted, onToggleWishlist }) {
  return (
    <View style={[styles.productCard, compact && styles.productCardCompact]}>
      <View style={styles.productImageContainer}>
        <Image source={{ uri: product.image }} style={styles.productImage} />
        {/* Wishlist button */}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={() => onToggleWishlist(product.id)}
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={16}
            color={isWishlisted ? "#ef4444" : "#fff"}
          />
        </TouchableOpacity>
        <View style={styles.productBadges}>
          {product.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.badgeText}>Featured</Text>
            </View>
          )}
          {product.organic && (
            <View style={styles.organicBadge}>
              <Ionicons name="leaf" size={10} color="#fff" />
              <Text style={styles.badgeText}>Organic</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={styles.ratingText}>{product.rating}</Text>
          <Text style={styles.stockText}>{product.stock} in stock</Text>
        </View>
        <Text style={styles.productDescription} numberOfLines={2}>
          {product.description}
        </Text>
        <View style={styles.farmRow}>
          <Ionicons name="location-outline" size={12} color="#6b7280" />
          <Text style={styles.farmText} numberOfLines={1}>{product.farm}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>
            ${product.price.toFixed(2)}
            <Text style={styles.unitText}>{product.unit}</Text>
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={() => onAddToCart(product)}>
            <Ionicons name="cart-outline" size={14} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BuyerScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [wishlistVisible, setWishlistVisible] = useState(false);

  // ── Filtered products ──────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.farm.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    // brief feedback
    Alert.alert("Added to cart", `${product.name} added to your cart.`, [{ text: "OK" }]);
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== id));
    } else {
      setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
    }
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // ── Wishlist helpers ───────────────────────────────────────────────────────
  const toggleWishlist = (id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  // ── Checkout ───────────────────────────────────────────────────────────────
  const handleCheckout = () => {
    setCartVisible(false);
    Alert.alert(
      "Order Placed!",
      `Your order of ${cartCount} item(s) totalling $${cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)} has been placed successfully.`,
      [{ text: "Great!", onPress: () => setCart([]) }]
    );
  };

  const handleLogout = () => {
    router.replace("/");
  };

  // ── Wishlisted products ────────────────────────────────────────────────────
  const wishlistedProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

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

          <TouchableOpacity onPress={handleLogout} style={styles.profileButton}>
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
            <Text style={styles.bannerTitle}>Fresh Farm Products Delivered Daily</Text>
            <Text style={styles.bannerSubtitle}>
              Shop organic produce directly from local farmers. Quality guaranteed,
              sustainable agriculture supported.
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
              {PRODUCTS.filter((p) => p.featured).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Category Filter */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Browse by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextSelected,
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
            <Text style={styles.resultCount}>{filteredProducts.length} items</Text>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text style={styles.noResultsText}>No products found</Text>
              <TouchableOpacity onPress={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
                <Text style={styles.clearFilters}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={`grid-${product.id}`}
                  product={product}
                  compact
                  onAddToCart={addToCart}
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

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
                <TouchableOpacity onPress={() => setWishlistVisible(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {wishlistedProducts.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="heart-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyCartText}>Your wishlist is empty</Text>
                <Text style={styles.emptyCartSub}>Tap the heart on any product to save it.</Text>
              </View>
            ) : (
              <ScrollView style={styles.cartList}>
                {wishlistedProducts.map((product) => (
                  <View key={product.id} style={styles.cartItem}>
                    <Image source={{ uri: product.image }} style={styles.cartItemImage} />
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={1}>{product.name}</Text>
                      <Text style={styles.cartItemPrice}>${product.price.toFixed(2)}{product.unit}</Text>
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
                    <TouchableOpacity onPress={() => toggleWishlist(product.id)} style={{ marginLeft: 8 }}>
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
  container:              { flex: 1, backgroundColor: "#f9fafb" },

  // Header
  header:                 { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  headerLeft:             { flexDirection: "row", alignItems: "center" },
  logoIcon:               { width: 36, height: 36, backgroundColor: "#10b981", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 },
  logoText:               { fontSize: 16, fontWeight: "bold", color: "#10b981" },
  logoSubtext:            { fontSize: 11, color: "#6b7280" },
  headerRight:            { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton:             { padding: 8, position: "relative" },
  iconBadge:              { position: "absolute", top: 2, right: 2, backgroundColor: "#ef4444", borderRadius: 10, width: 16, height: 16, justifyContent: "center", alignItems: "center" },
  iconBadgeText:          { color: "#fff", fontSize: 9, fontWeight: "bold" },
  cartButton:             { backgroundColor: "#10b981", padding: 8, borderRadius: 8, position: "relative" },
  cartBadge:              { position: "absolute", top: -4, right: -4, backgroundColor: "#ef4444", borderRadius: 10, width: 18, height: 18, justifyContent: "center", alignItems: "center" },
  cartBadgeText:          { color: "#fff", fontSize: 10, fontWeight: "bold" },
  profileButton:          { marginLeft: 4 },

  // Search
  searchContainer:        { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  searchInput:            { flex: 1, height: 44, marginLeft: 8, fontSize: 15, color: "#111827" },

  // Content
  content:                { flex: 1 },
  section:                { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle:           { fontSize: 16, fontWeight: "bold", color: "#111827", marginLeft: 0 },
  resultCount:            { fontSize: 13, color: "#6b7280" },

  // Banner
  banner:                 { marginHorizontal: 16, marginBottom: 20, padding: 20, borderRadius: 16, backgroundColor: "#10b981" },
  bannerHeader:           { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  trendingBadge:          { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  trendingText:           { color: "#fff", fontSize: 12, fontWeight: "600" },
  bannerTitle:            { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  bannerSubtitle:         { fontSize: 13, color: "#d1fae5", lineHeight: 20, marginBottom: 16 },
  bannerButtons:          { flexDirection: "row", gap: 12 },
  shopNowButton:          { backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  shopNowText:            { color: "#10b981", fontWeight: "600" },
  learnMoreButton:        { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  learnMoreText:          { color: "#fff", fontWeight: "600" },

  // Categories
  categoryContainer:      { flexDirection: "row", gap: 8 },
  categoryChip:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  categoryChipSelected:   { backgroundColor: "#10b981", borderColor: "#10b981" },
  categoryChipText:       { color: "#374151", fontWeight: "500" },
  categoryChipTextSelected: { color: "#fff" },

  // Product grid
  productsGrid:           { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  productCard:            { width: 180, backgroundColor: "#fff", borderRadius: 12, marginRight: 12, overflow: "hidden", borderWidth: 1, borderColor: "#e5e7eb" },
  productCardCompact:     { width: "48%", marginRight: 0 },
  productImageContainer:  { position: "relative" },
  productImage:           { width: "100%", height: 100 },
  wishlistBtn:            { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 5 },
  productBadges:          { position: "absolute", top: 8, left: 8, flexDirection: "row", gap: 4 },
  featuredBadge:          { backgroundColor: "#f59e0b", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  organicBadge:           { backgroundColor: "#10b981", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, flexDirection: "row", alignItems: "center", gap: 3 },
  badgeText:              { color: "#fff", fontSize: 10, fontWeight: "600" },
  productInfo:            { padding: 12 },
  productName:            { fontSize: 14, fontWeight: "600", color: "#10b981", marginBottom: 4 },
  ratingRow:              { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  ratingText:             { fontSize: 12, color: "#374151", marginLeft: 4 },
  stockText:              { fontSize: 11, color: "#6b7280", marginLeft: 8 },
  productDescription:     { fontSize: 11, color: "#6b7280", lineHeight: 16, marginBottom: 6 },
  farmRow:                { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  farmText:               { fontSize: 11, color: "#6b7280", marginLeft: 4, flex: 1 },
  priceRow:               { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceText:              { fontSize: 14, fontWeight: "bold", color: "#10b981" },
  unitText:               { fontSize: 11, fontWeight: "normal", color: "#6b7280" },
  addButton:              { backgroundColor: "#10b981", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, gap: 4 },
  addButtonText:          { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Empty states
  noResults:              { alignItems: "center", paddingVertical: 40 },
  noResultsText:          { fontSize: 16, color: "#9ca3af", marginTop: 12, fontWeight: "500" },
  clearFilters:           { marginTop: 8, color: "#10b981", fontWeight: "600" },

  // Modal
  modalOverlay:           { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet:             { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", paddingBottom: 32 },
  modalHandle:            { width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, alignSelf: "center", marginTop: 12 },
  modalHeader:            { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  modalTitleRow:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  modalTitle:             { fontSize: 18, fontWeight: "bold", color: "#111827" },
  modalClose:             { padding: 4 },

  // Cart items
  cartList:               { paddingHorizontal: 20, paddingTop: 8 },
  cartItem:               { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", gap: 12 },
  cartItemImage:          { width: 56, height: 56, borderRadius: 10 },
  cartItemInfo:           { flex: 1 },
  cartItemName:           { fontSize: 14, fontWeight: "600", color: "#111827" },
  cartItemPrice:          { fontSize: 14, fontWeight: "700", color: "#10b981", marginTop: 2 },
  cartItemUnit:           { fontSize: 11, color: "#9ca3af" },
  qtyControl:             { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f9fafb", borderRadius: 8, padding: 4 },
  qtyBtn:                 { width: 28, height: 28, borderRadius: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  qtyText:                { fontSize: 14, fontWeight: "600", color: "#111827", minWidth: 20, textAlign: "center" },
  removeBtn:              { padding: 4 },

  // Cart summary
  cartSummary:            { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  summaryRow:             { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel:           { fontSize: 14, color: "#6b7280" },
  summaryValue:           { fontSize: 14, fontWeight: "500", color: "#111827" },
  totalRow:               { paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb", marginBottom: 16 },
  totalLabel:             { fontSize: 16, fontWeight: "bold", color: "#111827" },
  totalValue:             { fontSize: 18, fontWeight: "bold", color: "#10b981" },
  checkoutBtn:            { backgroundColor: "#10b981", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, borderRadius: 12, gap: 8 },
  checkoutText:           { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // Empty cart/wishlist
  emptyCart:              { alignItems: "center", paddingVertical: 48 },
  emptyCartText:          { fontSize: 18, fontWeight: "600", color: "#374151", marginTop: 16 },
  emptyCartSub:           { fontSize: 14, color: "#9ca3af", marginTop: 6 },
});