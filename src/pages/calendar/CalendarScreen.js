import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CalendarScreen({ navigation }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [combinedEvents, setCombinedEvents] = useState({});

    // Dữ liệu mẫu cho Tasks
    const sampleTasks = [
        {
            id: 1,
            attributes: {
                name: 'Hoàn thành báo cáo',
                date_start: '2025-07-10 09:00:00',
                date_due: '2025-07-10 17:00:00'
            }
        },
        {
            id: 3,
            attributes: {
                name: 'Gọi khách hàng',
                date_start: '2025-07-12 10:30:00',
                date_due: '2025-07-12 11:00:00'
            }
        },
        {
            id: 5,
            attributes: {
                name: 'Chuẩn bị thuyết trình',
                date_start: '2025-07-15 08:00:00',
                date_due: '2025-07-15 10:00:00'
            }
        },
        {
            id: 7,
            attributes: {
                name: 'Review code',
                date_start: '2025-07-18 16:00:00',
                date_due: '2025-07-18 17:30:00'
            }
        },
        {
            id: 8,
            attributes: {
                name: 'Kiểm tra inventory',
                date_start: '2025-07-22 11:00:00',
                date_due: '2025-07-22 12:00:00'
            }
        }
    ];

    // Dữ liệu mẫu cho Meetings
    const sampleMeetings = [
        {
            id: 2,
            attributes: {
                name: 'Họp team',
                date_start: '2025-07-10 14:00:00',
                date_end: '2025-07-10 15:30:00',
                duration_hours: 1,
                duration_minutes: 30
            }
        },
        {
            id: 4,
            attributes: {
                name: 'Họp với đối tác',
                date_start: '2025-07-12 15:30:00',
                date_end: '2025-07-12 16:30:00',
                duration_hours: 1,
                duration_minutes: 0
            }
        },
        {
            id: 6,
            attributes: {
                name: 'Meeting với khách hàng',
                date_start: '2025-07-18 13:00:00',
                date_end: '2025-07-18 14:00:00',
                duration_hours: 1,
                duration_minutes: 0
            }
        }
    ];

    // Function để chuyển đổi datetime thành time string
    const getTimeFromDateTime = (datetime) => {
        const date = new Date(datetime);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    // Function để chuyển đổi datetime thành date string
    const getDateFromDateTime = (datetime) => {
        const date = new Date(datetime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Function để kết hợp tasks và meetings thành events theo ngày
    const combineEventsData = (tasksData, meetingsData) => {
        const eventsMap = {};

        // Xử lý Tasks
        tasksData.forEach(task => {
            const dateKey = getDateFromDateTime(task.attributes.date_start);
            if (!eventsMap[dateKey]) {
                eventsMap[dateKey] = [];
            }
            eventsMap[dateKey].push({
                id: task.id,
                type: 'task',
                title: task.attributes.name,
                time: getTimeFromDateTime(task.attributes.date_start),
                endTime: getTimeFromDateTime(task.attributes.date_due),
                rawData: task
            });
        });

        // Xử lý Meetings
        meetingsData.forEach(meeting => {
            const dateKey = getDateFromDateTime(meeting.attributes.date_start);
            if (!eventsMap[dateKey]) {
                eventsMap[dateKey] = [];
            }
            eventsMap[dateKey].push({
                id: meeting.id,
                type: 'meeting',
                title: meeting.attributes.name,
                time: getTimeFromDateTime(meeting.attributes.date_start),
                endTime: getTimeFromDateTime(meeting.attributes.date_end),
                duration: `${meeting.attributes.duration_hours}h ${meeting.attributes.duration_minutes}m`,
                rawData: meeting
            });
        });

        // Sắp xếp events theo thời gian trong mỗi ngày
        Object.keys(eventsMap).forEach(date => {
            eventsMap[date].sort((a, b) => a.time.localeCompare(b.time));
        });

        return eventsMap;
    };

    useEffect(() => {
        // TODO: Thay thế bằng API calls thật
        // Simulate loading data from API
        setTasks(sampleTasks);
        setMeetings(sampleMeetings);

        // Kết hợp dữ liệu
        const combined = combineEventsData(sampleTasks, sampleMeetings);
        setCombinedEvents(combined);

        /*
        // Example API integration:
        const loadTasksAndMeetings = async () => {
            try {
                // Load tasks from API
                const tasksResponse = await fetch('/api/tasks');
                const tasksData = await tasksResponse.json();
                setTasks(tasksData);

                // Load meetings from API  
                const meetingsResponse = await fetch('/api/meetings');
                const meetingsData = await meetingsResponse.json();
                setMeetings(meetingsData);

                // Combine data
                const combined = combineEventsData(tasksData, meetingsData);
                setCombinedEvents(combined);
            } catch (error) {
                console.error('Error loading data:', error);
                Alert.alert('Lỗi', 'Không thể tải dữ liệu lịch');
            }
        };

        loadTasksAndMeetings();
        */
    }, []);

    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const formatDateKey = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const hasEventsOnDate = (date) => {
        if (!date) return false;
        const dateKey = formatDateKey(date);
        return combinedEvents[dateKey] && combinedEvents[dateKey].length > 0;
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelectedDate = (date) => {
        if (!date) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const goToPreviousMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const handleDatePress = (date) => {
        if (!date) return;

        setSelectedDate(date);
        const dateKey = formatDateKey(date);
        const events = combinedEvents[dateKey];

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

    const getTodayEvents = () => {
        const todayKey = formatDateKey(new Date());
        return combinedEvents[todayKey] || [];
    };

    const getSelectedDateEvents = () => {
        const selectedKey = formatDateKey(selectedDate);
        return combinedEvents[selectedKey] || [];
    };

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
                    onPress={() => {
                        const today = new Date();
                        setCurrentDate(today);
                        setSelectedDate(today);
                    }}
                >
                    <Text style={styles.todayButtonText}>Hôm nay</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
});
