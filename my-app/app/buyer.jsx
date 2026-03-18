import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const products = [
  {
    id: 1,
    name: "Organic Tomatoes",
    rating: 4.8,
    stock: 150,
    description: "Fresh, organic tomatoes picked daily",
    farm: "Green Valley Farm, California",
    price: "$4.99",
    unit: "/lb",
    image: "https://images.unsplash.com/photo-1546470427-227c7369a9b9?w=300",
    featured: true,
    organic: true,
  },
  {
    id: 2,
    name: "Fresh Apples",
    rating: 4.9,
    stock: 200,
    description: "Crisp and sweet apples from local orchards",
    farm: "Sunrise Orchards, Washington",
    price: "$3.49",
    unit: "/lb",
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300",
    featured: true,
    organic: true,
  },
  {
    id: 3,
    name: "Free-Range Eggs",
    rating: 5,
    stock: 120,
    description: "Organic eggs from happy free range chickens",
    farm: "Hilltop Farm, Vermont",
    price: "$6.99",
    unit: "/dozen",
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300",
    featured: true,
    organic: true,
  },
  {
    id: 4,
    name: "Honey",
    rating: 4.9,
    stock: 95,
    description: "Raw, unfiltered local honey",
    farm: "Prairie Fields, Kansas",
    price: "$12.99",
    unit: "/jar",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300",
    featured: true,
    organic: true,
  },
  {
    id: 5,
    name: "Farm Fresh Milk",
    rating: 4.7,
    stock: 75,
    description: "Fresh whole milk from grass fed cows",
    farm: "Happy Cow Dairy, Wisconsin",
    price: "$5.99",
    unit: "/gallon",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300",
    featured: false,
    organic: true,
  },
];

const categories = ["All", "Vegetables", "Fruits", "Dairy", "Grains"];

export default function BuyerScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    router.replace("/");
  };

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
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="heart-outline" size={22} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="cart" size={20} color="#fff" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>2</Text>
            </View>
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
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trending Banner */}
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
            <TouchableOpacity style={styles.shopNowButton}>
              <Text style={styles.shopNowText}>Shop Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.learnMoreButton}>
              <Text style={styles.learnMoreText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={18} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Featured Products</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {products.filter(p => p.featured).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ScrollView>
        </View>

        {/* Browse by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
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
        </View>

        {/* All Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Products</Text>
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard key={`all-${product.id}`} product={product} compact />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ProductCard({ product, compact }) {
  return (
    <View style={[styles.productCard, compact && styles.productCardCompact]}>
      <View style={styles.productImageContainer}>
        <Image source={{ uri: product.image }} style={styles.productImage} />
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
        <Text style={styles.productName}>{product.name}</Text>
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
            {product.price}
            <Text style={styles.unitText}>{product.unit}</Text>
          </Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="cart-outline" size={14} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoIcon: {
    width: 36,
    height: 36,
    backgroundColor: "#10b981",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
  },
  logoSubtext: {
    fontSize: 11,
    color: "#6b7280",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
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
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  profileButton: {
    marginLeft: 4,
  },
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
  },
  content: {
    flex: 1,
  },
  banner: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#10b981",
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  trendingBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  trendingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
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
  bannerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  shopNowButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopNowText: {
    color: "#10b981",
    fontWeight: "600",
  },
  learnMoreButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  learnMoreText: {
    color: "#fff",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 6,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  categoryChipSelected: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  categoryChipText: {
    color: "#374151",
    fontWeight: "500",
  },
  categoryChipTextSelected: {
    color: "#fff",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  productCard: {
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  productCardCompact: {
    width: "48%",
    marginRight: 0,
  },
  productImageContainer: {
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 100,
  },
  productBadges: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    gap: 4,
  },
  featuredBadge: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  organicBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#374151",
    marginLeft: 4,
  },
  stockText: {
    fontSize: 11,
    color: "#6b7280",
    marginLeft: 8,
  },
  productDescription: {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 16,
    marginBottom: 6,
  },
  farmRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  farmText: {
    fontSize: 11,
    color: "#6b7280",
    marginLeft: 4,
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10b981",
  },
  unitText: {
    fontSize: 11,
    fontWeight: "normal",
    color: "#6b7280",
  },
  addButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});