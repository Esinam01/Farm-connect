import { useEffect, useMemo, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMarketProducts } from "../../lib/market-store";
import BottomNav from "../../components/BottomNav";
import { useAuthStore } from "../../lib/auth-store";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Dairy", "Grains"];

type SearchCardProduct = ReturnType<typeof useMarketProducts>[number];

type SearchCardProps = {
  product: SearchCardProduct;
  onOpen: () => void;
};

function SearchCard({ product, onOpen }: SearchCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onOpen}>
      <Image source={{ uri: product.image }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {product.name}
          </Text>
          {product.organic ? (
            <View style={styles.organicBadge}>
              <Ionicons name="leaf" size={10} color="#fff" />
              <Text style={styles.badgeText}>Organic</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.cardMeta} numberOfLines={1}>
          {product.farm}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {product.description}
        </Text>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardPrice}>${product.price.toFixed(2)}</Text>
            <Text style={styles.cardUnit}>per {product.unit.replace("/", "")}</Text>
          </View>
          <TouchableOpacity style={styles.openButton} onPress={onOpen}>
            <Text style={styles.openButtonText}>Open</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const params = useLocalSearchParams();
  const initialQuery = Array.isArray(params.query) ? params.query[0] : params.query;
  const products = useMarketProducts();
  const { initialized } = useAuthStore.useState();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (typeof initialQuery === "string") {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.farm.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleNavigateToBuyer = (query?: string) => {
    const nextQuery = (query ?? searchQuery).trim();
    router.push(nextQuery ? { pathname: "/buyer", params: { search: nextQuery } } : "/buyer");
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Search Products</Text>
            <Text style={styles.headerSubtitle}>{filteredProducts.length} results ready to browse</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search farms, products, categories..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => handleNavigateToBuyer()}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{category}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroTitle}>Find something fresh</Text>
              <Text style={styles.heroText}>
                Search products, then jump into the buyer flow with the exact term you used.
              </Text>
            </View>
            <Ionicons name="basket-outline" size={42} color="rgba(255,255,255,0.78)" />
          </View>
          <TouchableOpacity style={styles.heroButton} onPress={() => handleNavigateToBuyer()}>
            <Text style={styles.heroButtonText}>Open Buyer Search</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Results</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={52} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>Try a different keyword or category.</Text>
            <TouchableOpacity style={styles.heroButton} onPress={handleClear}>
              <Text style={styles.heroButtonText}>Clear search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <SearchCard
              key={product.id}
              product={product}
              onOpen={() => handleNavigateToBuyer(product.name)}
            />
          ))
        )}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    padding: 16,
    paddingBottom: 120,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: "#0f172a",
    fontSize: 14,
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
    backgroundColor: "#0f9d58",
  },
  categoryText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 13,
  },
  categoryTextActive: {
    color: "#fff",
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: "#0f9d58",
    padding: 18,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  heroText: {
    color: "#d1fae5",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 260,
  },
  heroButton: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  heroButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  resultsTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  clearText: {
    color: "#0f9d58",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  emptyText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    marginBottom: 12,
  },
  cardImage: {
    width: 110,
    height: 110,
    backgroundColor: "#d1fae5",
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  cardName: {
    flex: 1,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  organicBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0f9d58",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  cardMeta: {
    color: "#0f9d58",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  cardDescription: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  cardPrice: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  cardUnit: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  openButton: {
    backgroundColor: "#0f9d58",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  openButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
});
