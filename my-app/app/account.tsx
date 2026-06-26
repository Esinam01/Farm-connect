import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  logout,
  updateCurrentUserPassword,
  updateCurrentUserProfile,
  useCurrentRole,
  useUser,
  useAuthStore,
  supabase,
  deleteAccount,
} from "../lib/auth-store";
import BottomNav from "../components/BottomNav";

const SUPPORT_PHONE = "+233240000000";
const SUPPORT_EMAIL = "support@farmconnect.app";

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AccountScreen() {
  const user = useUser();
  const currentRole = useCurrentRole();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "help">(
    "profile"
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const { initialized } = useAuthStore.useState();
  const isGuest = !user;

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    if (field === "currentPassword") {
      if (!value) newErrors.currentPassword = "Current password is required";
      else delete newErrors.currentPassword;
    }

    if (field === "newPassword") {
      if (!value) newErrors.newPassword = "New password is required";
      else if (value.length < 6)
        newErrors.newPassword = "Must be at least 6 characters";
      else delete newErrors.newPassword;
    }

    if (field === "newPassword") {
      if (!value) newErrors.newPassword = "New password is required";
      else if (value.length < 6)
        newErrors.newPassword = "Must be at least 6 characters";
      else if (value === currentPassword)
        newErrors.newPassword =
          "New password must differ from current password";
      else delete newErrors.newPassword;
    }

    if (field === "confirmPassword") {
      if (!value) newErrors.confirmPassword = "Please confirm your password";
      else if (value !== newPassword)
        newErrors.confirmPassword = "Passwords do not match";
      else delete newErrors.confirmPassword;
    }

    setErrors(newErrors);
  };

  useEffect(() => {
    if (isGuest) {
      return;
    }

    setFullName(user.fullName ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setAddress(user.address ?? "");
    setAvatarUri(user.avatarUri ?? null);
    setMemberSince(
      new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })
    );
  }, [isGuest, user]);

  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <ActivityIndicator size="large" color="#0f9d58" />
        <Text style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>
          Loading account...
        </Text>
      </View>
    );
  }

  if (isGuest) {
    return (
      <ScrollView
        contentContainerStyle={styles.guestContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.guestHero}>
          <View style={styles.guestAvatarWrap}>
            <Ionicons name="person-circle-outline" size={80} color="#0f9d58" />
          </View>
          <Text style={styles.guestTitle}>My Account</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to view your profile, track orders, and manage your account.
          </Text>

          <TouchableOpacity
            style={styles.buyerButton}
            onPress={() => router.push("/Login")}
          >
            <Text style={styles.buyerButtonText}>Sign In as Buyer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sellerButton}
            onPress={() => router.push("/Login")}
          >
            <Text style={styles.sellerButtonText}>Sign In as Seller</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.createAccountLink}>New to FarmConnect?</Text>
            <Text style={styles.createAccountLinkBold}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const initials = buildInitials(user.fullName || user.email);

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow photo library access to change your profile image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setUploadingImage(true);
      const selectedUri = result.assets[0].uri;
      setAvatarUri(selectedUri);
      await updateCurrentUserProfile({ avatarUri: selectedUri });
    } catch (error) {
      Alert.alert(
        "Image Error",
        error instanceof Error ? error.message : "Failed to pick image"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Validation", "Please complete all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Validation", "New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Validation", "New passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      await updateCurrentUserPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      Alert.alert("Updated", "Your password has been changed.");
    } catch (error) {
      Alert.alert(
        "Password Error",
        error instanceof Error ? error.message : "Could not update password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (isEditing) {
      try {
        setSavingProfile(true);
        await updateCurrentUserProfile({
          fullName,
          phone,
          address,
          // bio is not in User type yet, but we can add it or just ignore for now
        });
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully!");
      } catch (error) {
        Alert.alert(
          "Update Error",
          error instanceof Error ? error.message : "Could not update profile"
        );
      } finally {
        setSavingProfile(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleLogout = async () => {
    console.log("Sign out button pressed");
    try {
      await logout();

      const session = await supabase.auth.getSession();

      console.log("After logout session:", session.data.session);

      router.replace("/Login");
    } catch (err) {
      console.error(err);
    }
    // Alert.alert("Sign Out", "Are you sure you want to sign out?", [
    //   { text: "Cancel", style: "cancel" },
    //   {
    //     text: "Sign Out",
    //     style: "destructive",
    //     onPress: async () => {
    //       try {
    //         await logout();

    //         const session = await supabase.auth.getSession();

    //         console.log("After logout session:", session.data.session);

    //         router.replace("/Login");
    //       } catch (err) {
    //         console.error(err);
    //       }
    //     },
    //   },
    // ]);
  };

  const handleAccountDelete = async () => {
    console.log("Delete button pressed");
    
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.loggedInContainer}>
      {/* Green Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Account</Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <TouchableOpacity
              onPress={() => Alert.alert("Settings", "Settings coming soon")}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.replace("/")}
        >
          <Ionicons name="home-outline" size={18} color="#fff" />
          <Text style={styles.browseButtonText}>Browse Marketplace</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "profile" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("profile")}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={activeTab === "profile" ? "#0f9d58" : "#94a3b8"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "profile" && styles.tabTextActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "password" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("password")}
        >
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={activeTab === "password" ? "#0f9d58" : "#94a3b8"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "password" && styles.tabTextActive,
            ]}
          >
            Password
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "help" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("help")}
        >
          <Ionicons
            name="help-circle-outline"
            size={20}
            color={activeTab === "help" ? "#0f9d58" : "#94a3b8"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "help" && styles.tabTextActive,
            ]}
          >
            Help
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <View>
            {/* Avatar Section */}
            <View style={styles.profileHero}>
              <TouchableOpacity
                style={styles.profileAvatarWrap}
                onPress={pickImage}
                activeOpacity={0.85}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.profileAvatarImage}
                  />
                ) : (
                  <View style={styles.profileAvatarFallback}>
                    <Text style={styles.profileAvatarFallbackText}>
                      {initials || "U"}
                    </Text>
                  </View>
                )}
                <View style={styles.profileAvatarEditBadge}>
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={12} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <Text style={styles.profileName}>{user.fullName}</Text>
              <View style={styles.profileRolePill}>
                <Ionicons
                  name={
                    currentRole === "seller"
                      ? "storefront-outline"
                      : "cart-outline"
                  }
                  size={13}
                  color="#fff"
                />
                <Text style={styles.profileRolePillText}>{currentRole}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: "#10b981" }]}>
                  <Ionicons name="bag-outline" size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>23</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: "#3b82f6" }]}>
                  <Ionicons name="heart-outline" size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Wishlist</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: "#d946ef" }]}>
                  <Ionicons name="star-outline" size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>340</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>

            {/* Profile Information */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Profile Information</Text>
                <TouchableOpacity
                  onPress={handleProfileUpdate}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#0f9d58" />
                  ) : (
                    <Ionicons
                      name={
                        isEditing
                          ? "checkmark-circle-outline"
                          : "pencil-outline"
                      }
                      size={22}
                      color="#0f9d58"
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color="#94a3b8" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.editInput}
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {fullName || "Not provided"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={[styles.infoValue, { color: "#94a3b8" }]}>
                    {email || "Not provided"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color="#94a3b8" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.editInput}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {phone || "Not provided"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color="#94a3b8" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Location</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.editInput}
                      value={address}
                      onChangeText={setAddress}
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {address || "Not provided"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="chatbubble-outline" size={18} color="#94a3b8" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Bio</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.editInput}
                      value={bio}
                      onChangeText={setBio}
                      multiline
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {bio || "Not provided"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color="#94a3b8" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>{memberSince}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#b91c1c" />
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <View style={styles.card}>
            <View style={styles.passwordHeader}>
              <View style={styles.passwordIconBox}>
                <Ionicons name="book-outline" size={28} color="#fff" />
              </View>
              <View>
                <Text style={styles.passwordTitle}>Password & Security</Text>
                <Text style={styles.passwordSubtitle}>
                  Manage your password and security settings
                </Text>
              </View>
            </View>

            <View style={styles.passwordFields}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.currentPassword && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        flex: 1,
                        borderWidth: 0,
                        backgroundColor: "transparent",
                      },
                    ]}
                    value={currentPassword}
                    onChangeText={(val) => {
                      setCurrentPassword(val);
                      validateField("currentPassword", val);
                    }}
                    placeholder="Enter current password"
                    placeholderTextColor="#94a3b8"
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
                {errors.currentPassword ? (
                  <Text style={styles.errorText}>{errors.currentPassword}</Text>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>New Password</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.newPassword && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        flex: 1,
                        borderWidth: 0,
                        backgroundColor: "transparent",
                      },
                    ]}
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      validateField("newPassword", val);
                    }}
                    placeholder="Enter new password"
                    placeholderTextColor="#94a3b8"
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
                {errors.newPassword ? (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.confirmPassword && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        flex: 1,
                        borderWidth: 0,
                        backgroundColor: "transparent",
                      },
                    ]}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      validateField("confirmPassword", val);
                    }}
                    placeholder="Confirm new password"
                    placeholderTextColor="#94a3b8"
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
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
              </View>

              <Text style={styles.passwordHint}>
                Password must be at least 6 characters
              </Text>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  savingPassword && styles.buttonDisabled,
                ]}
                onPress={handlePasswordUpdate}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.securityOptions}>
              <Text style={styles.securityTitle}>Security Options</Text>
              <Text style={styles.securityText}>
                Two-factor authentication coming soon
              </Text>
            </View>
          </View>
        )}

        {/* Help Tab */}
        {activeTab === "help" && (
          <View style={styles.card}>
            <Text style={styles.helpTitle}>Help & Support</Text>
            <Text style={styles.helpSubtitle}>
              Get assistance and find answers
            </Text>

            <TouchableOpacity style={styles.helpRow}>
              <View style={[styles.helpIcon, { backgroundColor: "#3b82f6" }]}>
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              </View>
              <View style={styles.helpContent}>
                <Text style={styles.helpRowTitle}>Live Chat Support</Text>
                <Text style={styles.helpRowSubtitle}>
                  Get instant help from our team
                </Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpRow}>
              <View style={[styles.helpIcon, { backgroundColor: "#10b981" }]}>
                <Ionicons name="mail-outline" size={20} color="#fff" />
              </View>
              <View style={styles.helpContent}>
                <Text style={styles.helpRowTitle}>Email Support</Text>
                <Text style={styles.helpRowSubtitle}>{SUPPORT_EMAIL}</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpRow}>
              <View style={[styles.helpIcon, { backgroundColor: "#8b5cf6" }]}>
                <Ionicons name="call-outline" size={20} color="#fff" />
              </View>
              <View style={styles.helpContent}>
                <Text style={styles.helpRowTitle}>Phone Support</Text>
                <Text style={styles.helpRowSubtitle}>{SUPPORT_PHONE}</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpRow}>
              <View style={[styles.helpIcon, { backgroundColor: "#f59e0b" }]}>
                <Ionicons name="book-outline" size={20} color="#fff" />
              </View>
              <View style={styles.helpContent}>
                <Text style={styles.helpRowTitle}>User Guide</Text>
                <Text style={styles.helpRowSubtitle}>
                  Learn how to use FarmConnect
                </Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleAccountDelete}
            >
              <Ionicons name="log-out-outline" size={18} color="#b91c1c" />
              <Text style={styles.logoutButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  // Guest Styles
  guestContainer: {
    flexGrow: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    padding: 20,
  },
  guestHero: {
    alignItems: "center",
    gap: 16,
  },
  guestAvatarWrap: {
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  buyerButton: {
    width: "100%",
    backgroundColor: "#0f9d58",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buyerButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  sellerButton: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0f9d58",
  },
  sellerButtonText: {
    color: "#0f9d58",
    fontSize: 15,
    fontWeight: "800",
  },
  createAccountLink: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  createAccountLinkBold: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f9d58",
    textAlign: "center",
  },

  // Logged In Styles
  loggedInContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#0f9d58",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  browseButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#0f9d58",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  tabTextActive: {
    color: "#0f9d58",
    fontWeight: "800",
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 120,
  },

  // Profile Tab Styles
  profileHero: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#ecfdf5",
    borderRadius: 20,
    paddingVertical: 20,
  },
  profileAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  profileAvatarImage: {
    width: "100%",
    height: "100%",
  },
  profileAvatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#bbf7d0",
  },
  profileAvatarFallbackText: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "800",
  },
  profileAvatarEditBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0f9d58",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  profileRolePill: {
    backgroundColor: "#0f9d58",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  profileRolePillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },

  // Password Tab Styles
  passwordHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  passwordIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#d946ef",
    alignItems: "center",
    justifyContent: "center",
  },
  passwordTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  passwordSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  passwordFields: {
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
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
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
    fontSize: 15,
  },
  editInput: {
    fontSize: 15,
    color: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#0f9d58",
    paddingVertical: 4,
    marginTop: 2,
  },
  eyeIcon: {
    padding: 8,
  },
  signupText: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 12,
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#0f9d58",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  securityOptions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  securityText: {
    fontSize: 12,
    color: "#94a3b8",
  },

  // Help Tab Styles
  helpTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  helpSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
  },
  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  helpIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  helpContent: {
    flex: 1,
  },
  helpRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  helpRowSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    marginTop: 12,
  },
  logoutButtonText: {
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: "800",
  },
});
