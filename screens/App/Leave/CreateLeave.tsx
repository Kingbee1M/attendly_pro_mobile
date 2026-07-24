import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { createLeaveRequest } from "@/features/leave/leaveSlice";
import { LeaveType } from "@/enums/leaveType.enum"; // Adjust path to your LeaveType enum/type
import Colors from "@/constants/Colors";
import { BackIcon } from "@/assets/svg/BackIcon";
import { colors } from "@/css/colorsIndex";

const LEAVE_TYPES = Object.values(LeaveType || {
  ANNUAL: "ANNUAL",
  SICK: "SICK",
  CASUAL: "CASUAL",
  MATERNITY: "MATERNITY",
  PATERNITY: "PATERNITY",
});

export default function CreateLeave() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() || "light";
  const currentColors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const { isSubmitting } = useAppSelector((state: any) => state.leave || {});

  // Form State
  const [leaveType, setLeaveType] = useState<string>(LEAVE_TYPES[0] || "ANNUAL");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reason, setReason] = useState<string>("");

  // Date Picker visibility state (for Android/iOS)
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (startDate > endDate) {
      Alert.alert("Invalid Dates", "End date cannot be earlier than start date.");
      return;
    }

    const payload = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      leaveType: leaveType as any,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    };

    try {
      await dispatch(createLeaveRequest(payload)).unwrap();
      Alert.alert("Success", "Your leave request has been submitted!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to submit leave request.");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  const textColor = currentColors.text;
  const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const inputBg = isDark ? "#374151" : "#F9FAFB";
  const borderColor = isDark ? "#4B5563" : "#E5E7EB";

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background, paddingTop: insets.top + 10 }]}>
      
      {/* Navigation Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <BackIcon color={isDark ? "#FFFFFF" : "#111827"} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Apply for Leave</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.formCard, { backgroundColor: cardBg }]}>
          
          {/* Leave Type Selector */}
          <Text style={[styles.label, { color: textColor }]}>Leave Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {LEAVE_TYPES.map((type) => {
              const selected = leaveType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    { 
                      backgroundColor: selected ? colors.accent_blue : inputBg,
                      borderColor: selected ? colors.accent_blue : borderColor 
                    }
                  ]}
                  onPress={() => setLeaveType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeChipText, { color: selected ? "#FFFFFF" : textColor }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Date Selection */}
          <View style={styles.dateRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.label, { color: textColor }]}>Start Date</Text>
              <TouchableOpacity 
                style={[styles.dateInput, { backgroundColor: inputBg, borderColor }]} 
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={{ color: textColor }}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.label, { color: textColor }]}>End Date</Text>
              <TouchableOpacity 
                style={[styles.dateInput, { backgroundColor: inputBg, borderColor }]} 
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={{ color: textColor }}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Pickers */}
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, date) => {
                setShowStartPicker(Platform.OS === "ios");
                if (date) setStartDate(date);
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, date) => {
                setShowEndPicker(Platform.OS === "ios");
                if (date) setEndDate(date);
              }}
            />
          )}

          {/* Reason Input */}
          <Text style={[styles.label, { color: textColor, marginTop: 16 }]}>
            Reason <Text style={{ color: subTextColor, fontWeight: "400" }}>(Optional)</Text>
          </Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="Provide brief reason for your leave request..."
            placeholderTextColor={subTextColor}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={reason}
            onChangeText={setReason}
          />

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, { opacity: isSubmitting ? 0.7 : 1 }]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Submit Request</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
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
  formCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  typeScroll: {
    flexDirection: "row",
    marginBottom: 20,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 100,
    fontSize: 14,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: colors.accent_blue,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});