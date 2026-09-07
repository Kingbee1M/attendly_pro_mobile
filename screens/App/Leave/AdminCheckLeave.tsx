import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useAppDispatch } from "@/hooks/hooks";
import { setLeaveStatus } from "@/features/leave/leaveSlice";
import Colors from "@/constants/Colors";
import { LeaveStatus } from "@/enums/leaveStatus.enum";
import { BackIcon } from "@/assets/svg/BackIcon";
import { CheckIcon } from "@/assets/svg/CheckIcon";
import { CancelIcon } from "@/assets/svg/CancelIcon";

type LeaveItem = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  rejectionReason?: string;
  status: string;
  user?: {
    name?: string;
    email?: string;
  };
  employee?: {
    name?: string;
    email?: string;
  };
};

type AdminCheckLeaveRouteParams = {
  AdminCheckLeave: {
    leave: LeaveItem;
  };
};

export default function AdminCheckLeave() {
  const route = useRoute<RouteProp<AdminCheckLeaveRouteParams, "AdminCheckLeave">>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme() || "light";
  const currentColors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  // Access leave object passed as navigation parameter
  const leave = route.params?.leave;

  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!leave) {
    return (
      <View style={[styles.centered, { backgroundColor: currentColors.background, paddingTop: insets.top }]}>
        <Text style={{ color: "#EF4444", fontSize: 16 }}>No leave data found.</Text>
      </View>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBannerStyle = (status: string) => {
    switch (status) {
      case LeaveStatus.APPROVED:
        return { bg: "#E6F4EA", text: "#137333", border: "#CEEAD6", label: "APPROVED" };
      case LeaveStatus.REJECTED:
        return { bg: "#FCE8E6", text: "#C5221F", border: "#FAD2CF", label: "REJECTED" };
      default:
        return { bg: "#FEF7E0", text: "#B06000", border: "#FEEFC3", label: "PENDING REVIEW" };
    }
  };

  // Handle Approve Action
  const handleApprove = () => {
    Alert.alert(
      "Approve Request",
      "Are you sure you want to approve this leave request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await dispatch(
                setLeaveStatus({
                  action: LeaveStatus.APPROVED,
                  params: { leaveId: leave.id },
                })
              ).unwrap();

              Alert.alert("Success", "Leave request approved!", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to approve request.");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // Handle Submit Rejection with Reason
  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Reason Required", "Please enter a reason for rejecting this request.");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        setLeaveStatus({
          action: LeaveStatus.REJECTED,
          params: { leaveId: leave.id },
          rejectionData: { rejectionReason: rejectionReason.trim() },
        })
      ).unwrap();

      setRejectModalVisible(false);
      Alert.alert("Success", "Leave request rejected.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to reject request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  const textColor = currentColors.text;
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const inputBg = isDark ? "#374151" : "#F9FAFB";
  const borderColor = isDark ? "#4B5563" : "#E5E7EB";

  const applicantName = leave.user?.name || leave.employee?.name || "Employee Request";
  const applicantEmail = leave.user?.email || leave.employee?.email || "N/A";
  const isPending = !leave.status || leave.status === LeaveStatus.PENDING;
  const statusTheme = getStatusBannerStyle(leave.status);

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background, paddingTop: insets.top + 10 }]}>
      
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <BackIcon color={isDark ? "#FFFFFF" : "#111827"} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Review Leave</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        
        {/* Status Indicator Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusTheme.bg, borderColor: statusTheme.border }]}>
          <Text style={[styles.statusBannerText, { color: statusTheme.text }]}>
            STATUS: {statusTheme.label}
          </Text>
        </View>

        {/* Employee & Request Overview */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.employeeName, { color: textColor }]}>
            {applicantName}
          </Text>
          <Text style={[styles.employeeEmail, { color: subTextColor }]}>
            {applicantEmail}
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: subTextColor }]}>Leave Type</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{leave.leaveType || "ANNUAL"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: subTextColor }]}>Duration</Text>
            <Text style={[styles.value, { color: textColor }]}>
              {`${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoColumn}>
            <Text style={[styles.label, { color: subTextColor, marginBottom: 6 }]}>Reason</Text>
            <Text style={[styles.reasonText, { color: textColor }]}>
              {leave.reason || "No reason provided."}
            </Text>
          </View>

          {/* Optional Rejection Reason Output */}
          {leave.status === LeaveStatus.REJECTED && leave.rejectionReason ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoColumn}>
                <Text style={[styles.label, { color: "#C5221F", marginBottom: 6 }]}>Rejection Reason</Text>
                <Text style={[styles.reasonText, { color: textColor }]}>
                  {leave.rejectionReason}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Dynamic Action Zone */}
        {isPending ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn, { opacity: isSubmitting ? 0.6 : 1 }]}
              onPress={() => setRejectModalVisible(true)}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <CancelIcon color="#FFFFFF" size={20} />
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.approveBtn, { opacity: isSubmitting ? 0.6 : 1 }]}
              onPress={handleApprove}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <CheckIcon color="#FFFFFF" size={20} />
                  <Text style={styles.btnText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.completedNotice}>
            <Text style={[styles.completedNoticeText, { color: subTextColor }]}>
              This request has already been processed and is marked as {leave.status.toLowerCase()}.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Rejection Reason Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Reject Request</Text>
            <Text style={[styles.modalSubtitle, { color: subTextColor }]}>
              Provide a reason for rejecting this leave request so the employee is informed.
            </Text>

            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: inputBg, borderColor, color: textColor },
              ]}
              placeholder="e.g. Insufficient coverage during team deliverables..."
              placeholderTextColor={subTextColor}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectionReason("");
                }}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.submitRejectBtn]}
                onPress={handleConfirmReject}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitRejectBtnText}>Confirm Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: "center",
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 20,
  },
  employeeName: {
    fontSize: 20,
    fontWeight: "700",
  },
  employeeEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(156, 163, 175, 0.15)",
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoColumn: {
    flexDirection: "column",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
  typeBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "700",
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  rejectBtn: {
    backgroundColor: "#EF4444",
  },
  approveBtn: {
    backgroundColor: "#22C55E",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  completedNotice: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  completedNoticeText: {
    fontSize: 13,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 90,
    fontSize: 14,
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelModalBtn: {
    backgroundColor: "transparent",
  },
  cancelModalBtnText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  submitRejectBtn: {
    backgroundColor: "#EF4444",
  },
  submitRejectBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});