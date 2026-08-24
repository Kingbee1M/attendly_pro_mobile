import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/hooks/hooks';
import Colors from "@/constants/Colors";
import { RoleEnum } from "@/enums/role.enum"; // Adjust import path
import AgentsLeaveUI from '@/components/AgentsLeaveScreen';
import AdminLeaveUI from '@/components/AdminLeaveUI';

export default function LeaveScreen() {
    const colorScheme = useColorScheme() || 'light';
    const currentColors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    // Read logged-in user from auth slice
    const { logindata, loginisLoading } = useAppSelector((state: any) => state.clock);
    const role = logindata.data?.user?.role;
    const isAgent = role === RoleEnum.AGENT;

    return (
        <View 
            style={[
                styles.container, 
                { 
                    backgroundColor: currentColors.background,
                    paddingTop: insets.top
                }
            ]}
        >
            {isAgent ? <AgentsLeaveUI /> : <AdminLeaveUI />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});