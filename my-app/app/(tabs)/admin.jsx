import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const recentActivities = [
  { id: 1, title: "New order placed", time: "2 minutes ago", icon: "checkmark-circle", color: "#10b981", bgColor: "#ecfdf5" },
  { id: 2, title: "New user registered", time: "1 hour ago", icon: "person-add", color: "#3b82f6", bgColor: "#eff6ff" },
  { id: 3, title: "Product added by seller", time: "3 hours ago", icon: "cube", color: "#d946ef", bgColor: "#fdf2f8" },
];

const platformStats = [
  { label: "Active Users", percentage: 75, color: "#10b981" },
  { label: "Organic Products", percentage: 88, color: "#3b82f6" },
];

const mockUsers = [
  { id: 1, name: "John Buyer", email: "john@example.com", role: "buyer", status: "active" },
  { id: 2, name: "Green Valley Farm", email: "seller1@farm.com", role: "seller", status: "active" },
  { id: 3, name: "Jane Smith", email: "jane@example.com", role: "buyer", status: "active" },
  { id: 4, name: "Sunrise Orchards", email: "sunrise@farm.com", role: "seller", status: "suspended" },
];

const mockProducts = [
  { id: 1, name: "Organic Tomatoes", price: "$4.99/lb", stock: 150, seller: "Green Valley Farm", category: "Vegetables", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=60&h=60&fit=crop" },
  { id: 2, name: "Fresh Apples", price: "$3.49/lb", stock: 200, seller: "Sunrise Orchards", category: "Fruits", image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=60&h=60&fit=crop" },
  { id: 3, name: "Farm Fresh Milk", price: "$5.99/gallon", stock: 75, seller: "Happy Cow Dairy", category: "Dairy", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=60&h=60&fit=crop" },
  { id: 4, name: "Free Range Eggs", price: "$6.49/dozen", stock: 120, seller: "Sunrise Orchards", category: "Poultry", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=60&h=60&fit=crop" },
];

const mockOrders = [
  { id: "#1001", customer: "John Buyer", total: "$45.99", date: "2025-12-08", payment: "card", status: "Delivered" },
  { id: "#1002", customer: "Jane Smith", total: "$78.50", date: "2025-12-09", payment: "mobile", status: "Processing" },
  { id: "#1003", customer: "John Buyer", total: "$32.99", date: "2025-12-10", payment: "cash", status: "Pending" },
];

const tabs = ["Overview", "Users", "Products", "Orders"];

// ─── Badge helpers ─────────────────────────────────────────────────────────────

const roleBadgeStyle = (role) =>
  role === "seller"
    ? { bg: "#dcfce7", text: "#16a34a" }
    : { bg: "#dbeafe", text: "#1d4ed8" };

const statusBadgeStyle = (status) => {
  switch (status) {
    case "active":    return { bg: "#dcfce7", text: "#16a34a" };
    case "suspended": return { bg: "#fee2e2", text: "#dc2626" };
    case "Delivered": return { bg: "#dcfce7", text: "#16a34a" };
    case "Processing":return { bg: "#fef9c3", text: "#ca8a04" };
    case "Pending":   return { bg: "#f3f4f6", text: "#6b7280" };
    default:          return { bg: "#f3f4f6", text: "#6b7280" };
  }
};

const categoryBadgeStyle = () => ({ bg: "#dcfce7", text: "#16a34a" });

const paymentBadgeStyle = () => ({ bg: "#dbeafe", text: "#1d4ed8" });

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, bg, text }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      <View style={styles.divider} />
    </View>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ users, setUsers }) {
  const handleBan = (id) => {
    Alert.alert(
      "Confirm Action",
      "Are you sure you want to toggle this user's status?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "destructive",
          onPress: () =>
            setUsers((prev) =>
              prev.map((u) =>
                u.id === id
                  ? { ...u, status: u.status === "active" ? "suspended" : "active" }
                  : u
              )
            ),
        },
      ]
    );
  };

  return (
    <View style={styles.tabContent}>
      <SectionHeader title="User Management" subtitle="Manage all platform users" />

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Name</Text>
        <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Email</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: "center" }]}>Role</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: "center" }]}>Status</Text>
        <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: "center" }]}>Action</Text>
      </View>

      {users.map((user, index) => (
        <View
          key={user.id}
          style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
        >
          <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={[styles.tableCell, styles.emailCell, { flex: 2.5 }]} numberOfLines={1}>
            {user.email}
          </Text>
          <View style={{ flex: 1.2, alignItems: "center" }}>
            <Badge
              label={user.role}
              {...roleBadgeStyle(user.role)}
            />
          </View>
          <View style={{ flex: 1.2, alignItems: "center" }}>
            <Badge
              label={user.status}
              {...statusBadgeStyle(user.status)}
            />
          </View>
          <View style={{ flex: 0.8, alignItems: "center" }}>
            <TouchableOpacity onPress={() => handleBan(user.id)}>
              <Ionicons
                name={user.status === "active" ? "ban" : "checkmark-circle"}
                size={22}
                color={user.status === "active" ? "#ef4444" : "#10b981"}
              />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({ products, setProducts }) {
  const handleDelete = (id) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setProducts((prev) => prev.filter((p) => p.id !== id)),
        },
      ]
    );
  };

  const handleEdit = (product) => {
    Alert.alert("Edit Product", `Editing: ${product.name}\n(Connect to your edit modal here)`);
  };

  return (
    <View style={styles.tabContent}>
      <SectionHeader title="Product Management" subtitle="All products across platform" />

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Product</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Price</Text>
        <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: "center" }]}>Stock</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>Seller</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: "center" }]}>Category</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Actions</Text>
      </View>

      {products.map((product, index) => (
        <View
          key={product.id}
          style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
        >
          {/* Product with image */}
          <View style={[styles.productCell, { flex: 2.5 }]}>
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              defaultSource={{ uri: "https://via.placeholder.com/40" }}
            />
            <Text style={styles.tableCell} numberOfLines={2}>
              {product.name}
            </Text>
          </View>

          <Text style={[styles.tableCell, { flex: 1.5 }]}>{product.price}</Text>

          <Text style={[styles.tableCell, { flex: 0.8, textAlign: "center" }]}>
            {product.stock}
          </Text>

          <Text style={[styles.tableCell, styles.sellerCell, { flex: 1.8 }]} numberOfLines={2}>
            {product.seller}
          </Text>

          <View style={{ flex: 1.5, alignItems: "center" }}>
            <Badge label={product.category} {...categoryBadgeStyle()} />
          </View>

          <View style={[styles.actionButtons, { flex: 1 }]}>
            <TouchableOpacity onPress={() => handleEdit(product)} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={16} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(product.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function OrdersTab({ orders, setOrders }) {
  const handleStatusChange = (id, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  const handleViewDetails = (order) => {
    Alert.alert(
      `Order ${order.id}`,
      `Customer: ${order.customer}\nTotal: ${order.total}\nDate: ${order.date}\nPayment: ${order.payment}\nStatus: ${order.status}`
    );
  };

  return (
    <View style={styles.tabContent}>
      <SectionHeader title="Order Management" subtitle="Track and manage all orders" />

      {orders.map((order, index) => (
        <View
          key={order.id}
          style={[styles.orderCard, index % 2 === 0 && styles.tableRowAlt]}
        >
          {/* Row 1: ID, Customer, Total */}
          <View style={styles.orderRow}>
            <Text style={styles.orderId}>{order.id}</Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
              {order.customer}
            </Text>
            <Text style={styles.orderTotal}>{order.total}</Text>
          </View>

          {/* Row 2: Date, Payment badge, Status badge, View Details */}
          <View style={styles.orderRowSecond}>
            <Text style={styles.orderDate}>{order.date}</Text>

            <Badge label={order.payment} {...paymentBadgeStyle()} />

            {/* Status selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.statusScroll}
            >
              {ORDER_STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => handleStatusChange(order.id, s)}
                  style={[
                    styles.statusChip,
                    order.status === s && {
                      backgroundColor: statusBadgeStyle(s).bg,
                      borderColor: statusBadgeStyle(s).text,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      order.status === s && { color: statusBadgeStyle(s).text, fontWeight: "600" },
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={() => handleViewDetails(order)}>
              <Text style={styles.viewDetails}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [users, setUsers] = useState(mockUsers);
  const [products, setProducts] = useState(mockProducts);
  const [orders, setOrders] = useState(mockOrders);

  const handleLogout = () => {
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Manage your platform</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>marydoo211</Text>
            <Text style={styles.userRole}>Administrator</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              {tab === "Overview"  && <Ionicons name="trending-up" size={16} color={activeTab === tab ? "#fff" : "#9ca3af"} />}
              {tab === "Users"    && <Ionicons name="people"       size={16} color={activeTab === tab ? "#fff" : "#9ca3af"} />}
              {tab === "Products" && <Ionicons name="cube"         size={16} color={activeTab === tab ? "#fff" : "#9ca3af"} />}
              {tab === "Orders"   && <Ionicons name="receipt"      size={16} color={activeTab === tab ? "#fff" : "#9ca3af"} />}
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Overview ── */}
        {activeTab === "Overview" && (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.usersCard]}>
                <Ionicons name="people" size={28} color="#fff" />
                <Text style={styles.statLabel}>Total Users</Text>
                <Text style={styles.statValue}>{users.length}</Text>
              </View>
              <View style={[styles.statCard, styles.productsCard]}>
                <Ionicons name="cube" size={28} color="#fff" />
                <Text style={styles.statLabel}>Total Products</Text>
                <Text style={styles.statValue}>{products.length}</Text>
              </View>
              <View style={[styles.statCard, styles.ordersCard]}>
                <Ionicons name="receipt" size={28} color="#fff" />
                <Text style={styles.statLabel}>Total Orders</Text>
                <Text style={styles.statValue}>{orders.length}</Text>
              </View>
              <View style={[styles.statCard, styles.revenueCard]}>
                <Ionicons name="trending-up" size={28} color="#fff" />
                <Text style={styles.statLabel}>Revenue</Text>
                <Text style={styles.statValue}>$157</Text>
              </View>
            </View>

            <View style={styles.contentGrid}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {recentActivities.map((activity) => (
                  <View key={activity.id} style={[styles.activityItem, { backgroundColor: activity.bgColor }]}>
                    <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
                      <Ionicons name={activity.icon} size={16} color="#fff" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Platform Stats</Text>
                {platformStats.map((stat) => (
                  <View key={stat.label} style={styles.statItem}>
                    <View style={styles.statItemHeader}>
                      <Text style={styles.statItemLabel}>{stat.label}</Text>
                      <Text style={styles.statItemPercentage}>{stat.percentage}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { backgroundColor: stat.color, width: `${stat.percentage}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── Users ── */}
        {activeTab === "Users" && (
          <UsersTab users={users} setUsers={setUsers} />
        )}

        {/* ── Products ── */}
        {activeTab === "Products" && (
          <ProductsTab products={products} setProducts={setProducts} />
        )}

        {/* ── Orders ── */}
        {activeTab === "Orders" && (
          <OrdersTab orders={orders} setOrders={setOrders} />
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#f5f3ff" },

  // Header
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: "#c026d3" },
  headerLeft:       { flexDirection: "row", alignItems: "center", flex: 1 },
  logoIcon:         { width: 44, height: 44, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  headerTitle:      { fontSize: 18, fontWeight: "bold", color: "#fff" },
  headerSubtitle:   { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  headerRight:      { flexDirection: "row", alignItems: "center", gap: 12 },
  userInfo:         { alignItems: "flex-end" },
  userName:         { fontSize: 14, fontWeight: "600", color: "#fff" },
  userRole:         { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  logoutButton:     { width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, justifyContent: "center", alignItems: "center" },

  // Tabs
  tabsContainer:    { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tabsContent:      { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab:              { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "transparent", gap: 6 },
  tabActive:        { backgroundColor: "#c026d3" },
  tabText:          { fontSize: 14, fontWeight: "500", color: "#9ca3af" },
  tabTextActive:    { color: "#fff" },

  // Content
  content:          { flex: 1, padding: 16 },

  // Overview stats
  statsGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statCard:         { width: "48%", padding: 16, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  usersCard:        { backgroundColor: "#0ea5e9" },
  productsCard:     { backgroundColor: "#10b981" },
  ordersCard:       { backgroundColor: "#d946ef" },
  revenueCard:      { backgroundColor: "#ff6b35" },
  statLabel:        { fontSize: 12, color: "rgba(255,255,255,0.9)", marginTop: 10, fontWeight: "500" },
  statValue:        { fontSize: 28, fontWeight: "bold", color: "#fff", marginTop: 4 },
  contentGrid:      { gap: 20, marginBottom: 20 },
  section:          { backgroundColor: "#fff", borderRadius: 14, padding: 16 },
  sectionTitle:     { fontSize: 16, fontWeight: "bold", color: "#111827", marginBottom: 14 },
  activityItem:     { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 10 },
  activityIcon:     { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 12 },
  activityContent:  { flex: 1 },
  activityTitle:    { fontSize: 14, fontWeight: "600", color: "#111827" },
  activityTime:     { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statItem:         { marginBottom: 16 },
  statItemHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  statItemLabel:    { fontSize: 14, fontWeight: "500", color: "#374151" },
  statItemPercentage: { fontSize: 14, fontWeight: "600", color: "#111827" },
  progressBarContainer: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, overflow: "hidden" },
  progressBar:      { height: "100%", borderRadius: 3 },

  // Shared tab content
  tabContent:       { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 20 },
  sectionHeader:    { marginBottom: 16 },
  sectionSubtitle:  { fontSize: 13, color: "#6b7280", marginTop: 2 },
  divider:          { height: 1, backgroundColor: "#e5e7eb", marginTop: 12 },

  // Table
  tableHeader:      { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 4, backgroundColor: "#f9fafb", borderRadius: 8, marginBottom: 4 },
  tableHeaderCell:  { fontSize: 12, fontWeight: "700", color: "#374151", flex: 1 },
  tableRow:         { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tableRowAlt:      { backgroundColor: "#fafafa" },
  tableCell:        { fontSize: 13, color: "#111827", flex: 1 },
  emailCell:        { color: "#6b7280", fontSize: 12 },
  sellerCell:       { color: "#6b7280", fontSize: 12 },

  // Badge
  badge:            { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText:        { fontSize: 11, fontWeight: "600" },

  // Product cell
  productCell:      { flexDirection: "row", alignItems: "center", gap: 8 },
  productImage:     { width: 38, height: 38, borderRadius: 8, backgroundColor: "#f3f4f6" },

  // Action buttons
  actionButtons:    { flexDirection: "row", gap: 8, justifyContent: "center" },
  editBtn:          { padding: 4 },
  deleteBtn:        { padding: 4 },

  // Order card
  orderCard:        { paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", gap: 8 },
  orderRow:         { flexDirection: "row", alignItems: "center", gap: 8 },
  orderId:          { fontSize: 13, fontWeight: "700", color: "#374151", width: 54 },
  orderTotal:       { fontSize: 14, fontWeight: "700", color: "#10b981" },
  orderRowSecond:   { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "nowrap" },
  orderDate:        { fontSize: 12, color: "#6b7280", width: 88 },
  statusScroll:     { flex: 1, maxHeight: 32 },
  statusChip:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", marginRight: 4 },
  statusChipText:   { fontSize: 11, color: "#9ca3af" },
  viewDetails:      { fontSize: 12, color: "#c026d3", fontWeight: "600" },
});