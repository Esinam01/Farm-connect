import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useUser } from "../lib/auth-store";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export default function BottomNav() {
  const user = useUser();
  const pathname = usePathname();

  const navItems: { key: string; label: string; icon: IconName; path: string; roles?: string[] }[] = [
    { key: "home", label: "Home", icon: "home", path: "/" },
    { key: "explore", label: "Search", icon: "search", path: "/explore" },
    { key: "buyer", label: "Market", icon: "people-outline", path: "/buyer" },
    { key: "seller", label: "Seller", icon: "storefront-outline", path: "/seller", roles: ["seller", "admin"] },
    { key: "account", label: "Account", icon: "person-circle-outline", path: "/account" },
    { key: "admin", label: "Admin", icon: "shield-checkmark-outline", path: "/admin", roles: ["admin"] },
  ];

  // Filter items based on user role
  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <View style={styles.navBar}>
      {visibleItems.map((item) => {
        const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => router.replace(item.path as any)}
            style={styles.navItem}
            activeOpacity={0.8}
          >
            <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
              <Ionicons name={item.icon} size={20} color={isActive ? "#fff" : "#94a3b8"} />
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
  },
  navLabelActive: {
    color: "#16a34a",
  },
});
