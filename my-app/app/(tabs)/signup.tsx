import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, Link } from "expo-router";
import { registerUser } from "../../lib/auth-store";
import { CreateNewUser } from "@/backend/actions";

export default function SignUpScreen() {
  const { role: initialRole } = useLocalSearchParams<{
    role?: "buyer" | "seller";
  }>();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">(initialRole || "buyer");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation and Toast states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "fullName") {
      if (!value.trim()) error = "Full name is required";
    } else if (name === "email") {
      if (!value.trim()) error = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(value))
        error = "Please enter a valid email";
    } else if (name === "password") {
      if (!value) error = "Password is required";
      else if (value.length < 6)
        error = "Password must be at least 6 characters";
    } else if (name === "confirmPassword") {
      if (value !== password) error = "Passwords do not match";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).every((k) => !newErrors[k]);
  };

  const handleSignUp = async () => {
    // console.log("Sign up button pressed", {
    //   fullName,
    //   email,
    //   password,
    //   confirmPassword,
    //   role,
    // });

    if (!validate()) {
      showToast("Please correct the errors in the form");
      return;
    }

    setLoading(true);
    try {
      await registerUser(email, fullName, password, role);

      showToast("Account created successfully!", "success");
      setTimeout(() => router.replace("/"), 1500);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Could not create account";
      showToast(msg, "error");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#0f9d58" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="person-add" size={40} color="#fff" />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                {role === "seller" ? "Seller Portal" : "Join the Community"}
              </Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.fullName && styles.inputError,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    validateField("fullName", val);
                  }}
                />
              </View>
              {errors.fullName ? (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View
                style={[styles.inputWrapper, errors.email && styles.inputError]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    validateField("email", val);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Join As</Text>
              <View style={styles.roleToggle}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    role === "buyer" && styles.roleOptionActive,
                  ]}
                  onPress={() => setRole("buyer")}
                >
                  <Ionicons
                    name="cart-outline"
                    size={18}
                    color={role === "buyer" ? "#fff" : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      role === "buyer" && styles.roleTextActive,
                    ]}
                  >
                    Buyer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    role === "seller" && styles.roleOptionActive,
                  ]}
                  onPress={() => setRole("seller")}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={18}
                    color={role === "seller" ? "#fff" : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      role === "seller" && styles.roleTextActive,
                    ]}
                  >
                    Seller
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    validateField("password", val);
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.confirmPassword && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    validateField("confirmPassword", val);
                  }}
                  secureTextEntry={!showPassword}
                />
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/Login" asChild>
                <TouchableOpacity>
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>

        {toast && (
          <View
            style={[
              styles.toast,
              toast.type === "error" ? styles.toastError : styles.toastSuccess,
            ]}
          >
            <Ionicons
              name={
                toast.type === "error" ? "alert-circle" : "checkmark-circle"
              }
              size={20}
              color="#fff"
            />
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0f9d58",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#0f9d58",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#0f172a",
    // Remove default web focus outline (cast to any for TS)
    ...(Platform.OS === "web" && ({ outlineStyle: "none" } as any)),
  },
  eyeIcon: {
    padding: 8,
  },
  roleToggle: {
    flexDirection: "row",
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  roleOptionActive: {
    backgroundColor: "#0f9d58",
    borderColor: "#0f9d58",
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  roleTextActive: {
    color: "#fff",
  },
  signUpButton: {
    backgroundColor: "#0f9d58",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    elevation: 4,
    // Use boxShadow for web to avoid deprecation warning
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 4px 8px rgba(15, 157, 88, 0.3)" }
      : {
          shadowColor: "#0f9d58",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }),
    zIndex: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    color: "#64748b",
    fontSize: 15,
  },
  signInText: {
    color: "#0f9d58",
    fontSize: 15,
    fontWeight: "700",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
  toast: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "#334155",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 1000,
  },
  toastError: {
    backgroundColor: "#ef4444",
  },
  toastSuccess: {
    backgroundColor: "#0f9d58",
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
});
