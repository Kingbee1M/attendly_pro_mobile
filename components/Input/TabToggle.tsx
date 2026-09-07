import { useRefresh } from '@/Context/RefreshContext';
import { colors } from '@/css/colorsIndex';
import { getCalender, getLoggedInUserAttendance, reset } from '@/features/Attendance/attendanceSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import AttendanceCard from '@/screens/App/Attendance/AttendanceCard';
import CalendarMonth from '@/screens/App/Attendance/CalenderMonth';
import Summary from '@/screens/App/Attendance/Summary';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, Alert, RefreshControl } from 'react-native';
import { Tab } from '@rneui/themed';
import ContextMenu from '../ContextMenu';
import { tabItems } from '../data';
import { RootState } from '@/utils/store';
import { loginUser } from '@/features/clockInandOut/clockInSlice';
import { transformLoginDataToSelectedDateDetails } from '../Options';






// Define the attendance day type
interface AttendanceDay {
	_id: string;
	userId: string;
	date: string;
	morningCheckIn: string | null;
	morningCheckout: string | null;
	duration: number;
	overtimeLateDiff: number;
	status: string;
}

// Define the Redux state types
interface AttendanceState {
	data: { data: { attendance: AttendanceDay } } | null;
	isLoading: boolean;
	isError: boolean;
	message: string | null;
	summarydata: any; // Replace `any` with the actual summary data type
	summaryisLoading: boolean;
	summaryisError: boolean;
	summarymessage: string | null;
	calenderdata: any; // Replace `any` with the actual calendar data type
	calenderisLoading: boolean;
	calenderisError: boolean;
	calendermessage: string | null;
	setMessages: (message: string) => void; // Explicitly typed as a function that takes a string and returns void
}

const TabToggle: React.FC<AttendanceState> = ({ setMessages }: { setMessages: (message: string) => void }) => {
	const { data, isLoading, isError, message, calenderdata, calenderisLoading, calenderisError, calendermessage }: any = useAppSelector((state: { attendance: any; }) => state.attendance);
	const { logindata } = useAppSelector((state: RootState) => state.clock);
	const day = !data?.data?.data?.data ? [] : data?.data?.data?.data
	const selectedDateDetails = transformLoginDataToSelectedDateDetails(day[0]);
	const id = logindata?.data?.user?.id
	const { refreshing, onRefresh } = useRefresh(); // Assuming `useRefresh` is custom hook
	const [index, setIndex] = useState<number>(0);
	const [month, setMonth] = useState<number | any>({ number: new Date().getMonth() + 1 });
	const dispatch = useAppDispatch();
	const months = month.number;



	useEffect(() => {
		const fetchData = async () => {
			try {
				// Await dispatches if you need to handle responses sequentially
				await dispatch(loginUser()).unwrap();
				await dispatch(getLoggedInUserAttendance(id)).unwrap();
			} catch (error) {
				// Explicitly cast error to Error to access its properties 
			}
		};

		fetchData();
	}, [dispatch]);

	useEffect(() => {
		const fetchData = async () => {
			if (refreshing === true) {
				try {
					// Dispatch actions and handle responses sequentially
					await dispatch(loginUser()).unwrap();
					await dispatch(getLoggedInUserAttendance(id)).unwrap();
				} catch (error) {
					// Explicitly handle the error
				}
			}
		};

		fetchData();
	}, [refreshing, dispatch]);


	useEffect(() => {
		setIndex(0); // Reset tab on initial load
	}, []);

	// Fetch data based on the selected tab
	const fetchDataForTab = useCallback(() => {
		if (index === 0) {
			// Attendance Tab
			dispatch(getLoggedInUserAttendance(id));
		} else if (index === 1) {
			// Calendar Tab
			dispatch(getCalender({
				id: id,
				page: 1,
				limit: 50,
				filterByDate: 'range',
				startDate: '2025-05-01',
				endDate: '2025-05-30',
			}));
		} else if (index === 2) {
			// Summary Tab
			dispatch(getCalender({
				id: id,
				page: 1,
				limit: 50,
				filterByDate: 'range',
				startDate: '2025-05-01',
				endDate: '2025-05-30',
			}));
		}
	}, [index, dispatch]);

	useEffect(() => {
		fetchDataForTab();
	}, [index, fetchDataForTab]);

	useEffect(() => {
		if (refreshing === true) {
			fetchDataForTab();
		}
	}, [refreshing, fetchDataForTab, onRefresh]);

	useEffect(() => {
		if (
			day &&
			day.clockIn === null &&
			day.clockOut === null
		) {
			setMessages("No Attendance Data Found");
		}
	}, [day, setMessages]);



	// Consolidated Error Handling
	useEffect(() => {
		const errors = [];
		if (isError && message) errors.push(message);
		if (calenderisError && calendermessage) errors.push(calendermessage);

		if (errors.length > 0) {
			Alert.alert(
				"",
				errors.join("\n"),
				[{ text: "Ok" }]
			);
			dispatch(reset()); // Reset state after showing the alert
		}
	}, [isError, calenderisError, message, calendermessage, dispatch]);




	return (
		<View style={styles.mainContainer}>
			<View style={styles.tabContainer}>
				<Tab
					value={index}
					onChange={(e: any) => setIndex(e)}
					indicatorStyle={styles.indicatorStyle}
					variant="default"
				>
					{tabItems?.map((item, i) => (
						<Tab.Item
							key={i}
							title={
								<Text style={[styles.title, { color: index === i ? colors.white : '#667085' }]}>
									{item.title}
								</Text>
							}
							titleStyle={[
								styles.labelStyle,
								{ color: index === i ? colors.white : '#667085' },
							]}
						/>
					))}
				</Tab>
			</View>
			<View style={styles.filterContainer}>
				<ContextMenu setMonth={setMonth} />
			</View>


			<View style={styles.card_list_scroll_container}>
				<ScrollView
					style={styles.activeTabScrollView}
					contentContainerStyle={styles.activeTabContent}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
					{index === 0 && (
						<AttendanceCard
							selectedDateDetails={selectedDateDetails}
							isLoading={!refreshing && isLoading}
							topTime={false}
						/>
					)}
					{index === 1 && (
						<CalendarMonth
							id={id}
							months={months}
							calenderdata={calenderdata}
							calenderisLoading={!refreshing && calenderisLoading}/>
					)}
					{index === 2 && (
						<Summary
							summarydata={calenderdata}
							summaryisLoading={!refreshing && calenderisLoading}
						/>
					)}
				</ScrollView>
			</View>
		</View >
	);
};


export default TabToggle;

const styles = StyleSheet.create({

	title: {
		color: colors.white,
		zIndex: 1,
		marginBottom: 1,
	},
	mainContainer: {
		flexGrow: 1,
	},
	tabContainer: {
		paddingVertical: 4,
		paddingHorizontal: 3,
		height: 44,
		backgroundColor: colors.white,
		borderWidth: 1,
		borderColor: colors.gray300,
		borderRadius: 8,
		marginTop: 24,
		marginHorizontal: 20,
		gap: 20,
		zIndex: -2
	},


	indicatorStyle: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		// paddingVertical: 6,
		height: '100%',
		borderRadius: 6,
		backgroundColor: colors.accent_blue,
		color: colors.white,
		zIndex: -1
	},
	labelStyle: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 12,
	},

	card_list_scroll_container: {
		paddingHorizontal: 10,
		marginTop: 20,
		marginBottom: 0,
		flex: 1
	},
	filterContainer: {
		marginTop: 30,
		paddingHorizontal: 20,
	},
	activeTabScrollView: {
		flex: 1,
	},
	activeTabContent: {
		paddingHorizontal: 10,
		paddingBottom: 24,
	},
});

