import { Alert, Platform } from "react-native";

/**
 * Cross-platform alert. Mirrors Alert.alert's signature:
 * showAlert(title, message, buttons)
 *
 * On native: delegates straight to Alert.alert.
 * On web: uses window.confirm/alert since there's no native dialog,
 * and maps your buttons' onPress handlers accordingly.
 */
export function showAlert(title, message, buttons) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web fallback
  const text = message ? `${title}\n\n${message}` : title;

  // No buttons, or a single "OK"-style button → window.alert
  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  // Two buttons → window.confirm (OK/Cancel semantics)
  if (buttons.length === 2) {
    const confirmed = window.confirm(text);
    const confirmBtn = buttons.find((b) => b.style !== "cancel") ?? buttons[1];
    const cancelBtn = buttons.find((b) => b.style === "cancel") ?? buttons[0];
    if (confirmed) {
      confirmBtn?.onPress?.();
    } else {
      cancelBtn?.onPress?.();
    }
    return;
  }

  // 3+ buttons: window.confirm can't represent this well.
  // Fall back to alert + running the first non-cancel button's action.
  window.alert(text);
  const firstAction = buttons.find((b) => b.style !== "cancel");
  firstAction?.onPress?.();
}