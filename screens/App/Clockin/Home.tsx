import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, StatusBar } from 'react-native';
import React, { useEffect } from 'react';
import Headline from '@/components/Headline';
import { colors } from '@/css/colorsIndex';
import { BgHome } from '@/assets/svg/BgHome';
import DaysCard from './DaysCard';
import { BgUser } from '@/assets/svg/BgUser';
import { RootStackParamList } from '@/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRefresh } from '@/Context/RefreshContext';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { formattedDate } from '@/utils/helpers';
import { loginUser } from '@/features/clockInandOut/clockInSlice';
import AttendanceCard from '../Attendance/AttendanceCard';
import { getLoggedInUserAttendance, reset } from '@/features/Attendance/attendanceSlice';
import { RootState } from '@/utils/store';
import { logoutUser } from '@/slices/authSlice';
import { useCurrentDate } from '@/Context/DateProvider';
import { processAttendanceData, transformLoginDataToSelectedDateDetails } from '@/components/Options';
import StatusView from './StatusView';

type HomeProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const Home: React.FC<HomeProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { logindata } = useAppSelector((state: any) => state.clock);
  const { refreshing, onRefresh } = useRefresh();
  const { data, isLoading, message, isError } = useAppSelector((state: RootState) => state.attendance);
  const day = !data?.data?.data?.data ? [] : data?.data?.data?.data;
  const id = logindata?.data?.user?.id;
  const { currentDate } = useCurrentDate();
  const selectedDateDetails = transformLoginDataToSelectedDateDetails(day[0]);
  const { totalWorkedHours, lateArrivals } = processAttendanceData(day);
  const entry = day[0];
  const clockIn = entry?.clockIn;
  const clockOut = entry?.clockOut;

  const isClockedIn = Boolean(clockIn && !clockOut);

  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  useEffect(() => {
    if (isError) {
      const errorMessages = [message];

      if (errorMessages.includes("Invalid token")) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Do you want to log out?",
          [
            {
              text: "Yes",
              onPress: () => dispatch(logoutUser()),
            },
          ]
        );
      }

      const resets = {
        reset: () => dispatch(reset()),
      };

      Object.values(resets).forEach((resetFn) => resetFn());
    }
  }, [isError, message, dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(loginUser()).unwrap();
        await dispatch(getLoggedInUserAttendance(id)).unwrap();
      } catch (error) {
        // Explicitly handle error if needed
      }
    };

    fetchData();
  }, [dispatch, id]);

  useEffect(() => {
    const fetchData = async () => {
      if (refreshing) {
        try {
          await dispatch(loginUser()).unwrap();
          await dispatch(getLoggedInUserAttendance(id)).unwrap();
        } catch (error) {
          // Explicitly handle error if needed
        }
      }
    };

    fetchData();
  }, [refreshing, dispatch, id]);

  const handlePress = () => {
    
      navigation.navigate('ClockIn');
  };

  return (
    <View style={styles.container}>
      <Headline navigation={navigation} user={logindata} profileIsLoading={isLoading} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.top_container}>
          <View style={styles.clockIn_icon_container}>
            <StatusView entry={{ clockIn, clockOut }} />

            <View style={styles.text_time_sub_container}>
              <Text style={styles.text_time}>{formattedDate}</Text>
              <Text style={styles.text_time_sub}>{formattedTime}</Text>
            </View>

            <Image source={require('../../../assets/images/Barcode.png')} />

            <TouchableOpacity
              style={[
                styles.button,
                isClockedIn ? styles.buttonClockOut : styles.buttonClockIn,
              ]}
              onPress={handlePress}
            >
              <Text style={styles.text}>
                {isClockedIn ? 'Clock Out' : 'Clock In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Overview */}
          <View style={styles.daysCardContainer}>
            <Text style={styles.overviewText}>Overview</Text>
            <View style={styles.daysCard}>
              <DaysCard
                toptext="Worked hours"
                icon={<BgHome />}
                text={`${totalWorkedHours} hrs`}
                loading={false}
              />
              <DaysCard
                toptext="Late arrivals"
                icon={<BgUser />}
                text={`${lateArrivals} Days`}
                loading={false}
              />
            </View>
          </View>

          {/* Clocking time */}
          <View style={styles.daysCardContainer}>
            {!refreshing && isLoading ? null : <Text style={styles.overviewText}>Clocking time</Text>}
            <AttendanceCard
              topTime={true}
              selectedDateDetails={selectedDateDetails}
              isLoading={!refreshing && isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 200 : 100,
  },
  scrollView: {
    flex: 1,
  },
  overviewText: {
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray600,
    marginBottom: 12,
  },
  daysText: {
    width: 60,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray900,
  },
  daysCardContainer: {
    marginTop: 40,
  },
  daysCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
  },
  text: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
  button: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 18,
    gap: 8,
    height: 44,
    borderWidth: 1,
    shadowColor: 'rgba(16, 24, 40, 0.05)',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 4,
  },
  buttonClockIn: {
    backgroundColor: colors.accent_blue,
    borderColor: colors.accent_blue,
  },
  buttonClockOut: {
    backgroundColor: '#D92D20',
    borderColor: '#D92D20',
  },
  text_time_sub_container: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  text_time_sub: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 30,
    color: colors.gray700,
  },
  text_time: {
    height: 14,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 14,
    color: colors.gray700,
  },
  userStatus_out_text: {
    width: 71,
    height: 18,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 18,
    color: colors.green,
    textAlign: 'center',
  },
  userStatus_text_out: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 10,
    width: 91,
    height: 22,
    backgroundColor: '#09C16929',
    borderRadius: 5,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 3,
    gap: 8,
    width: 148,
    height: 28,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
  },
  top_container: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  clockIn_icon_container: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 24,
    width: '100%',
    height: 408,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 55,
    backgroundColor: colors.background,
  },
});
