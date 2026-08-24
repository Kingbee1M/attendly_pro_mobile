import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // 1. Import Stack Creator
import { ColorSchemeName, Platform, useColorScheme, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';
import Colors from '../constants/Colors';
import Home from '@/screens/App/Clockin/Home';
import { RootTabParamList } from '@/types';
import { HomeIcon } from '@/assets/svg/HomeIcon';
import { LeaveIcon } from '@/assets/svg/LeaveIcon';
import { AttendanceIcon } from '@/assets/svg/AttendanceIcon';
import { ProfileIcon } from '@/assets/svg/ProfileIcon';
import Attendance from '@/screens/App/Attendance/Attendance';
import LeaveScreen from '@/screens/App/Leave/Leave';
import LeaveMessageScreen from '@/screens/App/Leave/LeaveMessage';
import { colors } from '@/css/colorsIndex';
import Profile from '@/screens/App/Profile/Profile';
import CreateLeave from '@/screens/App/Leave/CreateLeave';
import AdminCheckLeave from '@/screens/App/Leave/AdminCheckLeave';

const BottomTab = createBottomTabNavigator<RootTabParamList>();

// 3. Create Leave Stack Navigator
const LeaveStack = createNativeStackNavigator();

function LeaveStackNavigator() {
  return (
    <LeaveStack.Navigator screenOptions={{ headerShown: false }}>
      <LeaveStack.Screen name="LeaveMain" component={LeaveScreen} />
      <LeaveStack.Screen name="LeaveMessage" component={LeaveMessageScreen} />
      <LeaveStack.Screen name="CreateLeave" component={CreateLeave} />
      <LeaveStack.Screen name="AdminCheckLeave" component={AdminCheckLeave} />
    </LeaveStack.Navigator>
  );
}

const BottomTabNavigator = () => {
    const colorScheme: ColorSchemeName = useColorScheme() || 'light';
    const insets = useSafeAreaInsets();

    const androidNavBarHeight = Platform.OS === 'android' ? 48 : 0;
    const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, androidNavBarHeight) : insets.bottom;

    const renderHeaderLeft = (text: string, style: object) => (
        <View style={styles.back_btn}>
            <Text style={style}>{text}</Text>
        </View>
    );

    return (
        <BottomTab.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors[colorScheme].tabIconSelected,
                tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
                tabBarStyle: Platform.OS === 'android' ? {
                    height: 40 + bottomInset,
                    paddingBottom: bottomInset + 2,
                    paddingTop: 2,
                    backgroundColor: colors.white,
                    borderTopWidth: 1,
                    borderTopColor: colors.gray200,
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    position: 'absolute',
                    bottom: 0,
                } : undefined,
                tabBarLabelStyle: Platform.OS === 'android' ? {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 1,
                } : {
                    fontSize: 10,
                    fontWeight: '500',
                },
                tabBarIconStyle: Platform.OS === 'android' ? {
                    width: 20,
                    height: 20,
                } : {
                    width: 24,
                    height: 24,
                },
                tabBarItemStyle: Platform.OS === 'android' ? {
                    paddingVertical: 2,
                } : {
                    paddingVertical: 4,
                },
            }}>
            <BottomTab.Screen
                name="Home"
                component={Home}
                options={{
                    title: 'Home',
                    headerTitle: '',
                    tabBarIcon: ({ size, color }) => (
                        <HomeIcon size={size} color={color} />
                    ),
                }}
            />
            <BottomTab.Screen
                name="Attendance"
                component={Attendance}
                options={{
                    title: 'Attendance',
                    headerTitle: '',
                    headerShown: true,
                    headerLeft: () => renderHeaderLeft("Attendance overview", styles.back_btn_text),
                    tabBarIcon: ({ size, color }) => (
                        <AttendanceIcon size={size} color={color} />
                    ),
                }}
            />
            <BottomTab.Screen
                name="Profile"
                component={Profile}
                options={{
                    title: 'Profile',
                    headerTitle: '',
                    headerShown: true,
                    headerLeft: () => renderHeaderLeft("Profile", styles.back_btn_text),
                    tabBarIcon: ({ size, color }) => (
                        <ProfileIcon size={size} color={color} />
                    ),
                }}
            />

            {/* 4. Pass the LeaveStackNavigator as the component here */}
            <BottomTab.Screen
                name="Leave"
                component={LeaveStackNavigator}
                options={{
                    title: 'Leave',
                    headerTitle: '',
                    headerShown: false,
                    tabBarIcon: ({ size, color }) => (
                        <LeaveIcon size={size} color={color} />
                    ),
                }}
            />
        </BottomTab.Navigator>
    );
};

export default BottomTabNavigator;

const styles = StyleSheet.create({
    back_btn_text: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 20,
        lineHeight: 28,
        color: colors.gray900,
    },
    back_btn: {
        width: 300,
        marginLeft: 24,
    },
});