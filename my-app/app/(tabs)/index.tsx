import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useBuyerSignedUp, fetchProducts } from "../../lib/market-store";
import BottomNav from "../../components/BottomNav";
import { useAuthStore } from "../../lib/auth-store";
import { FetchAllProducts, Product } from "@/backend/actions";
import ProductCard from "@/components/ProductCard";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const featurePills = ["100% Fresh", "Farm Direct", "Fast Delivery"];
const categories = ["All", "Vegetables", "Fruits", "Dairy"];

export default function HomeScreen() {
  const updates: {
    id: number;
    title: string;
    time: string;
    icon: IconName;
    tint: string;
    background: string;
  }[] = [
    {
      id: 1,
      title: "Organic produce prices up 15% this week due to high demand",
      time: "2h ago",
      icon: "trending-up",
      tint: "#16a34a",
      background: "#ecfdf5",
    },
    {
      id: 2,
      title: "Perfect weather for spring planting starting next week",
      time: "5h ago",
      icon: "cloud-outline",
      tint: "#2563eb",
      background: "#eff6ff",
    },
    {
      id: 3,
      title: "New delivery routes now cover three more local farms",
      time: "1d ago",
      icon: "location-outline",
      tint: "#f59e0b",
      background: "#fff7ed",
    },
  ];

  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<Product[]>([]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { initialized } = useAuthStore.useState();
  const buyerSignedUp = useBuyerSignedUp();

  const handleSearchNavigate = () => {
    const query = searchQuery.trim();
    router.push(
      query ? { pathname: "/explore", params: { query } } : "/explore"
    );
  };

  // Initial data fetch

  const getProducts = async () => {
    try {
      const data = await FetchAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

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

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity ?? 1) + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleLeafTap = () => {
    // Hidden leaf tap functionality removed for real role-based auth
  };

  const featuredCount = products.filter((p) => p.featured).length;

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
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: "#0f9d58",
            borderRadius: 40,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Ionicons name="leaf" size={40} color="#fff" />
        </View>
        <ActivityIndicator size="large" color="#0f9d58" />
        <Text style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>
          Loading FarmConnect...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.topRow}>
              <View style={styles.brandBlock}>
                <TouchableOpacity
                  style={styles.logoIcon}
                  onPress={handleLeafTap}
                >
                  <Ionicons name="leaf" size={22} color="#fff" />
                </TouchableOpacity>
                <View>
                  <Text style={styles.brandTitle}>FarmConnect</Text>
                  <Text style={styles.brandSubtitle}>
                    Fresh from Farm to You
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.alertButton}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroText}>
              Discover fresh produce from local farms nearby.
            </Text>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for fresh products..."
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={handleSearchNavigate}
              />
              <TouchableOpacity
                onPress={handleSearchNavigate}
                style={styles.searchGoButton}
              >
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.pillRow}>
              {featurePills.map((pill) => (
                <View key={pill} style={styles.featurePill}>
                  <Ionicons name="checkmark" size={13} color="#fff" />
                  <Text style={styles.featurePillText}>{pill}</Text>
                </View>
              ))}
            </View>

            {/* Admin status messages removed */}
          </View>

          <View style={styles.sectionSpacing}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {categories.map((category) => {
                const active = selectedCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                      styles.categoryChip,
                      active && styles.categoryChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        active && styles.categoryTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.weatherCard}>
            <View style={styles.weatherHeader}>
              <View>
                <Text style={styles.weatherLabel}>Your Area</Text>
                <Text style={styles.weatherTemp}>
                  72° <Text style={styles.weatherUnit}>F</Text>
                </Text>
                <Text style={styles.weatherState}>Partly Cloudy</Text>
              </View>
              <Ionicons
                name="partly-sunny-outline"
                size={52}
                color="rgba(255,255,255,0.75)"
              />
            </View>
            <View style={styles.weatherMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="water-outline" size={14} color="#e0f2fe" />
                <Text style={styles.metaText}>65% humidity</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="navigate-outline" size={14} color="#e0f2fe" />
                <Text style={styles.metaText}>8 mph wind</Text>
              </View>
            </View>
          </View>

          <View style={styles.updatesSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="newspaper-outline" size={18} color="#16a34a" />
              <Text style={styles.sectionTitle}>Latest Updates</Text>
            </View>

            {updates.map((update) => (
              <View key={update.id} style={styles.updateCard}>
                <View
                  style={[
                    styles.updateIcon,
                    { backgroundColor: update.background },
                  ]}
                >
                  <Ionicons name={update.icon} size={16} color={update.tint} />
                </View>
                <View style={styles.updateBody}>
                  <Text style={styles.updateText}>{update.title}</Text>
                  <Text style={styles.updateTime}>{update.time}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.productsSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.productsTitle}>Fresh Products</Text>
                <Text style={styles.productsSubtitle}>
                  {featuredCount} items available
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedCategory("All")}>
                <Text style={styles.clearFilterText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filteredSection}>
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
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} compact />
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
    overflow: "hidden",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 132,
  },
  hero: {
    backgroundColor: "#0f9d58",
    borderRadius: 28,
    padding: 18,
    shadowColor: "#064e3b",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 5,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    color: "#d1fae5",
    marginTop: 2,
    fontSize: 12,
  },
  alertButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    color: "#ecfdf5",
    fontSize: 18,
    lineHeight: 26,
    marginTop: 18,
    marginBottom: 16,
    maxWidth: 280,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: "#0f172a",
    fontSize: 14,
  },
  searchGoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    gap: 6,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  filteredSection: {
    width: "100%",
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
  featurePillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  adminPendingPill: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  adminPendingText: {
    fontSize: 12,
    color: "#14532d",
    fontWeight: "700",
  },
  adminErrorText: {
    marginTop: 10,
    color: "#fecaca",
    fontSize: 11,
    lineHeight: 16,
    maxWidth: 300,
  },
  sectionSpacing: {
    marginTop: 16,
  },
  categoryRow: {
    gap: 10,
    paddingRight: 6,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#eef2f7",
  },
  categoryChipActive: {
    backgroundColor: "#16a34a",
  },
  categoryText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#fff",
  },
  weatherCard: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: "#0d8ce0",
    padding: 16,
  },
  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  weatherLabel: {
    color: "#dbeafe",
    fontSize: 12,
    marginBottom: 6,
  },
  weatherTemp: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 46,
  },
  weatherUnit: {
    fontSize: 16,
    fontWeight: "500",
  },
  weatherState: {
    color: "#eff6ff",
    fontSize: 15,
    marginTop: 4,
  },
  weatherMeta: {
    flexDirection: "row",
    gap: 18,
    marginTop: 18,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#eff6ff",
    fontSize: 12,
    fontWeight: "600",
  },
  updatesSection: {
    marginTop: 18,
    gap: 12,
  },
  productsSection: {
    marginTop: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  productsTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
  },
  productsSubtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  clearFilterText: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: "700",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    paddingBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  productImageWrap: {
    height: 118,
    padding: 10,
    justifyContent: "space-between",
    position: "relative",
  },
  productBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    alignSelf: "flex-end",
    backgroundColor: "#16a34a",
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    backgroundColor: "#d1fae5",
  },
  productName: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 12,
    marginTop: 10,
  },
  productMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    marginTop: 5,
  },
  productMetaText: {
    color: "#64748b",
    fontSize: 11,
  },
  productBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 10,
  },
  productPrice: {
    color: "#16a34a",
    fontSize: 16,
    fontWeight: "800",
  },
  productUnit: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "700",
  },
  updateCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    alignItems: "flex-start",
    gap: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  updateIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  updateBody: {
    flex: 1,
  },
  updateText: {
    color: "#1f2937",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  updateTime: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 6,
  },
  navBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  navIconWrap: {
    width: 36,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconWrapActive: {
    backgroundColor: "#16a34a",
  },
  navLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  navLabelActive: {
    color: "#16a34a",
  },
});
