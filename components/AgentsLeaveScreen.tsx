import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    useColorScheme, 
    ActivityIndicator, 
    RefreshControl,
    TouchableOpacity,
    ScrollView
} from "react-native";
import { useDispatch, useSelector } from 'react-redux';
import Colors from "@/constants/Colors";
import { colors } from "@/css/colorsIndex";
import { fetchMyLeaveRequests } from "@/features/leave/leaveSlice";
import { RootState, AppDispatch } from "@/utils/store";
import { LeaveStatus } from "@/enums/leaveStatus.enum";
import { PlusIcon } from '@/assets/svg/PlusIcon';

const STATUS_FILTERS = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: LeaveStatus.PENDING },
    { label: 'Approved', value: LeaveStatus.APPROVED },
    { label: 'Rejected', value: LeaveStatus.REJECTED },
];

export default function AgentsLeaveUI() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentColors = Colors[colorScheme];
    const navigation = useNavigation<any>();
    const dispatch = useDispatch<AppDispatch>();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

    const { myLeaveRequests, isLoading, error } = useSelector(
        (state: RootState) => state.leave
    );

    useEffect(() => {
        dispatch(fetchMyLeaveRequests());
    }, [dispatch]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await dispatch(fetchMyLeaveRequests());
        setRefreshing(false);
    }, [dispatch]);

    // Client-side filtering via useMemo
    const filteredMyRequests = useMemo(() => {
        if (!myLeaveRequests) return [];
        if (selectedStatus === 'ALL') return myLeaveRequests;
        return myLeaveRequests.filter(item => item?.status === selectedStatus);
    }, [myLeaveRequests, selectedStatus]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case LeaveStatus.APPROVED:
                return { bg: '#E6F4EA', text: '#137333' };
            case LeaveStatus.REJECTED:
                return { bg: '#FCE8E6', text: '#C5221F' };
            default:
                return { bg: '#FEF7E0', text: '#B06000' };
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const cardBg = isDark ? '#1C1C1E' : colors.white;
    const tabBg = isDark ? '#2C2C2E' : '#F3F4F6';

    return (
        <View style={[styles.container, { backgroundColor: currentColors.background }]}>
            <Text style={styles.headerTitle}>
                My Leave Requests
            </Text>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {STATUS_FILTERS.map((tab) => {
                        const isActive = selectedStatus === tab.value;
                        return (
                            <TouchableOpacity
                                key={tab.value}
                                onPress={() => setSelectedStatus(tab.value)}
                                style={[
                                    styles.filterTab,
                                    { backgroundColor: isActive ? colors.accent_blue : tabBg },
                                ]}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        { color: isActive ? '#FFFFFF' : isDark ? '#A1A1A6' : colors.gray600 },
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2171FF" />
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Text style={{ color: isDark ? colors.white : colors.gray900 }}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredMyRequests}
                    keyExtractor={(item, index) => item?.id || String(index)}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh}
                            colors={["#2171FF"]}
                            tintColor="#2171FF"
                        />
                    }
                    renderItem={({ item }) => {
                        const statusTheme = getStatusStyle(item?.status);
                        return (
                            <TouchableOpacity 
                                style={[styles.card, { backgroundColor: cardBg }]}
                                onPress={() => {
                                    navigation.navigate('LeaveMessage', { id: item.id });
                                }}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.leaveType, { color: isDark ? colors.white : colors.gray900 }]}>
                                        {item?.leaveType}
                                    </Text>
                                    <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                                        <Text style={[styles.statusText, { color: statusTheme.text }]}>
                                            {item?.status || 'PENDING'}
                                        </Text>
                                    </View>
                                </View>

                                {item?.reason ? (
                                    <Text style={[styles.reasonText, { color: isDark ? '#A1A1A6' : colors.gray600 }]}>
                                        {item.reason}
                                    </Text>
                                ) : null}

                                <View style={styles.dateRow}>
                                    <Text style={styles.dateLabel}>Duration:</Text>
                                    <Text style={[styles.dateValue, { color: isDark ? colors.white : colors.gray800 }]}>
                                        {formatDate(item?.startDate)} — {formatDate(item?.endDate)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text style={{ color: colors.gray500 }}>No leave requests found for this filter.</Text>
                        </View>
                    }
                />
            )}

            {!isLoading && (
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate('CreateLeave');
                    }}
                    style={styles.createButton}
                    activeOpacity={0.85}
                >
                    <PlusIcon size={30} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        color: colors.accent_blue
    },
    filterContainer: {
        marginBottom: 16,
    },
    filterScroll: {
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    listContent: {
        paddingBottom: 100, // Extra padding so cards aren't covered by FAB button
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    leaveType: {
        fontSize: 16,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    reasonText: {
        fontSize: 14,
        marginBottom: 12,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    dateLabel: {
        fontSize: 12,
        color: colors.gray500,
        marginRight: 6,
    },
    dateValue: {
        fontSize: 13,
        fontWeight: '500',
    },
    createButton: {
        backgroundColor: colors.accent_blue,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        zIndex: 20,
        bottom: 100,
        right: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});