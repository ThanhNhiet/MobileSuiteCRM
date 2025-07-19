import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TimetableScreen({ navigation, route }) {
    const { selectedDate, events, dateString } = route.params;

    const handleEventPress = (event) => {
        let details = `Thời gian bắt đầu: ${event.time}`;
        if (event.endTime) {
            details += `\nThời gian kết thúc: ${event.endTime}`;
        }
        if (event.duration) {
            details += `\nThời lượng: ${event.duration}`;
        }
        details += `\nNgày: ${dateString}`;

        // Hiển thị thông tin chi tiết từ rawData
        if (event.rawData && event.type === 'task') {
            details += `\nNgày bắt đầu: ${event.rawData.attributes.date_start}`;
            details += `\nNgày đến hạn: ${event.rawData.attributes.date_due}`;
        } else if (event.rawData && event.type === 'meeting') {
            details += `\nNgày bắt đầu: ${event.rawData.attributes.date_start}`;
            details += `\nNgày kết thúc: ${event.rawData.attributes.date_end}`;
            details += `\nThời lượng: ${event.rawData.attributes.duration_hours}h ${event.rawData.attributes.duration_minutes}m`;
        }

        Alert.alert(
            `${event.type === 'task' ? 'Task' : 'Meeting'}: ${event.title}`,
            details,
            [
                {
                    text: 'Đóng',
                    style: 'cancel'
                },
                {
                    text: 'Xem chi tiết',
                    onPress: () => {
                        // Navigate to detail screen based on type
                        if (event.type === 'task') {
                            // navigation.navigate('TaskDetailScreen', { taskId: event.id, taskData: event.rawData });
                            Alert.alert('Thông báo', event.id);
                        } else {
                            // navigation.navigate('MeetingDetailScreen', { meetingId: event.id, meetingData: event.rawData });
                            Alert.alert('Thông báo', event.id);
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
                { backgroundColor: event.type === 'task' ? '#FFE5E5' : '#E5F7F5' }
            ]}
            onPress={() => handleEventPress(event)}
            activeOpacity={0.7}
        >
            <View style={styles.eventHeader}>
                <View style={[
                    styles.eventTypeIcon,
                    { backgroundColor: event.type === 'task' ? '#FF6B6B' : '#4ECDC4' }
                ]}>
                    <Ionicons
                        name={event.type === 'task' ? 'checkmark-circle' : 'people'}
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
                    { color: event.type === 'task' ? '#FF6B6B' : '#4ECDC4' }
                ]}>
                    {event.type === 'task' ? 'Task' : 'Meeting'}
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
                    <Ionicons name="arrow-back" size={24} color="#4B84FF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Thời gian biểu</Text>
                    <Text style={styles.headerSubtitle}>{dateString}</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Tổng quan</Text>
                    <View style={styles.summaryContent}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#FF6B6B' }]}>
                                <Ionicons name="checkmark-circle" size={16} color="white" />
                            </View>
                            <Text style={styles.summaryText}>
                                {events.filter(e => e.type === 'task').length} Tasks
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#4ECDC4' }]}>
                                <Ionicons name="people" size={16} color="white" />
                            </View>
                            <Text style={styles.summaryText}>
                                {events.filter(e => e.type === 'meeting').length} Meetings
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Timeline */}
                <View style={styles.timelineContainer}>
                    <Text style={styles.sectionTitle}>Lịch trình chi tiết</Text>
                    
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
