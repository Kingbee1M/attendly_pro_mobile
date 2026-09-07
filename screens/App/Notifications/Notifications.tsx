import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import React, { useEffect } from 'react'
import { useRefresh } from '@/Context/RefreshContext';
import { colors } from '@/css/colorsIndex';
import NotificationsCard from './NotificationsCard';
import { RootStackParamList } from '@/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '@/components/Header';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { getCalender } from '@/features/Attendance/attendanceSlice';
import { loginUser } from '@/features/clockInandOut/clockInSlice';
import { RootState } from '@/utils/store';



// Define type for the Notifications component props
type NotificationsProps = {
	navigation: NativeStackNavigationProp<RootStackParamList, 'Notifications'>;
};

const Notifications: React.FC<NotificationsProps> = ({ navigation }) => {
	const { data, isLoading, isError, message, calenderdata, calenderisLoading, calenderisError, calendermessage }: any = useAppSelector((state) => state.attendance);
	const day = !data?.data?.data?.data ? [] : data?.data?.data?.data
	const { refreshing, onRefresh } = useRefresh();
	const dispatch = useAppDispatch();
	const { logindata } = useAppSelector((state: RootState) => state.clock);
	const id = logindata?.data?.user?.id

	useEffect(() => {
		const fetchData = async () => {
			try {
				await dispatch(loginUser()).unwrap();

				// Use current date range instead of hardcoded May 2025
				const currentDate = new Date();
				const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
				const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

				const startDateStr = startDate.toISOString().split('T')[0];
				const endDateStr = endDate.toISOString().split('T')[0];

				await dispatch(getCalender({
					id: id,
					page: 1,
					limit: 50,
					filterByDate: 'range',
					startDate: startDateStr,
					endDate: endDateStr,
				})).unwrap();
			} catch (error) {
			}
		};

		fetchData();
	}, [dispatch, id]);

	useEffect(() => {
		const fetchData = async () => {
			if (refreshing === true) {
				try {
					await dispatch(loginUser()).unwrap();

					// Use current date range
					const currentDate = new Date();
					const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
					const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

					const startDateStr = startDate.toISOString().split('T')[0];
					const endDateStr = endDate.toISOString().split('T')[0];

					await dispatch(getCalender({
						id: id,
						page: 1,
						limit: 50,
						filterByDate: 'range',
						startDate: startDateStr,
						endDate: endDateStr,
					})).unwrap();
				} catch (error) {
				}
			}
		};

		fetchData();
	}, [refreshing, dispatch, id]);


	return (
		<View style={styles.headerContainer}>
			<Header text={'Notifications'} />
			<View style={styles.container}>
				<ScrollView
					style={styles.scrollView}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
					contentInsetAdjustmentBehavior="automatic"
					contentContainerStyle={styles.scrollViewContent} 	>

					{/* NotificationsCard */}
					<NotificationsCard navigation={navigation} />
				</ScrollView>
			</View>
		</View>
	)
}

export default Notifications

const styles = StyleSheet.create({

	headerContainer: {
		flex: 1,
	},
	scrollViewContent: {
		flexGrow: 1,
		paddingBottom: 100,
	},
	scrollView: {
		flex: 1,
	},
	container: {
		flex: 1,
		paddingTop: 10,
		backgroundColor: colors.background,
	}
})