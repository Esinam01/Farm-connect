import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function LoginScreen() {
  const [selectedRole, setSelectedRole] = useState("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const roles = [
    { id: "buyer", label: "Buyer", icon: "person-outline" },
    { id: "seller", label: "Seller", icon: "storefront-outline" },
    { id: "admin", label: "Admin", icon: "shield-checkmark-outline" },
  ];

  const features = [
    "100% Fresh Products",
    "Direct from Farm",
    "Support Local Farmers",
  ];

  const handleSubmit = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    
    // Navigate based on selected role
    if (selectedRole === "buyer") {
      router.push("/buyer");
    } else if (selectedRole === "seller") {
      router.push("/seller");
    } else if (selectedRole === "admin") {
      router.push("/admin");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Branding Section */}
      <View style={styles.brandingSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="leaf" size={28} color="#fff" />
          </View>
          <Text style={styles.logoText}>FarmConnect</Text>
        </View>

        <Text style={styles.tagline}>
          Connecting farmers and consumers for a sustainable future
        </Text>

        <View style={styles.featuresContainer}>
          {features.map((feature) => (
            <View key={feature} style={styles.featureItem}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.testimonial}>
          <Text style={styles.testimonialText}>
            "FarmConnect has transformed how we reach customers. Our sales have
            increased by 300%!"
          </Text>
          <Text style={styles.testimonialAuthor}>- Sarah, Green Valley Farm</Text>
        </View>
      </View>

      {/* Login Form Section */}
      <View style={styles.formSection}>
        <Text style={styles.welcomeText}>Welcome Back</Text>
        <Text style={styles.subtitleText}>
          Select your role and sign in to continue
        </Text>

        <Text style={styles.label}>Login as</Text>
        <View style={styles.roleContainer}>
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                onPress={() => setSelectedRole(role.id)}
                style={[
                  styles.roleButton,
                  isSelected && styles.roleButtonSelected,
                ]}
              >
                <Ionicons
                  name={role.icon}
                  size={24}
                  color={isSelected ? "#fff" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.roleLabel,
                    isSelected && styles.roleLabelSelected,
                  ]}
                >
                  {role.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
          </Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#059669",
  },
  brandingSection: {
    padding: 24,
    paddingTop: 60,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  logoIcon: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  tagline: {
    fontSize: 18,
    color: "#d1fae5",
    lineHeight: 26,
    marginBottom: 24,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkCircle: {
    width: 32,
    height: 32,
    backgroundColor: "rgba(52, 211, 153, 0.3)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  testimonial: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  testimonialText: {
    color: "#ecfdf5",
    fontStyle: "italic",
    marginBottom: 8,
    lineHeight: 22,
  },
  testimonialAuthor: {
    color: "#fff",
    fontWeight: "600",
  },
  formSection: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitleText: {
    color: "#6b7280",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  roleButtonSelected: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  roleLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  roleLabelSelected: {
    color: "#fff",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#10b981",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signUpText: {
    color: "#6b7280",
  },
  signUpLink: {
    color: "#059669",
    fontWeight: "600",
  },
});