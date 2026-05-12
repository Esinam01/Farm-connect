import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  useAdminApprovalState,
  requestAdminApproval,
  resetAdminApprovalState,
} from "@/lib/admin-approval-store";

interface AdminAccessModalProps {
  visible: boolean;
  onClose: () => void;
  onApprovalSuccess: () => void;
}

export default function AdminAccessModal({
  visible,
  onClose,
  onApprovalSuccess,
}: AdminAccessModalProps) {
  const approvalState = useAdminApprovalState();
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [manualApproveUrl, setManualApproveUrl] = useState<string | null>(null);
  const [showManualOption, setShowManualOption] = useState(false);

  // Handle approval success
  useEffect(() => {
    if (approvalState.approved && visible) {
      // Wait a moment to show success state
      const timer = setTimeout(() => {
        onApprovalSuccess();
        resetAdminApprovalState();
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [approvalState.approved, visible]);

  const handleRequestApproval = async () => {
    setRequestInProgress(true);
    try {
      const result = await requestAdminApproval();

      if (!result.ok) {
        Alert.alert("Error", result.message);
        setRequestInProgress(false);
        return;
      }

      // If fallback mode (SMTP not configured), show manual approval URL
      if (result.fallback && result.approveUrl) {
        setManualApproveUrl(result.approveUrl);
        setShowManualOption(true);
      }

      setRequestInProgress(false);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to request admin approval");
      setRequestInProgress(false);
    }
  };

  const handleCopyApproveUrl = async () => {
    if (manualApproveUrl) {
      // In a real app, use Clipboard.setStringAsync()
      // For now, just show an alert
      Alert.alert(
        "Approval URL",
        "Visit this URL to approve: " + manualApproveUrl
      );
    }
  };

  const handleCancel = () => {
    resetAdminApprovalState();
    setShowManualOption(false);
    setManualApproveUrl(null);
    onClose();
  };

  const isApproved = approvalState.status === "approved";
  const isDenied = approvalState.status === "denied";
  const hasError = approvalState.status === "error";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name={
                  isApproved
                    ? "checkmark-circle"
                    : isDenied
                    ? "close-circle"
                    : hasError
                    ? "alert-circle"
                    : "shield-checkmark"
                }
                size={32}
                color={
                  isApproved ? "#10b981" : isDenied || hasError ? "#ef4444" : "#059669"
                }
              />
            </View>
            <Text style={styles.headerTitle}>
              {isApproved
                ? "Admin Access Granted"
                : isDenied
                ? "Request Denied"
                : hasError
                ? "Error"
                : "Request Admin Access"}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {approvalState.status === "idle" && (
              <>
                <Text style={styles.subtitle}>
                  To access the admin dashboard, an approval request will be sent to
                  marydoo211@gmail.com
                </Text>
                <View style={styles.infoBox}>
                  <Ionicons name="mail-outline" size={20} color="#059669" />
                  <Text style={styles.infoText}>
                    An email with an approval link will be sent immediately
                  </Text>
                </View>
              </>
            )}

            {approvalState.status === "requesting" && (
              <>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={styles.subtitle}>Sending approval request...</Text>
              </>
            )}

            {approvalState.status === "pending" && (
              <>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={styles.subtitle}>Waiting for admin approval...</Text>
                <Text style={styles.description}>
                  An email was sent to marydoo211@gmail.com. Check your email and click
                  the approval link.
                </Text>
                {showManualOption && manualApproveUrl && (
                  <View style={styles.manualApprovalBox}>
                    <Text style={styles.manualLabel}>
                      Or use this link (if email not received):
                    </Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={handleCopyApproveUrl}
                    >
                      <Ionicons name="copy" size={16} color="#059669" />
                      <Text style={styles.copyButtonText}>Copy Approval Link</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {isApproved && (
              <>
                <Text style={styles.subtitle}>
                  Your admin access has been approved!
                </Text>
                <Text style={styles.description}>
                  You can now log in to the admin dashboard.
                </Text>
              </>
            )}

            {isDenied && (
              <Text style={styles.description}>
                Your admin access request was denied. Please contact support if you
                believe this is an error.
              </Text>
            )}

            {hasError && (
              <Text style={[styles.description, styles.errorText]}>
                {approvalState.errorMessage ||
                  "An error occurred while requesting admin access."}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {approvalState.status === "idle" && (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleRequestApproval}
                  disabled={requestInProgress}
                >
                  <Text style={styles.primaryButtonText}>
                    {requestInProgress ? "Sending..." : "Send Approval Request"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {approvalState.status === "pending" && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel & Exit</Text>
              </TouchableOpacity>
            )}

            {(isApproved || isDenied || hasError) && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={isApproved ? onApprovalSuccess : handleCancel}
              >
                <Text style={styles.primaryButtonText}>
                  {isApproved ? "Go to Admin Dashboard" : "Close"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    maxWidth: 400,
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  errorText: {
    color: "#dc2626",
  },
  content: {
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  infoText: {
    fontSize: 13,
    color: "#047857",
    marginLeft: 12,
    flex: 1,
  },
  manualApprovalBox: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  manualLabel: {
    fontSize: 12,
    color: "#b45309",
    marginBottom: 8,
    fontWeight: "500",
  },
  copyButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  copyButtonText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "500",
    marginLeft: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#059669",
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
