import { formatDateTimeBySelectedLanguage } from '@/src/utils/format/FormatDateTime_Zones';
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
import CalendarLanguageUtils from '../../utils/cacheViewManagement/Calendar/CalendarLanguageUtils';

export default function TimetableScreen({ navigation, route }) {
    const { selectedDate, events, dateString } = route.params;

    // Language translations
    const [durationText, setDurationText] = useState('Thời lượng');
    const [dateText, setDateText] = useState('Ngày');
    const [startDateText, setStartDateText] = useState('Ngày bắt đầu');
    const [dueDateText, setDueDateText] = useState('Ngày đến hạn');
    const [endDateText, setEndDateText] = useState('Ngày kết thúc');
    const [closeText, setCloseText] = useState('Đóng');
    const [timetableText, setTimetableText] = useState('Thời gian biểu');
    const [overviewText, setOverviewText] = useState('Tổng quan');
    const [detailScheduleText, setDetailScheduleText] = useState('Lịch trình chi tiết');
    const [taskText, setTaskText] = useState('Công việc');
    const [meetingText, setMeetingText] = useState('Cuộc họp');
    const [callText, setCallText] = useState('Cuộc gọi');
    const [tasksText, setTasksText] = useState('Tasks');
    const [meetingsText, setMeetingsText] = useState('Meetings');
    const calendarLanguageUtils = CalendarLanguageUtils.getInstance();

    // Load translations
    useEffect(() => {
        const loadTranslations = async () => {
            try {
                // Now that we have mod_strings support, we can use the correct Calendar module keys
                const durationLabel = await calendarLanguageUtils.translate('LBL_DURATION');
                const dateLabel = await calendarLanguageUtils.translate('LBL_RESCHEDULE_DATE');
                const startDateLabel = await calendarLanguageUtils.translate('LBL_DATE');
                const dueDateLabel = await calendarLanguageUtils.translate('Expired');
                const endDateLabel = await calendarLanguageUtils.translate('LBL_SETTINGS_TIME_ENDS');
                const closeLabel = await calendarLanguageUtils.translate('LBL_CLOSE_BUTTON');
                
                // Use correct Calendar module keys
                const timetableLabel = await calendarLanguageUtils.translate('LBL_GENERAL_TAB');
                const overviewLabel = await calendarLanguageUtils.translate('LBL_EMAIL_SETTINGS_GENERAL');
                const detailScheduleLabel = await calendarLanguageUtils.translate('LBL_MODULE_NAME');
                const taskLabel = await calendarLanguageUtils.translate('LBL_TASKS');
                const meetingLabel = await calendarLanguageUtils.translate('LBL_MEETINGS');
                const callLabel = await calendarLanguageUtils.translate('LBL_CALLS');
                const tasksLabel = await calendarLanguageUtils.translate('LBL_TASKS');
                const meetingsLabel = await calendarLanguageUtils.translate('LBL_MEETINGS');

                setDurationText(durationLabel);
                setDateText(dateLabel);
                setStartDateText(startDateLabel);
                setDueDateText(dueDateLabel);
                setEndDateText(endDateLabel);
                setCloseText(closeLabel);
                setTimetableText(timetableLabel);
                setOverviewText(overviewLabel);
                setDetailScheduleText(detailScheduleLabel);
                setTaskText(taskLabel);
                setMeetingText(meetingLabel);
                setCallText(callLabel);
                setTasksText(tasksLabel);
                setMeetingsText(meetingsLabel);
            } catch (error) {
                console.error('Error loading timetable translations:', error);
                // Keep default values if translation fails
            }
        };

        loadTranslations();
    }, []);

    const handleEventPress = (event) => {
        // let details = `${startTimeText}: ${event.time}`;
        // if (event.endTime) {
        //     details += `\n${endTimeText}: ${event.endTime}`;
        // }
        // if (event.duration) {
        //     details += `\n${durationText}: ${event.duration}`;
        // }
        let details = `\n${dateText} ${dateString}`;

        // Hiển thị thông tin chi tiết từ rawData
        if (event.rawData && event.type === 'task') {
            const startDate_fm = formatDateTimeBySelectedLanguage(event.rawData.attributes.date_start);
            const dueDate_fm = formatDateTimeBySelectedLanguage(event.rawData.attributes.date_due);
            details += `\n${startDateText}: ${startDate_fm}`;
            details += `\n${dueDateText}: ${dueDate_fm}`;
        } else if (event.rawData && event.type === 'meeting') {
            const startDate_fm = formatDateTimeBySelectedLanguage(event.rawData.attributes.date_start);
            const endDate_fm = formatDateTimeBySelectedLanguage(event.rawData.attributes.date_end);
            details += `\n${startDateText}: ${startDate_fm}`;
            details += `\n${endDateText} ${endDate_fm}`;
            details += `\n${durationText}: ${event.rawData.attributes.duration_hours}h ${event.rawData.attributes.duration_minutes}m`;
        }else if (event.rawData && event.type === 'call') {
            const startDate_fm = formatDateTimeBySelectedLanguage(event.rawData.attributes.date_start);
            const endDate_fm = formatDateTimeBySelectedLanguage(event.rawData.attributes.date_end);
            details += `\n${startDateText}: ${startDate_fm}`;
            details += `\n${endDateText} ${endDate_fm}`;
            details += `\n${durationText}: ${event.rawData.attributes.duration_hours}h ${event.rawData.attributes.duration_minutes}m`;
        }

        const eventTypeText = event.type === 'task' ? taskText : meetingText;
        Alert.alert(
            `${eventTypeText}: ${event.title}`,
            details,
            [
                {
                    text: closeText,
                    style: 'cancel'
                },
                {
                    text: 'Xem chi tiết',
                    onPress: () => {
                        // Navigate to detail screen based on type
                        if (event.type === 'task') {
                            navigation.navigate('ModuleDetailScreen', { moduleName: 'Tasks', recordId: event.rawData.id });
                        } else if (event.type === 'meeting') {
                            navigation.navigate('ModuleDetailScreen', { moduleName: 'Meetings', recordId: event.rawData.id });
                        } else if (event.type === 'call') {
                            navigation.navigate('ModuleDetailScreen', { moduleName: 'Calls', recordId: event.rawData.id });
                        }
                    }
                }
            ]
        );
    };

    const getEventsByHour = () => {
        const eventsByHour = {};
        events.forEach(event => {
            const hour = event.time.split(':')[0];
            if (!eventsByHour[hour]) {
                eventsByHour[hour] = [];
            }
            eventsByHour[hour].push(event);
        });
        return eventsByHour;
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 6; hour <= 22; hour++) {
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            const eventsInHour = events.filter(event => 
                event.time.startsWith(hour.toString().padStart(2, '0'))
            );
            
            slots.push({
                time: timeString,
                hour: hour,
                events: eventsInHour
            });
        }
        return slots;
    };

    const EventCard = ({ event }) => (
        <TouchableOpacity
            style={[
                styles.eventCard,
                event.type === 'task' ? { backgroundColor: '#FFE5E5' }
                : event.type === 'meeting' ? { backgroundColor: '#E5F7F5' }
                : { backgroundColor: '#FFFACD' }
            ]}
            onPress={() => handleEventPress(event)}
            activeOpacity={0.7}
        >
            <View style={styles.eventHeader}>
                <View style={[
                    styles.eventTypeIcon,
                    event.type === 'task' ? { backgroundColor: '#FF6B6B' }
                    : event.type === 'meeting' ? { backgroundColor: '#4ECDC4' }
                    : { backgroundColor: '#FFD700' }
                ]}>
                    <Ionicons
                        name={event.type === 'task' ? 'checkmark-circle'
                            : event.type === 'meeting' ? 'people'
                            : 'call'}
                        size={16}
                        color="white"
                    />
                </View>
                <Text style={styles.eventTime}>
                    {event.time}
                    {event.endTime && ` - ${event.endTime}`}
                </Text>
                <Text style={[
                    styles.eventTypeText,
                    event.type === 'task' ? { color: '#FF6B6B' }
                    : event.type === 'meeting' ? { color: '#4ECDC4' }
                    : { color: '#FFD700' }
                ]}>
                    {event.type === 'task' ? taskText
                        : event.type === 'meeting' ? meetingText
                        : callText}
                </Text>
            </View>
            <Text style={styles.eventTitle}>{event.title}</Text>
            {event.duration && (
                <Text style={styles.eventDuration}>
                    Thời lượng: {event.duration}
                </Text>
            )}
            <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#1e1e1e" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{timetableText}</Text>
                    <Text style={styles.headerSubtitle}>{dateString}</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>{overviewText}</Text>
                    <View style={styles.summaryContent}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#FF6B6B' }]}>
                                <Ionicons name="checkmark-circle" size={16} color="white" />
                            </View>
                            <Text style={styles.summaryText}>
                                {events.filter(e => e.type === 'task').length} {tasksText}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#4ECDC4' }]}>
                                <Ionicons name="people" size={16} color="white" />
                            </View>
                            <Text style={styles.summaryText}>
                                {events.filter(e => e.type === 'meeting').length} {meetingsText}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#FFD700' }]}>
                                <Ionicons name="call" size={16} color="white" />
                            </View>
                            <Text style={styles.summaryText}>
                                {events.filter(e => e.type === 'call').length} {callText}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Timeline */}
                <View style={styles.timelineContainer}>
                    <Text style={styles.sectionTitle}>{detailScheduleText}</Text>
                    
                    {generateTimeSlots().map((slot, index) => (
                        <View key={index} style={styles.timeSlot}>
                            <View style={styles.timeColumn}>
                                <Text style={[
                                    styles.timeText,
                                    slot.events.length > 0 && styles.timeTextActive
                                ]}>
                                    {slot.time}
                                </Text>
                                {slot.events.length > 0 && (
                                    <View style={styles.timeDot} />
                                )}
                            </View>
                            
                            <View style={styles.eventsColumn}>
                                {slot.events.length > 0 ? (
                                    slot.events.map((event, eventIndex) => (
                                        <EventCard key={eventIndex} event={event} />
                                    ))
                                ) : (
                                    <View style={styles.emptySlot} />
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Quick Actions
                <View style={styles.quickActionsContainer}>
                    <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="add-circle" size={24} color="#4B84FF" />
                            <Text style={styles.actionText}>Thêm Task</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="calendar" size={24} color="#4ECDC4" />
                            <Text style={styles.actionText}>Thêm Meeting</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="time" size={24} color="#FF9800" />
                            <Text style={styles.actionText}>Nhắc nhở</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="share" size={24} color="#9C27B0" />
                            <Text style={styles.actionText}>Chia sẻ</Text>
                        </TouchableOpacity>
                    </View>
                </View> */}

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
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#BFAAA1',
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
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    scrollContainer: {
        flex: 1,
    },
    summaryCard: {
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
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    summaryContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    summaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    timelineContainer: {
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    timeSlot: {
        flexDirection: 'row',
        marginBottom: 15,
        minHeight: 40,
    },
    timeColumn: {
        width: 60,
        alignItems: 'center',
        paddingTop: 5,
        position: 'relative',
    },
    timeText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    timeTextActive: {
        color: '#4B84FF',
        fontWeight: 'bold',
    },
    timeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4B84FF',
        marginTop: 5,
    },
    eventsColumn: {
        flex: 1,
        marginLeft: 15,
    },
    emptySlot: {
        height: 30,
        borderLeftWidth: 2,
        borderLeftColor: '#f0f0f0',
        marginLeft: 10,
    },
    eventCard: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#4B84FF',
        position: 'relative',
    },
    eventHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventTypeIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    eventTime: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        marginRight: 8,
    },
    eventTypeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    eventTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    eventDuration: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 4,
    },
    moreButton: {
        position: 'absolute',
        right: 12,
        top: '50%',
        marginTop: -8,
    },
    quickActionsContainer: {
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
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '22%',
        aspectRatio: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 10,
    },
    actionText: {
        fontSize: 10,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    bottomSpacing: {
        height: 30,
    },
});
