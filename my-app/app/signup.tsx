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

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("buyer");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const roles = [
    { id: "buyer", label: "Buyer", icon: "person-outline" },
    { id: "seller", label: "Seller", icon: "storefront-outline" },
  ];

  const handleSignUp = () => {
    console.log("[v0] Sign-up attempted with:", { fullName, email, selectedRole });

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (!agreeToTerms) {
      Alert.alert("Error", "Please agree to the terms and conditions");
      return;
    }

    console.log("[v0] Sign-up validation passed, account created");
    Alert.alert("Success", "Account created! Please log in.", [
      {
        text: "OK",
        onPress: () => router.replace("/"),
      },
    ]);
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
          Join our community of farmers and consumers
        </Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <Text style={styles.benefitText}>Fresh Farm Products</Text>
          </View>
          <View style={styles.benefitItem}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <Text style={styles.benefitText}>Direct Support</Text>
          </View>
          <View style={styles.benefitItem}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <Text style={styles.benefitText}>Secure & Trusted</Text>
          </View>
        </View>
      </View>

      {/* Sign Up Form Section */}
      <View style={styles.formSection}>
        <Text style={styles.welcomeText}>Create Account</Text>
        <Text style={styles.subtitleText}>Join FarmConnect today</Text>

        {/* Full Name Input */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#9ca3af"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />

        {/* Email Input */}
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

        {/* Password Input */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Confirm Password Input */}
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          placeholderTextColor="#9ca3af"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {/* Role Selection */}
        <Text style={styles.label}>Join as</Text>
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

        {/* Terms & Conditions */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
          >
            {agreeToTerms && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </TouchableOpacity>
          <Text style={styles.termsText}>
            I agree to the{" "}
            <Text style={styles.termsLink}>Terms & Conditions</Text>
          </Text>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Text style={styles.loginLink}>Sign in</Text>
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
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitItem: {
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
  benefitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
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
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  termsText: {
    color: "#6b7280",
    fontSize: 13,
    flex: 1,
  },
  termsLink: {
    color: "#059669",
    fontWeight: "600",
  },
  signUpButton: {
    backgroundColor: "#10b981",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#6b7280",
  },
  loginLink: {
    color: "#059669",
    fontWeight: "600",
  },
});