/**
 * FarmAlertSystem.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * All-in-one farm security & intruder alert page.
 *
 * Features:
 *  • Real-time alert feed with severity levels (critical / high / medium / low)
 *  • Pulsing animation for critical active alerts
 *  • Simulate alert (manual trigger — pick zone + severity)
 *  • Dismiss / Resolve individual alerts
 *  • Call Authorities modal (call + SMS each contact)
 *  • Emergency contacts management (add / delete)
 *  • Push notification registration (expo-notifications)
 *  • Local push fired on every new alert
 *  • Arduino/ESP32 backend wiring (notifyBackend stub)
 *  • Alert history with filter tabs
 *  • Stats overview (active, resolved, dismissed, total)
 *  • IoT sensor zone status panel
 *  • Settings panel (sound, vibration, push toggle)
 *
 * Install before use:
 *   npx expo install expo-notifications expo-device
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, Alert, Linking, Animated, Vibration,
  Switch, Platform, KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

// ─── Notification setup ───────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerPush() {
  if (!Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== "granted") return null;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("farm-alerts", {
      name: "Farm Security Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#ef4444",
      sound: true,
    });
  }
  const t = await Notifications.getExpoPushTokenAsync();
  return t.data;
}

async function fireLocalNotification(zone, severity, soundEnabled) {
  const emoji = { critical: "🚨", high: "⚠️", medium: "🔔", low: "📍" }[severity] ?? "🔔";
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} Intruder Alert — ${zone}`,
      body: `${severity.toUpperCase()} threat detected. Tap to respond.`,
      sound: soundEnabled,
      channelId: "farm-alerts",
      data: { zone, severity },
    },
    trigger: null,
  });
}

async function notifyBackend(zone, severity, token) {
  // 🔧 Replace with your real backend URL
  // Your Arduino/ESP32 should POST to the same endpoint.
  try {
    await fetch("https://YOUR_BACKEND_URL/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone, severity, expoPushToken: token, source: "app", timestamp: new Date().toISOString() }),
    });
  } catch (_) { /* silent fail in dev */ }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FARM_ZONES = ["Main Gate", "North Field", "South Perimeter", "Storage Barn", "Greenhouse", "East Fence", "West Field", "Chicken Coop"];

const SEV = {
  critical: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca", dark: "#b91c1c", label: "Critical", icon: "warning"                    },
  high:     { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", dark: "#c2410c", label: "High",     icon: "alert-circle"                },
  medium:   { color: "#eab308", bg: "#fefce8", border: "#fef08a", dark: "#a16207", label: "Medium",   icon: "alert-outline"               },
  low:      { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", dark: "#1d4ed8", label: "Low",      icon: "information-circle-outline"  },
};

const DEFAULT_CONTACTS = [
  { id: 1, name: "Police Emergency", number: "911",         icon: "shield",         color: "#ef4444" },
  { id: 2, name: "Local Police",     number: "311",         icon: "shield-outline", color: "#3b82f6" },
  { id: 3, name: "Farm Security",    number: "+1234567890", icon: "person",         color: "#10b981" },
  { id: 4, name: "Neighbor Watch",   number: "+0987654321", icon: "people",         color: "#8b5cf6" },
];

const SENSOR_ZONES = [
  { id: 1, zone: "Main Gate",       status: "online",  lastCheck: "2m ago"  },
  { id: 2, zone: "North Field",     status: "online",  lastCheck: "1m ago"  },
  { id: 3, zone: "South Perimeter", status: "offline", lastCheck: "12m ago" },
  { id: 4, zone: "Storage Barn",    status: "online",  lastCheck: "3m ago"  },
  { id: 5, zone: "Greenhouse",      status: "online",  lastCheck: "1m ago"  },
  { id: 6, zone: "East Fence",      status: "alert",   lastCheck: "just now"},
];

const SEED_ALERTS = [
  { id: 1, zone: "Main Gate",    severity: "critical", message: "Motion sensor triggered — intruder confirmed at main entrance.", timestamp: new Date(Date.now() - 5   * 60000).toISOString(), status: "active",    source: "sensor" },
  { id: 2, zone: "North Field",  severity: "high",     message: "Perimeter breach detected. Possible intruder on north side.",    timestamp: new Date(Date.now() - 18  * 60000).toISOString(), status: "active",    source: "sensor" },
  { id: 3, zone: "Storage Barn", severity: "medium",   message: "Unexpected movement detected near storage area.",                timestamp: new Date(Date.now() - 2   * 3600000).toISOString(),status: "resolved",  source: "sensor" },
  { id: 4, zone: "East Fence",   severity: "low",      message: "Gate sensor activity — possible animal or wind.",                timestamp: new Date(Date.now() - 5   * 3600000).toISOString(),status: "dismissed", source: "manual" },
  { id: 5, zone: "Greenhouse",   severity: "high",     message: "Door sensor opened outside of scheduled hours.",                 timestamp: new Date(Date.now() - 26  * 3600000).toISOString(),status: "resolved",  source: "sensor" },
];

let _idCtr = 100;
const uid = () => ++_idCtr;

const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + "  ·  " + d.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "dashboard",  label: "Dashboard",  icon: "grid"              },
  { key: "alerts",     label: "Alerts",     icon: "alert-circle"      },
  { key: "sensors",    label: "Sensors",    icon: "wifi"              },
  { key: "contacts",   label: "Contacts",   icon: "call"              },
  { key: "settings",   label: "Settings",   icon: "settings-outline"  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Pulsing dot ───────────────────────────────────────────────────────────────
function PulseDot({ color }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
    return () => anim.stopAnimation();
  }, []);
  return <Animated.View style={[styles.pulseDot, { backgroundColor: color, opacity: anim }]} />;
}

// ── Alert card ────────────────────────────────────────────────────────────────
function AlertCard({ alert, onDismiss, onResolve, onCall }) {
  const cfg = SEV[alert.severity];
  const active = alert.status === "active";

  return (
    <View style={[styles.alertCard, { borderColor: cfg.border, backgroundColor: cfg.bg }, !active && { opacity: 0.6 }]}>
      {/* Header row */}
      <View style={styles.acHeader}>
        <View style={[styles.acIconWrap, { backgroundColor: cfg.color }]}>
          {alert.severity === "critical" && active
            ? <PulseDot color="#fff" />
            : <Ionicons name={cfg.icon} size={16} color="#fff" />}
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.acTitleRow}>
            <Text style={[styles.acZone, { color: cfg.color }]}>{alert.zone}</Text>
            <View style={[styles.acBadge, { backgroundColor: cfg.color }]}>
              <Text style={styles.acBadgeText}>{cfg.label}</Text>
            </View>
          </View>
          <Text style={styles.acMsg}>{alert.message}</Text>
        </View>
      </View>

      {/* Meta */}
      <View style={styles.acMeta}>
        <Ionicons name="time-outline" size={11} color="#9ca3af" />
        <Text style={styles.acMetaText}>{fmtTime(alert.timestamp)}</Text>
        <View style={styles.acDot} />
        <Ionicons name={alert.source === "sensor" ? "wifi" : "hand-left-outline"} size={11} color="#9ca3af" />
        <Text style={styles.acMetaText}>{alert.source === "sensor" ? "Sensor" : "Manual"}</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.acStatus, {
          backgroundColor: active ? "#fef2f2" : alert.status === "resolved" ? "#f0fdf4" : "#f3f4f6"
        }]}>
          <Text style={[styles.acStatusText, {
            color: active ? "#ef4444" : alert.status === "resolved" ? "#10b981" : "#9ca3af"
          }]}>{alert.status}</Text>
        </View>
      </View>

      {/* Actions — active only */}
      {active && (
        <View style={styles.acActions}>
          <TouchableOpacity style={[styles.acBtn, styles.acBtnRed]} onPress={() => onCall(alert)}>
            <Ionicons name="call" size={13} color="#fff" />
            <Text style={[styles.acBtnTxt, { color: "#fff" }]}>Authorities</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.acBtn, styles.acBtnGreen]} onPress={() => onResolve(alert.id)}>
            <Ionicons name="checkmark-circle-outline" size={13} color="#10b981" />
            <Text style={[styles.acBtnTxt, { color: "#10b981" }]}>Resolve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.acBtn, styles.acBtnGray]} onPress={() => onDismiss(alert.id)}>
            <Ionicons name="close-circle-outline" size={13} color="#6b7280" />
            <Text style={[styles.acBtnTxt, { color: "#6b7280" }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function FarmAlertSystem() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [tab,          setTab]          = useState("dashboard");
  const [alerts,       setAlerts]       = useState(SEED_ALERTS);
  const [contacts,     setContacts]     = useState(DEFAULT_CONTACTS);
  const [alertFilter,  setAlertFilter]  = useState("all");
  const [pushToken,    setPushToken]    = useState(null);

  // Modals
  const [callAlert,    setCallAlert]    = useState(null);   // alert obj for call modal
  const [simVisible,   setSimVisible]   = useState(false);
  const [addContact,   setAddContact]   = useState(false);

  // Simulate form
  const [simZone,      setSimZone]      = useState(FARM_ZONES[0]);
  const [simSev,       setSimSev]       = useState("high");

  // Add contact form
  const [cName,        setCName]        = useState("");
  const [cNumber,      setCNumber]      = useState("");

  // Settings
  const [soundOn,      setSoundOn]      = useState(true);
  const [vibOn,        setVibOn]        = useState(true);
  const [pushOn,       setPushOn]       = useState(true);
  const [autoResolve,  setAutoResolve]  = useState(false);

  const notifListener = useRef();
  const respListener  = useRef();

  // ── Push setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pushOn) {
      registerPush().then(t => { if (t) setPushToken(t); });
    }
    notifListener.current = Notifications.addNotificationReceivedListener(n => {
      const d = n.request.content.data;
      if (d?.zone) injectAlert(d.zone, d.severity ?? "high", "sensor");
    });
    respListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      setTab("alerts"); setAlertFilter("active");
    });
    return () => {
      Notifications.removeNotificationSubscription(notifListener.current);
      Notifications.removeNotificationSubscription(respListener.current);
    };
  }, []);

  // ── Inject alert ───────────────────────────────────────────────────────────
  const injectAlert = (zone, severity, source = "manual") => {
    const msgs = {
      critical: `CRITICAL: Intruder confirmed at ${zone}. Immediate response required!`,
      high:     `High severity: Motion detected at ${zone}. Possible intruder.`,
      medium:   `Medium alert: Unusual activity near ${zone}.`,
      low:      `Low alert: Minor sensor activity at ${zone}.`,
    };
    const a = { id: uid(), zone, severity, message: msgs[severity], timestamp: new Date().toISOString(), status: "active", source };
    setAlerts(prev => [a, ...prev]);
    if (vibOn) Vibration.vibrate(severity === "critical" ? [0,400,150,400,150,400] : [0,300]);
    if (pushOn) fireLocalNotification(zone, severity, soundOn);
    notifyBackend(zone, severity, pushToken);
  };

  // ── Alert actions ──────────────────────────────────────────────────────────
  const doResolve  = id => Alert.alert("Resolve", "Mark as resolved?", [{ text: "Cancel", style: "cancel" }, { text: "Resolve", onPress: () => setAlerts(p => p.map(a => a.id === id ? { ...a, status: "resolved"  } : a)) }]);
  const doDismiss  = id => Alert.alert("Dismiss", "Dismiss this alert?", [{ text: "Cancel", style: "cancel" }, { text: "Dismiss", onPress: () => setAlerts(p => p.map(a => a.id === id ? { ...a, status: "dismissed" } : a)) }]);
  const doClearAll = ()  => Alert.alert("Clear History", "Remove all non-active alerts?", [{ text: "Cancel", style: "cancel" }, { text: "Clear", style: "destructive", onPress: () => setAlerts(p => p.filter(a => a.status === "active")) }]);

  // ── Contacts ───────────────────────────────────────────────────────────────
  const doAddContact = () => {
    if (!cName.trim() || !cNumber.trim()) { Alert.alert("Required", "Please fill in both name and number."); return; }
    setContacts(p => [...p, { id: uid(), name: cName.trim(), number: cNumber.trim(), icon: "person-outline", color: "#6366f1" }]);
    setCName(""); setCNumber(""); setAddContact(false);
  };
  const doDeleteContact = id => Alert.alert("Delete", "Remove this contact?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => setContacts(p => p.filter(c => c.id !== id)) }]);

  const doCall = contact => Alert.alert(`Call ${contact.name}?`, contact.number, [{ text: "Cancel", style: "cancel" }, { text: "Call", onPress: () => Linking.openURL(`tel:${contact.number}`).catch(() => Alert.alert("Error", "Cannot place call.")) }]);
  const doSMS  = (contact, alert) => {
    const body = encodeURIComponent(`🚨 FARM ALERT\nZone: ${alert?.zone ?? "Unknown"}\nSeverity: ${(alert?.severity ?? "").toUpperCase()}\n${alert?.message ?? ""}\nTime: ${alert ? fmtTime(alert.timestamp) : ""}`);
    Linking.openURL(`sms:${contact.number}?body=${body}`).catch(() => Alert.alert("Error", "Cannot open messages."));
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeAlerts    = alerts.filter(a => a.status === "active");
  const criticalCount   = activeAlerts.filter(a => a.severity === "critical").length;
  const filteredAlerts  = alertFilter === "all" ? alerts : alerts.filter(a => a.status === alertFilter);

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER TABS
  // ─────────────────────────────────────────────────────────────────────────

  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.tabBody}>
      {/* Critical banner */}
      {criticalCount > 0 && (
        <View style={styles.critBanner}>
          <PulseDot color="#fff" />
          <Text style={styles.critBannerText}>{criticalCount} CRITICAL alert{criticalCount > 1 ? "s" : ""} — immediate action required!</Text>
          <TouchableOpacity onPress={() => { setTab("alerts"); setAlertFilter("active"); }}>
            <Text style={styles.critBannerLink}>View →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stat cards */}
      <View style={styles.statRow}>
        {[
          { label: "Active",    val: activeAlerts.length,                            color: "#ef4444", icon: "alert-circle"      },
          { label: "Resolved",  val: alerts.filter(a => a.status === "resolved").length,  color: "#10b981", icon: "checkmark-circle"  },
          { label: "Dismissed", val: alerts.filter(a => a.status === "dismissed").length, color: "#9ca3af", icon: "close-circle"      },
          { label: "Total",     val: alerts.length,                                  color: "#6366f1", icon: "list"              },
        ].map(s => (
          <TouchableOpacity key={s.label} style={styles.statCard} onPress={() => { setTab("alerts"); setAlertFilter(s.label.toLowerCase()); }}>
            <Ionicons name={s.icon} size={22} color={s.color} />
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLbl}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent active alerts */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionCardTitle}>Active Alerts</Text>
          <TouchableOpacity onPress={() => setTab("alerts")}>
            <Text style={styles.sectionCardLink}>See all</Text>
          </TouchableOpacity>
        </View>
        {activeAlerts.length === 0 ? (
          <View style={styles.emptySmall}>
            <Ionicons name="shield-checkmark-outline" size={36} color="#d1d5db" />
            <Text style={styles.emptySmallText}>Farm is secure</Text>
          </View>
        ) : activeAlerts.slice(0, 3).map(a => (
          <AlertCard key={a.id} alert={a} onDismiss={doDismiss} onResolve={doResolve} onCall={setCallAlert} />
        ))}
      </View>

      {/* Sensor status overview */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionCardTitle}>Sensor Overview</Text>
          <TouchableOpacity onPress={() => setTab("sensors")}>
            <Text style={styles.sectionCardLink}>Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sensorGrid}>
          {SENSOR_ZONES.slice(0, 4).map(s => (
            <View key={s.id} style={[styles.sensorChip, s.status === "alert" && styles.sensorChipAlert, s.status === "offline" && styles.sensorChipOffline]}>
              <Ionicons
                name={s.status === "online" ? "wifi" : s.status === "alert" ? "warning" : "wifi-outline"}
                size={13}
                color={s.status === "online" ? "#10b981" : s.status === "alert" ? "#ef4444" : "#9ca3af"}
              />
              <Text style={[styles.sensorChipText, s.status === "alert" && { color: "#ef4444" }, s.status === "offline" && { color: "#9ca3af" }]} numberOfLines={1}>{s.zone}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: "#ef444415" }]} onPress={() => setSimVisible(true)}>
            <Ionicons name="bug-outline" size={22} color="#ef4444" />
            <Text style={[styles.quickBtnText, { color: "#ef4444" }]}>Simulate Alert</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: "#3b82f615" }]} onPress={() => { setCallAlert(activeAlerts[0] ?? null); }}>
            <Ionicons name="call-outline" size={22} color="#3b82f6" />
            <Text style={[styles.quickBtnText, { color: "#3b82f6" }]}>Call Authorities</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: "#10b98115" }]} onPress={() => setTab("sensors")}>
            <Ionicons name="wifi-outline" size={22} color="#10b981" />
            <Text style={[styles.quickBtnText, { color: "#10b981" }]}>Check Sensors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: "#8b5cf615" }]} onPress={() => doClearAll()}>
            <Ionicons name="trash-outline" size={22} color="#8b5cf6" />
            <Text style={[styles.quickBtnText, { color: "#8b5cf6" }]}>Clear History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  const renderAlerts = () => (
    <View style={{ flex: 1 }}>
      {/* Filter row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {["all", "active", "resolved", "dismissed"].map(f => (
          <TouchableOpacity key={f} onPress={() => setAlertFilter(f)} style={[styles.filterChip, alertFilter === f && styles.filterChipOn]}>
            <Text style={[styles.filterChipText, alertFilter === f && styles.filterChipTextOn]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "active" && activeAlerts.length > 0 ? ` (${activeAlerts.length})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.tabBody} showsVerticalScrollIndicator={false}>
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyBig}>
            <Ionicons name="shield-checkmark-outline" size={60} color="#d1d5db" />
            <Text style={styles.emptyBigText}>No alerts here</Text>
            <Text style={styles.emptyBigSub}>
              {alertFilter === "active" ? "Farm is secure — no active threats." : "Switch filters to see other alerts."}
            </Text>
          </View>
        ) : (
          filteredAlerts.map(a => (
            <AlertCard key={a.id} alert={a} onDismiss={doDismiss} onResolve={doResolve} onCall={setCallAlert} />
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );

  const renderSensors = () => (
    <ScrollView style={styles.tabBody} showsVerticalScrollIndicator={false}>
      {/* Online / offline counts */}
      <View style={styles.sensorSummaryRow}>
        {[
          { label: "Online",  count: SENSOR_ZONES.filter(s => s.status === "online").length,  color: "#10b981" },
          { label: "Alert",   count: SENSOR_ZONES.filter(s => s.status === "alert").length,   color: "#ef4444" },
          { label: "Offline", count: SENSOR_ZONES.filter(s => s.status === "offline").length, color: "#9ca3af" },
        ].map(s => (
          <View key={s.label} style={styles.sensorSumCard}>
            <Text style={[styles.sensorSumVal, { color: s.color }]}>{s.count}</Text>
            <Text style={styles.sensorSumLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.listSectionLabel}>All Sensor Zones</Text>
      {SENSOR_ZONES.map(s => (
        <View key={s.id} style={styles.sensorRow}>
          <View style={[styles.sensorStatusDot, {
            backgroundColor: s.status === "online" ? "#10b981" : s.status === "alert" ? "#ef4444" : "#d1d5db"
          }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sensorRowName}>{s.zone}</Text>
            <Text style={styles.sensorRowTime}>Last checked: {s.lastCheck}</Text>
          </View>
          <View style={[styles.sensorStatusBadge, {
            backgroundColor: s.status === "online" ? "#f0fdf4" : s.status === "alert" ? "#fef2f2" : "#f9fafb",
          }]}>
            <Text style={[styles.sensorStatusBadgeText, {
              color: s.status === "online" ? "#10b981" : s.status === "alert" ? "#ef4444" : "#9ca3af",
            }]}>{s.status}</Text>
          </View>
          {s.status === "alert" && (
            <TouchableOpacity style={styles.sensorAlertBtn} onPress={() => injectAlert(s.zone, "high", "sensor")}>
              <Ionicons name="warning" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Hardware setup guide */}
      <View style={styles.hardwareCard}>
        <View style={styles.hardwareCardHeader}>
          <Ionicons name="hardware-chip-outline" size={20} color="#6366f1" />
          <Text style={styles.hardwareCardTitle}>Connect IoT Hardware</Text>
        </View>
        <Text style={styles.hardwareCardText}>
          Use a <Text style={styles.hardwareBold}>PIR motion sensor</Text> (HC-SR501, ~$3) wired to an <Text style={styles.hardwareBold}>ESP32 or Arduino</Text> with WiFi. When motion is detected, the microcontroller sends a POST request to your backend which pushes the alert here.
        </Text>
        <View style={styles.hardwareSteps}>
          {[
            "Wire PIR sensor OUT pin → GPIO 13 on ESP32",
            "Flash the Arduino sketch (see notificationService.js comments)",
            "Set your WiFi SSID, password, and backend URL in the sketch",
            "Power on the sensor — alerts will fire automatically",
          ].map((step, i) => (
            <View key={i} style={styles.hardwareStep}>
              <View style={styles.hardwareStepNum}><Text style={styles.hardwareStepNumText}>{i + 1}</Text></View>
              <Text style={styles.hardwareStepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  const renderContacts = () => (
    <ScrollView style={styles.tabBody} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.addContactBtn} onPress={() => setAddContact(true)}>
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <Text style={styles.addContactBtnText}>Add Emergency Contact</Text>
      </TouchableOpacity>

      <Text style={styles.listSectionLabel}>Emergency Contacts</Text>
      {contacts.map(c => (
        <View key={c.id} style={styles.contactRow}>
          <View style={[styles.contactRowIcon, { backgroundColor: c.color + "20" }]}>
            <Ionicons name={c.icon} size={20} color={c.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactRowName}>{c.name}</Text>
            <Text style={styles.contactRowNum}>{c.number}</Text>
          </View>
          <View style={styles.contactRowActions}>
            <TouchableOpacity style={[styles.contactActionBtn, { backgroundColor: c.color }]} onPress={() => doCall(c)}>
              <Ionicons name="call" size={14} color="#fff" />
              <Text style={styles.contactActionTxt}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactActionBtn, { backgroundColor: "#f3f4f6" }]} onPress={() => doSMS(c, activeAlerts[0])}>
              <Ionicons name="chatbubble-outline" size={14} color="#374151" />
              <Text style={[styles.contactActionTxt, { color: "#374151" }]}>SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactDeleteBtn} onPress={() => doDeleteContact(c.id)}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={styles.tabBody} showsVerticalScrollIndicator={false}>
      <Text style={styles.listSectionLabel}>Notifications</Text>
      {[
        { label: "Sound alerts",       sub: "Play sound when alert fires",        val: soundOn,     set: setSoundOn     },
        { label: "Vibration",          sub: "Vibrate device on new alert",        val: vibOn,       set: setVibOn       },
        { label: "Push notifications", sub: "Receive alerts when app is closed",  val: pushOn,      set: setPushOn      },
        { label: "Auto-resolve low",   sub: "Automatically resolve low alerts after 1h", val: autoResolve, set: setAutoResolve },
      ].map(s => (
        <View key={s.label} style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>{s.label}</Text>
            <Text style={styles.settingSubLabel}>{s.sub}</Text>
          </View>
          <Switch
            value={s.val}
            onValueChange={s.set}
            trackColor={{ false: "#e5e7eb", true: "#10b981" }}
            thumbColor="#fff"
          />
        </View>
      ))}

      <Text style={[styles.listSectionLabel, { marginTop: 8 }]}>Push Token</Text>
      <View style={styles.tokenCard}>
        <Ionicons name="phone-portrait-outline" size={16} color="#6366f1" />
        <Text style={styles.tokenCardText} numberOfLines={2}>
          {pushToken ?? "Not registered — push notifications unavailable on simulator."}
        </Text>
      </View>

      <Text style={[styles.listSectionLabel, { marginTop: 8 }]}>Backend Integration</Text>
      <View style={styles.hardwareCard}>
        <View style={styles.hardwareCardHeader}>
          <Ionicons name="cloud-upload-outline" size={18} color="#6366f1" />
          <Text style={styles.hardwareCardTitle}>Connect Your Backend</Text>
        </View>
        <Text style={styles.hardwareCardText}>
          Open <Text style={styles.hardwareBold}>notificationService.js</Text> and replace{" "}
          <Text style={styles.hardwareBold}>YOUR_BACKEND_URL</Text> with your server endpoint.
          Your ESP32/Arduino should POST to the same URL with{" "}
          <Text style={styles.hardwareBold}>zone</Text>, <Text style={styles.hardwareBold}>severity</Text>, and{" "}
          <Text style={styles.hardwareBold}>source: "sensor"</Text> in the body.
        </Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <Ionicons name="shield" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Farm Security</Text>
            <Text style={styles.headerSub}>Intruder Alert System</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {activeAlerts.length > 0 && (
            <View style={styles.headerAlertBadge}>
              <PulseDot color="#fff" />
              <Text style={styles.headerAlertBadgeText}>{activeAlerts.length}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.simHeaderBtn} onPress={() => setSimVisible(true)}>
            <Ionicons name="bug-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Critical banner ── */}
      {criticalCount > 0 && (
        <View style={styles.critBanner}>
          <PulseDot color="#fff" />
          <Text style={styles.critBannerText}>
            {criticalCount} CRITICAL — immediate action required
          </Text>
          <TouchableOpacity onPress={() => { setTab("alerts"); setAlertFilter("active"); }}>
            <Text style={styles.critBannerLink}>View →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
          {TABS.map(t => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tabItem, tab === t.key && styles.tabItemActive]}>
              <Ionicons name={t.icon} size={16} color={tab === t.key ? "#fff" : "#9ca3af"} />
              <Text style={[styles.tabItemText, tab === t.key && styles.tabItemTextActive]}>{t.label}</Text>
              {t.key === "alerts" && activeAlerts.length > 0 && (
                <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{activeAlerts.length}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Tab content ── */}
      <View style={{ flex: 1 }}>
        {tab === "dashboard" && renderDashboard()}
        {tab === "alerts"    && renderAlerts()}
        {tab === "sensors"   && renderSensors()}
        {tab === "contacts"  && renderContacts()}
        {tab === "settings"  && renderSettings()}
      </View>

      {/* ─────────────────── MODALS ─────────────────── */}

      {/* ── Call Authorities Modal ── */}
      <Modal visible={!!callAlert} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderIcon}>
                <Ionicons name="call" size={20} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Notify Authorities</Text>
                {callAlert && (
                  <Text style={styles.modalSub}>{callAlert.zone} · {SEV[callAlert.severity]?.label} alert</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setCallAlert(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              {callAlert && (
                <View style={[styles.alertRecap, { backgroundColor: SEV[callAlert.severity]?.bg, borderColor: SEV[callAlert.severity]?.border }]}>
                  <Text style={[styles.alertRecapTitle, { color: SEV[callAlert.severity]?.color }]}>
                    {SEV[callAlert.severity]?.label} Alert — {callAlert.zone}
                  </Text>
                  <Text style={styles.alertRecapMsg}>{callAlert.message}</Text>
                  <Text style={styles.alertRecapTime}>{fmtTime(callAlert.timestamp)}</Text>
                </View>
              )}

              <Text style={styles.modalSectionLabel}>Emergency Contacts</Text>
              {contacts.map(c => (
                <View key={c.id} style={styles.modalContactRow}>
                  <View style={[styles.contactRowIcon, { backgroundColor: c.color + "20" }]}>
                    <Ionicons name={c.icon} size={18} color={c.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactRowName}>{c.name}</Text>
                    <Text style={styles.contactRowNum}>{c.number}</Text>
                  </View>
                  <View style={styles.contactRowActions}>
                    <TouchableOpacity style={[styles.contactActionBtn, { backgroundColor: c.color }]} onPress={() => doCall(c)}>
                      <Ionicons name="call" size={13} color="#fff" />
                      <Text style={styles.contactActionTxt}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.contactActionBtn, { backgroundColor: "#f3f4f6" }]} onPress={() => doSMS(c, callAlert)}>
                      <Ionicons name="chatbubble-outline" size={13} color="#374151" />
                      <Text style={[styles.contactActionTxt, { color: "#374151" }]}>SMS</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Simulate Modal ── */}
      <Modal visible={simVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={[styles.modalHeaderIcon, { backgroundColor: "#fff7ed" }]}>
                <Ionicons name="bug" size={20} color="#f97316" />
              </View>
              <Text style={[styles.modalTitle, { flex: 1 }]}>Simulate Alert</Text>
              <TouchableOpacity onPress={() => setSimVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionLabel}>Farm Zone</Text>
              <View style={styles.chipWrap}>
                {FARM_ZONES.map(z => (
                  <TouchableOpacity key={z} onPress={() => setSimZone(z)} style={[styles.chip, simZone === z && styles.chipOn]}>
                    <Text style={[styles.chipTxt, simZone === z && styles.chipTxtOn]}>{z}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>Severity</Text>
              <View style={styles.chipWrap}>
                {Object.entries(SEV).map(([k, v]) => (
                  <TouchableOpacity key={k} onPress={() => setSimSev(k)} style={[styles.chip, simSev === k && { backgroundColor: v.color, borderColor: v.color }]}>
                    <Text style={[styles.chipTxt, simSev === k && { color: "#fff" }]}>{v.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.triggerBtn}
                onPress={() => { injectAlert(simZone, simSev, "manual"); setSimVisible(false); setTab("alerts"); setAlertFilter("active"); }}
              >
                <Ionicons name="warning" size={18} color="#fff" />
                <Text style={styles.triggerBtnText}>Trigger Alert Now</Text>
              </TouchableOpacity>

              <Text style={styles.simNote}>
                Simulates a sensor firing. In production, your IoT hardware sends this automatically over WiFi.
              </Text>
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Add Contact Modal ── */}
      <Modal visible={addContact} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { flex: 1 }]}>Add Contact</Text>
                <TouchableOpacity onPress={() => setAddContact(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput style={styles.input} placeholder="e.g. Farm Security Guard" placeholderTextColor="#9ca3af" value={cName} onChangeText={setCName} />
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Phone Number</Text>
                <TextInput style={styles.input} placeholder="+1 234 567 8900" placeholderTextColor="#9ca3af" value={cNumber} onChangeText={setCNumber} keyboardType="phone-pad" />
                <TouchableOpacity style={[styles.triggerBtn, { backgroundColor: "#1f2937", marginTop: 20 }]} onPress={doAddContact}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.triggerBtnText}>Save Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:                   { flex: 1, backgroundColor: "#f1f5f9" },

  // Header
  header:                 { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: "#1f2937", gap: 10 },
  backBtn:                { width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, justifyContent: "center", alignItems: "center" },
  headerCenter:           { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  headerIcon:             { width: 38, height: 38, backgroundColor: "#ef4444", borderRadius: 9, justifyContent: "center", alignItems: "center" },
  headerTitle:            { fontSize: 17, fontWeight: "bold", color: "#fff" },
  headerSub:              { fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 1 },
  headerRight:            { flexDirection: "row", alignItems: "center", gap: 8 },
  headerAlertBadge:       { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#ef4444", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  headerAlertBadgeText:   { color: "#fff", fontSize: 12, fontWeight: "700" },
  simHeaderBtn:           { width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, justifyContent: "center", alignItems: "center" },

  // Critical banner
  critBanner:             { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ef4444", paddingHorizontal: 16, paddingVertical: 10 },
  critBannerText:         { flex: 1, color: "#fff", fontSize: 13, fontWeight: "700" },
  critBannerLink:         { color: "#fff", fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },

  // Tab bar
  tabBar:                 { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tabBarContent:          { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tabItem:                { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 5, backgroundColor: "transparent" },
  tabItemActive:          { backgroundColor: "#1f2937" },
  tabItemText:            { fontSize: 13, fontWeight: "500", color: "#9ca3af" },
  tabItemTextActive:      { color: "#fff" },
  tabBadge:               { backgroundColor: "#ef4444", borderRadius: 8, minWidth: 16, height: 16, justifyContent: "center", alignItems: "center", paddingHorizontal: 3 },
  tabBadgeText:           { color: "#fff", fontSize: 9, fontWeight: "bold" },

  // Tab body
  tabBody:                { flex: 1, padding: 14 },

  // Pulse dot
  pulseDot:               { width: 8, height: 8, borderRadius: 4 },

  // Stat row
  statRow:                { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard:               { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#f3f4f6" },
  statVal:                { fontSize: 20, fontWeight: "bold", marginTop: 4 },
  statLbl:                { fontSize: 10, color: "#9ca3af", marginTop: 2, fontWeight: "500" },

  // Section cards
  sectionCard:            { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 14 },
  sectionCardHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionCardTitle:       { fontSize: 15, fontWeight: "700", color: "#111827" },
  sectionCardLink:        { fontSize: 13, color: "#6366f1", fontWeight: "600" },

  // Sensor grid (dashboard)
  sensorGrid:             { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sensorChip:             { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#f0fdf4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#bbf7d0" },
  sensorChipAlert:        { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  sensorChipOffline:      { backgroundColor: "#f9fafb", borderColor: "#e5e7eb" },
  sensorChipText:         { fontSize: 12, color: "#10b981", fontWeight: "500" },

  // Quick actions
  quickActions:           { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  quickBtn:               { width: "47%", padding: 14, borderRadius: 12, alignItems: "center", gap: 6 },
  quickBtnText:           { fontSize: 13, fontWeight: "600" },

  // Empty states
  emptySmall:             { alignItems: "center", paddingVertical: 24 },
  emptySmallText:         { fontSize: 14, color: "#9ca3af", marginTop: 8, fontWeight: "500" },
  emptyBig:               { alignItems: "center", paddingVertical: 60 },
  emptyBigText:           { fontSize: 18, color: "#9ca3af", marginTop: 14, fontWeight: "600" },
  emptyBigSub:            { fontSize: 13, color: "#d1d5db", marginTop: 4, textAlign: "center" },

  // Filter chips (alerts tab)
  filterScroll:           { maxHeight: 52, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  filterContent:          { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  filterChip:             { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f3f4f6" },
  filterChipOn:           { backgroundColor: "#1f2937" },
  filterChipText:         { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  filterChipTextOn:       { color: "#fff" },

  // Alert card
  alertCard:              { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10 },
  acHeader:               { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  acIconWrap:             { width: 34, height: 34, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  acTitleRow:             { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" },
  acZone:                 { fontSize: 14, fontWeight: "700" },
  acBadge:                { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  acBadgeText:            { color: "#fff", fontSize: 10, fontWeight: "700" },
  acMsg:                  { fontSize: 12, color: "#374151", lineHeight: 17 },
  acMeta:                 { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  acMetaText:             { fontSize: 10, color: "#9ca3af" },
  acDot:                  { width: 3, height: 3, borderRadius: 2, backgroundColor: "#d1d5db" },
  acStatus:               { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  acStatusText:           { fontSize: 10, fontWeight: "600" },
  acActions:              { flexDirection: "row", gap: 7 },
  acBtn:                  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 7, borderRadius: 8, gap: 4 },
  acBtnRed:               { backgroundColor: "#ef4444" },
  acBtnGreen:             { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#86efac" },
  acBtnGray:              { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb" },
  acBtnTxt:               { fontSize: 11, fontWeight: "600" },

  // Sensor tab
  sensorSummaryRow:       { flexDirection: "row", gap: 10, marginBottom: 14 },
  sensorSumCard:          { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#f3f4f6" },
  sensorSumVal:           { fontSize: 22, fontWeight: "bold" },
  sensorSumLbl:           { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  sensorRow:              { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, gap: 10 },
  sensorStatusDot:        { width: 10, height: 10, borderRadius: 5 },
  sensorRowName:          { fontSize: 14, fontWeight: "600", color: "#111827" },
  sensorRowTime:          { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  sensorStatusBadge:      { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  sensorStatusBadgeText:  { fontSize: 11, fontWeight: "600" },
  sensorAlertBtn:         { padding: 6 },

  // Hardware card
  hardwareCard:           { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginTop: 4, marginBottom: 4, borderWidth: 1, borderColor: "#e0e7ff" },
  hardwareCardHeader:     { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  hardwareCardTitle:      { fontSize: 14, fontWeight: "700", color: "#4338ca" },
  hardwareCardText:       { fontSize: 13, color: "#374151", lineHeight: 20, marginBottom: 12 },
  hardwareBold:           { fontWeight: "700", color: "#1f2937" },
  hardwareSteps:          { gap: 8 },
  hardwareStep:           { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  hardwareStepNum:        { width: 22, height: 22, borderRadius: 11, backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center" },
  hardwareStepNumText:    { color: "#fff", fontSize: 11, fontWeight: "700" },
  hardwareStepText:       { flex: 1, fontSize: 12, color: "#374151", lineHeight: 18 },

  // Contacts tab
  addContactBtn:          { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937", paddingVertical: 13, borderRadius: 10, marginBottom: 14, gap: 8 },
  addContactBtnText:      { color: "#fff", fontSize: 14, fontWeight: "700" },
  contactRow:             { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
  contactRowIcon:         { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  contactRowName:         { fontSize: 14, fontWeight: "600", color: "#111827" },
  contactRowNum:          { fontSize: 12, color: "#6b7280", marginTop: 1 },
  contactRowActions:      { flexDirection: "row", gap: 6 },
  contactActionBtn:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  contactActionTxt:       { fontSize: 12, fontWeight: "600", color: "#fff" },
  contactDeleteBtn:       { padding: 6 },

  // Settings tab
  settingRow:             { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8 },
  settingLabel:           { fontSize: 14, fontWeight: "600", color: "#111827" },
  settingSubLabel:        { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  tokenCard:              { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8 },
  tokenCardText:          { flex: 1, fontSize: 12, color: "#6b7280", lineHeight: 18 },

  // Section label
  listSectionLabel:       { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5, marginBottom: 8, marginTop: 4, textTransform: "uppercase" },

  // Modals
  modalOverlay:           { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet:             { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 8, maxHeight: "88%" },
  modalHandle:            { width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  modalHeaderRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", gap: 10 },
  modalHeaderIcon:        { width: 38, height: 38, backgroundColor: "#fef2f2", borderRadius: 9, justifyContent: "center", alignItems: "center" },
  modalTitle:             { fontSize: 17, fontWeight: "bold", color: "#111827" },
  modalSub:               { fontSize: 12, color: "#6b7280", marginTop: 2 },
  modalCloseBtn:          { padding: 4 },
  modalSectionLabel:      { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5, marginBottom: 8, marginTop: 16, textTransform: "uppercase" },
  modalContactRow:        { flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderRadius: 12, padding: 10, marginBottom: 8, gap: 10 },
  alertRecap:             { borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 8 },
  alertRecapTitle:        { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  alertRecapMsg:          { fontSize: 13, color: "#374151", lineHeight: 19 },
  alertRecapTime:         { fontSize: 11, color: "#9ca3af", marginTop: 4 },

  // Simulate modal
  chipWrap:               { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:                   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  chipOn:                 { backgroundColor: "#1f2937", borderColor: "#1f2937" },
  chipTxt:                { fontSize: 13, color: "#374151", fontWeight: "500" },
  chipTxtOn:              { color: "#fff" },
  triggerBtn:             { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#ef4444", paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 24 },
  triggerBtnText:         { color: "#fff", fontSize: 16, fontWeight: "bold" },
  simNote:                { fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 10, lineHeight: 18 },

  // Add contact modal
  fieldLabel:             { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input:                  { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: "#111827", backgroundColor: "#fafafa" },
});