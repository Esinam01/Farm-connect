import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProductCard({
  product,
  compact,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) {
  return (
    <View style={[styles.productCard, compact && styles.productCardCompact]}>
      <View style={styles.productImageContainer}>
        <Image source={product.image} style={styles.productImage} />
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
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>
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
          <Text style={styles.farmText} numberOfLines={1}>
            {product.farm}
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>
            ${product.price.toFixed(2)}
            <Text style={styles.unitText}>{product.unit}</Text>
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onAddToCart(product)}
          >
            <Ionicons name="cart-outline" size={14} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: {
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  productCardCompact: { width: "48%", marginRight: 0 },
  productImageContainer: { position: "relative" },
  productImage: { width: "100%", height: 100 },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 5,
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
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  productInfo: { padding: 12 },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
    marginBottom: 4,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  ratingText: { fontSize: 12, color: "#374151", marginLeft: 4 },
  stockText: { fontSize: 11, color: "#6b7280", marginLeft: 8 },
  productDescription: {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 16,
    marginBottom: 6,
  },
  farmRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  farmText: { fontSize: 11, color: "#6b7280", marginLeft: 4, flex: 1 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: { fontSize: 14, fontWeight: "bold", color: "#10b981" },
  unitText: { fontSize: 11, fontWeight: "normal", color: "#6b7280" },
  addButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
