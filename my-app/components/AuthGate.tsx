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
            <Text style={styles.message}>Sign in and create account are turned off for now.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
              <Text style={styles.primaryText}>Continue as guest</Text>
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
  primaryBtn: { backgroundColor: "#0f9d58", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700" },
});
