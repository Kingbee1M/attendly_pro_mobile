import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { colors } from '@/css/colorsIndex';
import moment from 'moment';

type SelectedDateDetails = {
	day: string;
	status: string;
	date: string;
	clockOut?: string | null;
	clockIn?: string | null;
};

type AttendanceCardProps = {
	selectedDateDetails: SelectedDateDetails;
	isLoading: boolean;
	topTime: boolean;
};

const AttendanceCard: React.FC<AttendanceCardProps> = ({ selectedDateDetails, isLoading, topTime }) => {


	// Transform the attendance object into a usable array for rendering
	const clockTimes = [
		{
			label: "Clock In time",
			time: selectedDateDetails?.clockIn ?? "00:00",
		},
		{
			label: "Clock Out time",
			time: selectedDateDetails?.clockOut ?? "00:00",
		},
	];


	// Determine styles based on the status
	const getStatusStyles = (status: string) => {
		if (status === "Present") {
			return {
				containerStyle: styles.time_container,
				textStyle: styles.time_text,
			};
		} else if (status === "Absent") {
			return {
				containerStyle: styles.time_container_absent,
				textStyle: styles.time_text_absent,
			};
		} else if (status === "Late") {
			return {
				containerStyle: styles.time_container_late,
				textStyle: styles.time_text_late,
			};

		} else if (status === "On Leave") {
			return {
				containerStyle: styles.time_container_onleave,
				textStyle: styles.time_text_onleave,
			};

		} else {
			return {
				containerStyle: styles.time_container_norecord,
				textStyle: styles.time_text_norecord,
			};
		}
	};




	// Get the styles based on the current status
	const { containerStyle, textStyle } = getStatusStyles(selectedDateDetails?.status);

	return (
		<View style={styles.card_container}>
			{isLoading ? (
				<View style={[styles.card_container, styles.loaderContainer]}>
					<ActivityIndicator size="small" color={colors.gray400} />
				</View>
			) : (
				<View style={styles.card}>
					{topTime &&
						<View style={styles.time_container_main}>
							{/* Render the formatted date */}
							<Text style={styles.dateText}>{selectedDateDetails?.date === "Invalid date" ? "" : moment(selectedDateDetails?.date).format('D-MMM-YYYY')}</Text>
							{selectedDateDetails?.status && (
								<View style={containerStyle}>
									<Text style={textStyle}>{selectedDateDetails?.status}</Text>
								</View>
							)}
						</View>}

					{/* Render clock times or "No records" message */}
					{selectedDateDetails?.status === "No records" ? (
						<View style={styles.noRecordsContainer}>
							<Text style={styles.noRecordsText}>No time recorded for this day</Text>
						</View>
					) : (
						clockTimes?.map((item, index) => (
							<View key={index} style={styles.cardSup}>
								<Text
									style={[
										(item?.time === "00:00 PM" || item?.time === "00:00 AM")
											? styles.clockInTitleMute
											: styles.clockInText
									]}
								>
									{item?.label}
								</Text>
								<Text
									style={[
										(item?.time === "00:00 PM" || item?.time === "00:00 AM")
											? styles.clockInTextMute
											: styles.timeText
									]}
								>
									{item?.time}
								</Text>
							</View>

						))
					)}
				</View>
			)}
		</View>
	);
};

export default AttendanceCard;



const styles = StyleSheet.create({
	time_container_onleave: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
		minHeight: 24,
		paddingVertical: 2,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderColor: colors.purple,
		borderRadius: 4,
	},

	time_text_onleave: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 12,
		lineHeight: 16,
		color: colors.purple,
	},
	time_container_late: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
		minHeight: 24,
		paddingVertical: 2,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderColor: colors.orange,
		borderRadius: 4,
	},
	time_text_late: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 12,
		lineHeight: 16,
		color: colors.orange,
	},
	clockInTitleMute: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 12,
		lineHeight: 18,
		color: colors.gray400,
	},
	clockInTextMute: {
		height: 24,
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 16,
		lineHeight: 24,
		color: colors.gray300,
	},
	loaderContainer: {
		justifyContent: "center",
		alignItems: "center",
		height: 500,
	},
	noRecordsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 20,
	},
	noRecordsText: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 14,
		lineHeight: 20,
		color: colors.gray500,
	},
	card_container: {
		gap: 16,
	},
	time_container_main: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 12,
		paddingBottom: 14,
		borderBottomWidth: 1,
		borderBottomColor: colors.gray300,
	},
	dateText: {
		flexShrink: 1,
	},
	time_text: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 12,
		lineHeight: 16,
		color: colors.green,
	},
	time_container: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
		minHeight: 24,
		paddingVertical: 2,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderColor: colors.green,
		borderRadius: 4,
	},
	timeText: {
		height: 24,
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 16,
		lineHeight: 24,
		color: colors.gray900,
	},
	time_container_absent: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
		minHeight: 24,
		paddingVertical: 2,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderColor: colors.red,
		borderRadius: 4,
	},
	time_text_absent: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 12,
		lineHeight: 16,
		color: colors.red,
	},
	time_container_norecord: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
		minHeight: 24,
		paddingVertical: 2,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderColor: colors.gray500,
		borderRadius: 4,
	},
	time_text_norecord: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 12,
		lineHeight: 16,
		color: colors.gray500,
	},
	cardSup: {
		gap: 10,
	},
	clockInText: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 12,
		lineHeight: 18,
		color: colors.gray400,
	},
	card: {
		width: "100%",
		backgroundColor: colors.white,
		borderRadius: 8,
		flexDirection: 'column',
		paddingHorizontal: 16,
		paddingVertical: 14,
		gap: 28,
	},
});


