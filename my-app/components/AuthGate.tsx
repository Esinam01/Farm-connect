import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type Props = {
  role: "buyer" | "seller";
};

export default function AuthGate({ role }: Props) {
  const subtitle = role === "seller" ? "Seller Portal" : "Buyer Access";

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name={role === "seller" ? "storefront" : "person-circle"} size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.title}>Access Paused</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.message}>
              Join FarmConnect to start {role === "seller" ? "selling your produce" : "buying fresh from farms"}.
            </Text>
            
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => router.push("/Login")}
            >
              <Text style={styles.primaryText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryBtn} 
              onPress={() => router.push({ pathname: "/signup", params: { role } })}
            >
              <Text style={styles.secondaryText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.guestBtn} 
              onPress={() => router.back()}
            >
              <Text style={styles.guestText}>Continue as guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 10,
  },
  header: {
    backgroundColor: "#0f9d58",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginRight: 8 },
  title: { color: "#fff", fontWeight: "800", fontSize: 16 },
  subtitle: { color: "#d1fae5", fontSize: 12, fontWeight: "600" },
  closeBtn: { padding: 6 },
  body: { padding: 18, alignItems: "stretch" },
  message: { color: "#334155", fontSize: 14, textAlign: "center", marginBottom: 14 },
  primaryBtn: { backgroundColor: "#0f9d58", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: { backgroundColor: "#fff", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#0f9d58" },
  secondaryText: { color: "#0f9d58", fontWeight: "700", fontSize: 15 },
  guestBtn: { paddingVertical: 10, alignItems: "center" },
  guestText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
});
