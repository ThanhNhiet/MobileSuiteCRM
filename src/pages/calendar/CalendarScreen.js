import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCalendar } from '../../services/useApi/calendar/UseCalendar';

export default function CalendarScreen({ navigation }) {
    // Use the custom calendar hook
    const {
        currentDate,
        selectedDate,
        setSelectedDate,
        combinedEvents,
        loading,
        refreshing,
        error,
        onRefresh,
        goToPreviousMonth,
        goToNextMonth,
        goToToday,
        getDaysInMonth,
        hasEventsOnDate,
        isToday,
        isSelectedDate,
        getEventsForDate,
        formatDateKey
    } = useCalendar();

    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const handleDatePress = (date) => {
        if (!date) return;

        setSelectedDate(date);
        const dateKey = formatDateKey(date);
        const events = getEventsForDate(date);

        if (events && events.length > 0) {
            // Navigate to TimeTableScreen with the selected date and events
            navigation.navigate('TimetableScreen', {
                selectedDate: dateKey,
                events: events,
                dateString: date.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            });
        } else {
            Alert.alert(
                'Thông báo',
                `Không có lịch trình nào trong ngày ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
            );
        }
    };

    const renderCalendarDay = (date, index) => {
        if (!date) {
            return <View key={index} style={styles.emptyDay} />;
        }

        const hasEvents = hasEventsOnDate(date);
        const isTodayDate = isToday(date);
        const isSelected = isSelectedDate(date);

        return (
            <TouchableOpacity
                key={index}
                style={[
                    styles.dayContainer,
                    hasEvents && styles.dayWithEvents,
                    isTodayDate && styles.today,
                    isSelected && styles.selectedDay
                ]}
                onPress={() => handleDatePress(date)}
                activeOpacity={0.7}
            >
                <Text style={[
                    styles.dayText,
                    hasEvents && styles.dayWithEventsText,
                    isTodayDate && styles.todayText,
                    isSelected && styles.selectedDayText
                ]}>
                    {date.getDate()}
                </Text>
                {hasEvents && (
                    <View style={styles.eventIndicator} />
                )}
            </TouchableOpacity>
        );
    };

    // Show loading state
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#4B84FF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Lịch công việc</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4B84FF" />
                    <Text style={styles.loadingText}>Đang tải dữ liệu lịch...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#4B84FF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch công việc</Text>
                <TouchableOpacity
                    style={styles.todayButton}
                    onPress={goToToday}
                >
                    <Text style={styles.todayButtonText}>Hôm nay</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.scrollContainer} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4B84FF']}
                        title="Kéo để tải lại..."
                        titleColor="#666"
                    />
                }
            >
                {/* Calendar Navigation */}
                <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                        <Ionicons name="chevron-back" size={24} color="#4B84FF" />
                    </TouchableOpacity>

                    <Text style={styles.monthYear}>
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </Text>

                    <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                        <Ionicons name="chevron-forward" size={24} color="#4B84FF" />
                    </TouchableOpacity>
                </View>

                {/* Error Display */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="warning-outline" size={20} color="#FF6B6B" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                            <Text style={styles.retryButtonText}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Day Names */}
                <View style={styles.dayNamesContainer}>
                    {dayNames.map((dayName, index) => (
                        <View key={index} style={styles.dayNameContainer}>
                            <Text style={styles.dayName}>{dayName}</Text>
                        </View>
                    ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGrid}>
                    {getDaysInMonth(currentDate).map((date, index) =>
                        renderCalendarDay(date, index)
                    )}
                </View>

                {/* Legend */}
                <View style={styles.legendSection}>
                    <Text style={styles.sectionTitle}>Chú thích</Text>
                    <View style={styles.legendContainer}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#E3F2FD' }]} />
                            <Text style={styles.legendText}>Ngày có lịch trình</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
                            <Text style={styles.legendText}>Task</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: '#4ECDC4' }]} />
                            <Text style={styles.legendText}>Meeting</Text>
                        </View>
                    </View>
                </View>

                {/* Bottom spacing */}
                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    todayButton: {
        position: 'absolute',
        right: 20,
        top: 15, // hoặc dùng bottom: 15 nếu cần
        backgroundColor: '#4B84FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    todayButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    scrollContainer: {
        flex: 1,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    navButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    monthYear: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    dayNamesContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 15,
        marginTop: 10,
        borderRadius: 12,
        paddingVertical: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
    },
    dayNameContainer: {
        flex: 1,
        alignItems: 'center',
    },
    dayName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: 'white',
        marginHorizontal: 15,
        marginTop: 5,
        borderRadius: 12,
        padding: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    dayContainer: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 2,
        position: 'relative',
    },
    emptyDay: {
        width: '14.28%',
        aspectRatio: 1,
    },
    dayWithEvents: {
        backgroundColor: '#E3F2FD',
    },
    today: {
        backgroundColor: '#4B84FF',
    },
    selectedDay: {
        backgroundColor: '#FFF3E0',
        borderWidth: 2,
        borderColor: '#FF9800',
    },
    dayText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    dayWithEventsText: {
        color: '#1976D2',
        fontWeight: '600',
    },
    todayText: {
        color: 'white',
        fontWeight: 'bold',
    },
    selectedDayText: {
        color: '#FF9800',
        fontWeight: 'bold',
    },
    eventIndicator: {
        position: 'absolute',
        bottom: 3,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4B84FF',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    eventsContainer: {
        gap: 10,
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#4B84FF',
    },
    eventTypeIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    eventContent: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    eventTime: {
        fontSize: 12,
        color: '#666',
    },
    eventType: {
        fontSize: 12,
        color: '#4B84FF',
        fontWeight: '600',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    noEventsContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    noEventsText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
    legendSection: {
        backgroundColor: 'white',
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 12,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    legendContainer: {
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 10,
    },
    legendText: {
        fontSize: 14,
        color: '#666',
    },
    bottomSpacing: {
        height: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFE5E5',
        padding: 15,
        marginHorizontal: 15,
        marginTop: 10,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B6B',
    },
    errorText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#D32F2F',
        lineHeight: 20,
    },
    retryButton: {
        backgroundColor: '#4B84FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
