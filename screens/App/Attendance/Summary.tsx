import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { DaysPresent } from '@/assets/svg/DaysPresent';
import { colors } from '@/css/colorsIndex';
import { DaysAbsent } from '@/assets/svg/DaysAbsent';
import { LateArrivals } from '@/assets/svg/LateArrivals';
import moment from 'moment';

// Define types for props
type SummaryProps = {
	summarydata?: any;
	summaryisLoading: boolean;
};

// Define the structure of the`data`array
type DataItem = {
	title: string;
	value: string;
	icon: React.ReactNode;
};

const Summary: React.FC<SummaryProps> = ({ summarydata, summaryisLoading }) => {
	const attendanceList = summarydata?.data?.data?.data || [];

	let presentCount = 0;
	let lateCount = 0;
	let earlyCount = 0;

	attendanceList.forEach((entry: any) => {
		const clockIn = entry?.clockIn ? moment(entry?.clockIn) : null;
		const clockOut = entry?.clockOut ? moment(entry?.clockOut) : null;

		if (clockIn && clockOut) {
			presentCount++;

			// Late if clockIn is after 8:15 AM
			if (clockIn.isAfter(clockIn.clone().startOf('day').add(8, 'hours').add(15, 'minutes'))) {
				lateCount++;
			}

			// Early departure if clockOut is before 4:00 PM (and clockIn exists)
			if (clockOut.isBefore(clockOut.clone().startOf('day').add(16, 'hours'))) {
				earlyCount++;
			}
		}
	});

	const totalDays = attendanceList?.length;
	const absentCount = totalDays - presentCount;

	const latestEntry = attendanceList
		.slice()
		.sort((a: any, b: any) => new Date(b?.clockIn).getTime() - new Date(a?.clockIn).getTime())[0];

	const latestClockIn = latestEntry?.clockIn
		? moment(latestEntry?.clockIn).format('hh:mm A')
		: '00:00';

	const latestClockOut = latestEntry?.clockOut
		? moment(latestEntry?.clockOut).format('hh:mm A')
		: '00:00';

	const latestDate = latestEntry?.clockIn
		? moment(latestEntry.clockIn).format('MMMM Do, YYYY')
		: '00:00';

	const data: DataItem[] = [
		{
			title: 'Days present',
			value: `${presentCount} Days`,
			icon: <DaysPresent />,
		},
		{
			title: 'Days absent',
			value: `${absentCount} Days`,
			icon: <DaysAbsent />,
		},
		{
			title: 'Late arrivals',
			value: `${lateCount} Days`,
			icon: <LateArrivals />,
		},
		{
			title: 'Early departures',
			value: `${earlyCount} Days`,
			icon: <LateArrivals />,
		},
		{
			title: 'Latest Clock In',
			value: `${latestClockIn} (${latestDate})`,
			icon: <DaysPresent />,
		},
		{
			title: 'Latest Clock Out',
			value: `${latestClockOut} (${latestDate})`,
			icon: <DaysAbsent />,
		}
	];

	return (
		<View style={styles.container}>
			{summaryisLoading ? (
				<View style={[styles.card_container, styles.loaderContainer]}>
					<ActivityIndicator size="small" color={colors.gray400} />
				</View>
			) : (
				data?.map((item, index) => (
					<View style={[styles.card, index >= 4 && styles.latestCard]} key={index}>
						<View style={styles.card_title}>
							<Text style={styles.text}>{item?.title}</Text>
							{item?.icon}
						</View>
						<Text style={styles.days}>{item?.value}</Text>
					</View>
				))
			)}
		</View>
	);
};

export default Summary;

const styles = StyleSheet.create({


	card_container: {
		height: 500,
	},
	loaderContainer: {
		flex: 1,
		flexDirection: "row",
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		flex: 1,
	},
	card: {
		flexDirection: 'column',
		justifyContent: 'space-between',
		paddingVertical: 12,
		paddingHorizontal: 14,
		width: '48%',
		height: 94,
		backgroundColor: colors.white,
		borderRadius: 8,
		marginBottom: 14,
	},
	latestCard: {
		height: 150,
	},
	card_title: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		width: "100%",
	},
	text: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 12,
		lineHeight: 18,
		color: colors.gray400,
		alignSelf: 'center',
		flexShrink: 1,
	},
	days: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 16,
		lineHeight: 24,
		color: colors.gray900,
		flexShrink: 1,
	},
})
