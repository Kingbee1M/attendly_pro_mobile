import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, useColorScheme, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useAppDispatch } from "@/hooks/hooks";
import { RootState } from "@/utils/store";
import { useSelector } from "react-redux";
import { fetchLeaveRequestById } from "@/features/leave/leaveSlice";
import Colors from "@/constants/Colors";
import { LeaveStatus } from "@/enums/leaveStatus.enum";
import { CheckIcon } from "@/assets/svg/CheckIcon";
import { CancelIcon } from "@/assets/svg/CancelIcon";
import { ClockIcon } from "@/assets/svg/ClockIcon";
import { BackIcon } from "@/assets/svg/BackIcon";

type LeaveMessageRouteParams = {
  LeaveMessage: {
    id: string;
  };
};

export default function LeaveMessageScreen() {
  const route = useRoute<RouteProp<LeaveMessageRouteParams, 'LeaveMessage'>>();
  const navigation = useNavigation();
  const id = route.params?.id;

  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() || "light";
  const currentColors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const { selectedLeaveRequest, isLoading, error } = useSelector(
    (state: RootState) => state.leave
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchLeaveRequestById(id));
    }
  }, [id, dispatch]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: currentColors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={currentColors.text} />
      </View>
    );
  }

  if (error || !selectedLeaveRequest) {
    return (
      <View style={[styles.centered, { backgroundColor: currentColors.background, paddingTop: insets.top }]}>
        <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "600" }}>
          Failed to load leave details.
        </Text>
      </View>
    );
  }

  const status = selectedLeaveRequest?.status;
  const approved = status === LeaveStatus.APPROVED || status === 'APPROVED';
  const rejected = status === LeaveStatus.REJECTED || status === 'REJECTED';

  // Format dates for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const theme = approved
    ? {
        badgeBg: "#DCFCE7",
        iconBg: "#22C55E",
        title: "Leave Approved",
        message: "Your leave request has been reviewed and approved.",
      }
    : rejected
    ? {
        badgeBg: "#FEE2E2",
        iconBg: "#EF4444",
        title: "Leave Request Denied",
        message: "Unfortunately, your leave request was declined.",
      }
    : {
        badgeBg: "#FEF3C7",
        iconBg: "#F59E0B",
        title: "Request Pending",
        message: "Your leave request is currently under review.",
      };

  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  const textColor = currentColors.text;
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background, paddingTop: insets.top + 10 }]}>
      
      {/* Top Navigation */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <BackIcon color={isDark ? "#FFFFFF" : "#111827"} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Leave Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        
        {/* Main Status Header Card */}
        <View style={[styles.cardContainer, { backgroundColor: cardBg }]}>
          <View style={[styles.outerBadge, { backgroundColor: theme.badgeBg }]}>
            <View style={[styles.innerBadge, { backgroundColor: theme.iconBg }]}>
              {approved ? (
                <CheckIcon color="#FFFFFF" size={32} />
              ) : rejected ? (
                <CancelIcon color="#FFFFFF" size={32} />
              ) : (
                <ClockIcon color="#FFFFFF" size={32} />
              )}
            </View>
          </View>

          <Text style={[styles.title, { color: textColor }]}>
            {theme.title}
          </Text>
          
          <Text style={[styles.message, { color: subTextColor }]}>
            {theme.message}
          </Text>
        </View>

        {/* Rejection Alert Box */}
        {rejected && selectedLeaveRequest?.rejectionReason && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionLabel}>Rejection Reason</Text>
            <Text style={styles.rejectionText}>{selectedLeaveRequest.rejectionReason}</Text>
          </View>
        )}

        {/* Detailed Info Breakdown */}
        <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>Leave Type</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {selectedLeaveRequest.leaveType || "ANNUAL"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>Duration</Text>
            <Text style={[styles.infoValue, { color: textColor }]}>
              {`${formatDate(selectedLeaveRequest.startDate)} - ${formatDate(selectedLeaveRequest.endDate)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRowVertical}>
            <Text style={[styles.infoLabel, { color: subTextColor, marginBottom: 4 }]}>Reason</Text>
            <Text style={[styles.infoValueText, { color: textColor }]}>
              {selectedLeaveRequest.reason || "No reason provided."}
            </Text>
          </View>

          {/* Decision / Approver Block */}
          {(approved || rejected) && selectedLeaveRequest.approvedBy && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: subTextColor }]}>
                  {approved ? "Approved By" : "Reviewed By"}
                </Text>
                <Text style={[styles.infoValue, { color: textColor }]}>
                  {selectedLeaveRequest.approvedBy.name}
                </Text>
              </View>

              {selectedLeaveRequest.approvedAt && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Decision Date</Text>
                    <Text style={[styles.infoValue, { color: textColor }]}>
                      {formatDate(selectedLeaveRequest.approvedAt)}
                    </Text>
                  </View>
                </>
              )}
            </>
          )}

        </View>

        {/* Request ID Footer */}
        {Boolean(selectedLeaveRequest?.id) && (
          <Text style={styles.metaText}>
            {`Request ID: ${selectedLeaveRequest.id}`}
          </Text>
        )}

      </ScrollView>
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
  cardContainer: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  outerBadge: {
    padding: 14,
    borderRadius: 100,
    marginBottom: 16,
  },
  innerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  rejectionCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#991B1B",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: "#B91C1C",
    fontWeight: "500",
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoRowVertical: {
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoValueText: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
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
  divider: {
    height: 1,
    backgroundColor: "rgba(156, 163, 175, 0.15)",
    marginVertical: 10,
  },
  metaText: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
  },
});