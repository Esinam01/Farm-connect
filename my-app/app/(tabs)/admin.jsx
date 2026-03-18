import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const recentActivities = [
  {
    id: 1,
    title: "New order placed",
    time: "2 minutes ago",
    icon: "checkmark-circle",
    color: "#10b981",
    bgColor: "#ecfdf5",
  },
  {
    id: 2,
    title: "New user registered",
    time: "1 hour ago",
    icon: "person-add",
    color: "#3b82f6",
    bgColor: "#eff6ff",
  },
  {
    id: 3,
    title: "Product added by seller",
    time: "3 hours ago",
    icon: "cube",
    color: "#d946ef",
    bgColor: "#fdf2f8",
  },
];

const platformStats = [
  { label: "Active Users", percentage: 75, color: "#10b981" },
  { label: "Organic Products", percentage: 88, color: "#3b82f6" },
];

const tabs = ["Overview", "Users", "Products", "Orders"];

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState("Overview");

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
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive,
              ]}
            >
              {tab === "Overview" && (
                <Ionicons name="trending-up" size={16} color={activeTab === tab ? "#fff" : "#9ca3af"} />
              )}
              {tab === "Users" && (
                <Ionicons name="people" size={16} color={activeTab === tab ? "#fff" : "#9ca3af"} />
              )}
              {tab === "Products" && (
                <Ionicons name="cube" size={16} color={activeTab === tab ? "#fff" : "#9ca3af"} />
              )}
              {tab === "Orders" && (
                <Ionicons name="receipt" size={16} color={activeTab === tab ? "#fff" : "#9ca3af"} />
              )}
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {/* Total Users */}
          <View style={[styles.statCard, styles.usersCard]}>
            <Ionicons name="people" size={28} color="#fff" />
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statValue}>4</Text>
          </View>

          {/* Total Products */}
          <View style={[styles.statCard, styles.productsCard]}>
            <Ionicons name="cube" size={28} color="#fff" />
            <Text style={styles.statLabel}>Total Products</Text>
            <Text style={styles.statValue}>8</Text>
          </View>

          {/* Total Orders */}
          <View style={[styles.statCard, styles.ordersCard]}>
            <Ionicons name="receipt" size={28} color="#fff" />
            <Text style={styles.statLabel}>Total Orders</Text>
            <Text style={styles.statValue}>3</Text>
          </View>

          {/* Revenue */}
          <View style={[styles.statCard, styles.revenueCard]}>
            <Ionicons name="trending-up" size={28} color="#fff" />
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>$157</Text>
          </View>
        </View>

        {/* Content Grid */}
        <View style={styles.contentGrid}>
          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivities.map((activity) => (
              <View
                key={activity.id}
                style={[styles.activityItem, { backgroundColor: activity.bgColor }]}
              >
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: activity.color },
                  ]}
                >
                  <Ionicons
                    name={activity.icon}
                    size={16}
                    color="#fff"
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Platform Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform Stats</Text>
            {platformStats.map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <View style={styles.statItemHeader}>
                  <Text style={styles.statItemLabel}>{stat.label}</Text>
                  <Text style={styles.statItemPercentage}>{stat.percentage}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: stat.color, width: `${stat.percentage}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f3ff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#c026d3",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  tabsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "transparent",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#c026d3",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
  },
  tabTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  usersCard: {
    backgroundColor: "#0ea5e9",
  },
  productsCard: {
    backgroundColor: "#10b981",
  },
  ordersCard: {
    backgroundColor: "#d946ef",
  },
  revenueCard: {
    backgroundColor: "#ff6b35",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 10,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  contentGrid: {
    gap: 20,
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 14,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  activityTime: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statItem: {
    marginBottom: 16,
  },
  statItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statItemLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  statItemPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
});