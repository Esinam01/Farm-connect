import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const products = [
  {
    id: 1,
    name: "Organic Tomatoes",
    price: "$4.99/lb",
    stock: 150,
    sold: 450,
    revenue: "$2245.50",
  },
  {
    id: 2,
    name: "Mixed Vegetables",
    price: "$8.99/basket",
    stock: 80,
    sold: 220,
    revenue: "$1977.80",
  },
];

export default function SellerScreen() {
  const handleLogout = () => {
    router.replace("/");
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
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {/* Total Revenue Card */}
          <View style={[styles.statCard, styles.revenueCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Total Revenue</Text>
              <View style={styles.statIconContainer}>
                <Ionicons name="cash-outline" size={20} color="#fff" />
              </View>
            </View>
            <Text style={styles.statValue}>$4223.30</Text>
            <Text style={styles.statChange}>+12% from last month</Text>
          </View>

          {/* Products Sold Card */}
          <View style={[styles.statCard, styles.soldCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Products Sold</Text>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up" size={20} color="#fff" />
              </View>
            </View>
            <Text style={styles.statValue}>670</Text>
            <Text style={styles.statChange}>+8% from last month</Text>
          </View>

          {/* Active Products Card */}
          <View style={[styles.statCard, styles.activeCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Active Products</Text>
              <View style={styles.statIconContainer}>
                <Ionicons name="pricetag-outline" size={20} color="#fff" />
              </View>
            </View>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statChange}>Listed products</Text>
          </View>
        </View>

        {/* Add New Product Button */}
        <TouchableOpacity style={styles.addProductButton}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addProductText}>Add New Product</Text>
        </TouchableOpacity>

        {/* My Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Products</Text>
            <Text style={styles.sectionSubtitle}>Manage your product listings</Text>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.productCol]}>Product</Text>
            <Text style={[styles.tableHeaderText, styles.priceCol]}>Price</Text>
            <Text style={[styles.tableHeaderText, styles.stockCol]}>Stock</Text>
            <Text style={[styles.tableHeaderText, styles.soldCol]}>Sold</Text>
            <Text style={[styles.tableHeaderText, styles.revenueCol]}>Revenue</Text>
            <Text style={[styles.tableHeaderText, styles.actionsCol]}>Actions</Text>
          </View>

          {/* Table Rows */}
          {products.map((product) => (
            <View key={product.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.productCol, styles.productName]}>
                {product.name}
              </Text>
              <Text style={[styles.tableCell, styles.priceCol]}>{product.price}</Text>
              <Text style={[styles.tableCell, styles.stockCol, styles.cyanText]}>
                {product.stock}
              </Text>
              <Text style={[styles.tableCell, styles.soldCol, styles.cyanText]}>
                {product.sold}
              </Text>
              <Text style={[styles.tableCell, styles.revenueCol, styles.greenText]}>
                {product.revenue}
              </Text>
              <View style={[styles.actionsCol, styles.actionsContainer]}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="pencil-outline" size={18} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#10b981",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoIcon: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationButton: {
    padding: 8,
  },
  userInfo: {
    alignItems: "flex-end",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  userRole: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  logoutButton: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  revenueCard: {
    backgroundColor: "#10b981",
  },
  soldCard: {
    backgroundColor: "#06b6d4",
  },
  activeCard: {
    backgroundColor: "#d946ef",
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  statIconContainer: {
    opacity: 0.8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statChange: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 20,
    gap: 8,
  },
  addProductText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  productsSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableCell: {
    fontSize: 13,
    color: "#374151",
  },
  productCol: {
    flex: 2.5,
  },
  priceCol: {
    flex: 1.5,
  },
  stockCol: {
    flex: 1,
  },
  soldCol: {
    flex: 1,
  },
  revenueCol: {
    flex: 1.5,
  },
  actionsCol: {
    flex: 1.2,
  },
  productName: {
    color: "#10b981",
    fontWeight: "500",
  },
  cyanText: {
    color: "#06b6d4",
    fontWeight: "500",
  },
  greenText: {
    color: "#10b981",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});