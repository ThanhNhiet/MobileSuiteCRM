import { useCallback, useEffect, useState } from 'react';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import {
    getMeetingsByMonthApi,
    getMeetingsLanguageApi,
    getTasksByMonthApi,
    getTasksLanguageApi
} from '../../api/calendar/TaskMeetingApi';

export const useCalendar = () => {
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    
    // State management
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [combinedEvents, setCombinedEvents] = useState({});
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Language labels cache - only load once per session
    const [taskLabels, setTaskLabels] = useState(null);
    const [meetingLabels, setMeetingLabels] = useState(null);
    const [labelsLoaded, setLabelsLoaded] = useState(false);

    // Utility functions
    const getTimeFromDateTime = (datetime) => {
        const date = new Date(datetime);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const getDateFromDateTime = (datetime) => {
        const date = new Date(datetime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDateKey = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getMonthDateRange = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 1);
        
        return {
            startDate: formatDateKey(startDate),
            endDate: formatDateKey(endDate)
        };
    };

    // Load language labels once
    const loadLanguageLabels = useCallback(async () => {
        if (labelsLoaded) return;

        try {
            const [tasksLang, meetingsLang] = await Promise.all([
                getTasksLanguageApi(),
                getMeetingsLanguageApi()
            ]);

            setTaskLabels(tasksLang);
            setMeetingLabels(meetingsLang);
            setLabelsLoaded(true);
        } catch (error) {
            console.error('Error loading language labels:', error);
            const errorMessage = await systemLanguageUtils.translate('LBL_EMAIL_LOADING') || 'Không thể tải nhãn ngôn ngữ';
            setError(errorMessage);
        }
    }, [labelsLoaded]);

    // Get translated label for field
    const getFieldLabel = useCallback((module, fieldKey) => {
        if (module === 'Tasks' && taskLabels && taskLabels.data) {
            return taskLabels.data[`LBL_${fieldKey.toUpperCase()}`] || fieldKey;
        }
        if (module === 'Meetings' && meetingLabels && meetingLabels.data) {
            return meetingLabels.data[`LBL_${fieldKey.toUpperCase()}`] || fieldKey;
        }
        return fieldKey;
    }, [taskLabels, meetingLabels]);

    // Combine tasks and meetings into events by date
    const combineEventsData = useCallback((tasksData, meetingsData) => {
        const eventsMap = {};

        // Process Tasks
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
                endTime: task.attributes.date_due ? getTimeFromDateTime(task.attributes.date_due) : null,
                rawData: task,
                module: 'Tasks'
            });
        });

        // Process Meetings
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
                endTime: meeting.attributes.date_end ? getTimeFromDateTime(meeting.attributes.date_end) : null,
                rawData: meeting,
                module: 'Meetings'
            });
        });

        // Sort events by time within each day
        Object.keys(eventsMap).forEach(date => {
            eventsMap[date].sort((a, b) => a.time.localeCompare(b.time));
        });

        return eventsMap;
    }, []);

    // Load calendar data for specific month
    const loadCalendarData = useCallback(async (targetDate = currentDate, isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Ensure language labels are loaded first
            await loadLanguageLabels();

            const { startDate, endDate } = getMonthDateRange(targetDate);

            // Load tasks and meetings for the month
            const [tasksResponse, meetingsResponse] = await Promise.all([
                getTasksByMonthApi(startDate, endDate),
                getMeetingsByMonthApi(startDate, endDate)
            ]);

            const tasksData = tasksResponse.data || [];
            const meetingsData = meetingsResponse.data || [];

            setTasks(tasksData);
            setMeetings(meetingsData);

            // Combine data into events
            const combined = combineEventsData(tasksData, meetingsData);
            setCombinedEvents(combined);

        } catch (error) {
            console.error('Error loading calendar data:', error);
            const errorMessage = await systemLanguageUtils.translate('LBL_LOADING_PAGE') || 'Không thể tải dữ liệu lịch';
            setError(errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentDate, loadLanguageLabels, combineEventsData]);

    // Navigation functions
    const goToPreviousMonth = useCallback(() => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() - 1);
        setCurrentDate(newDate);
        loadCalendarData(newDate);
    }, [currentDate, loadCalendarData]);

    const goToNextMonth = useCallback(() => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + 1);
        setCurrentDate(newDate);
        loadCalendarData(newDate);
    }, [currentDate, loadCalendarData]);

    const goToToday = useCallback(() => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
        loadCalendarData(today);
    }, [loadCalendarData]);

    // Refresh function for RefreshControl
    const onRefresh = useCallback(() => {
        loadCalendarData(currentDate, true);
    }, [currentDate, loadCalendarData]);

    // Calendar utility functions
    const getDaysInMonth = useCallback((date) => {
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
    }, []);

    const hasEventsOnDate = useCallback((date) => {
        if (!date) return false;
        const dateKey = formatDateKey(date);
        return combinedEvents[dateKey] && combinedEvents[dateKey].length > 0;
    }, [combinedEvents]);

    const isToday = useCallback((date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }, []);

    const isSelectedDate = useCallback((date) => {
        if (!date) return false;
        return date.toDateString() === selectedDate.toDateString();
    }, [selectedDate]);

    const getEventsForDate = useCallback((date) => {
        const dateKey = formatDateKey(date);
        return combinedEvents[dateKey] || [];
    }, [combinedEvents]);

    const getTodayEvents = useCallback(() => {
        return getEventsForDate(new Date());
    }, [getEventsForDate]);

    const getSelectedDateEvents = useCallback(() => {
        return getEventsForDate(selectedDate);
    }, [getEventsForDate, selectedDate]);

    // Initial load
    useEffect(() => {
        loadCalendarData();
    }, []);

    return {
        // State
        currentDate,
        selectedDate,
        setSelectedDate,
        tasks,
        meetings,
        combinedEvents,
        loading,
        refreshing,
        error,
        labelsLoaded,

        // Language functions
        getFieldLabel,

        // Data functions
        loadCalendarData,
        onRefresh,

        // Navigation functions
        goToPreviousMonth,
        goToNextMonth,
        goToToday,

        // Calendar utility functions
        getDaysInMonth,
        hasEventsOnDate,
        isToday,
        isSelectedDate,
        getEventsForDate,
        getTodayEvents,
        getSelectedDateEvents,
        formatDateKey,

        // Date formatting utilities
        getTimeFromDateTime,
        getDateFromDateTime
    };
};
