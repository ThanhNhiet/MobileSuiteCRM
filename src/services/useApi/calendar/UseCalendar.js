import { useCallback, useEffect, useState } from 'react';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import {
    getCallsByMonthApi,
    getCallsLanguageApi,
    getMeetingsByMonthApi,
    getMeetingsLanguageApi,
    getTasksByMonthApi,
    getTasksLanguageApi
} from '../../api/calendar/Task_Meeting_CallsApi';

export const useCalendar = () => {
    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    // State management
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [calls, setCalls] = useState([]);
    const [combinedEvents, setCombinedEvents] = useState({});
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Language labels cache - only load once per session
    const [taskLabels, setTaskLabels] = useState(null);
    const [meetingLabels, setMeetingLabels] = useState(null);
    const [callLabels, setCallLabels] = useState(null);
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

    // Load language labels once with error handling for individual modules
    const loadLanguageLabels = useCallback(async () => {
        if (labelsLoaded) return;

        let hasTaskLabels = false, hasMeetingLabels = false, hasCallLabels = false;
        
        // Load Tasks language
        try {
            const tasksLang = await getTasksLanguageApi();
            setTaskLabels(tasksLang);
            hasTaskLabels = true;
        } catch (taskError) {
            console.log('Failed to load Tasks language:', taskError.message);
            // Continue with default labels
        }
        
        // Load Meetings language
        try {
            const meetingsLang = await getMeetingsLanguageApi();
            setMeetingLabels(meetingsLang);
            hasMeetingLabels = true;
        } catch (meetingError) {
            console.log('Failed to load Meetings language:', meetingError.message);
            // Continue with default labels
        }
        
        // Load Calls language
        try {
            const callsLang = await getCallsLanguageApi();
            setCallLabels(callsLang);
            hasCallLabels = true;
        } catch (callError) {
            console.log('Failed to load Calls language:', callError.message);
            // Continue with default labels
        }
        
        // Mark as loaded if we got at least some language data
        if (hasTaskLabels || hasMeetingLabels || hasCallLabels) {
            setLabelsLoaded(true);
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
        if (module === 'Calls' && callLabels && callLabels.data) {
            return callLabels.data[`LBL_${fieldKey.toUpperCase()}`] || fieldKey;
        }
        return fieldKey;
    }, [taskLabels, meetingLabels, callLabels]);

    // Combine tasks and meetings into events by date
    const combineEventsData = useCallback((tasksData, meetingsData, callsData) => {
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

        // Process Calls
        if (Array.isArray(callsData)) {
            callsData.forEach(call => {
                const dateKey = getDateFromDateTime(call.attributes.date_start);
                if (!eventsMap[dateKey]) {
                    eventsMap[dateKey] = [];
                }
                eventsMap[dateKey].push({
                    id: call.id,
                    type: 'call',
                    title: call.attributes.name,
                    time: getTimeFromDateTime(call.attributes.date_start),
                    endTime: call.attributes.date_end ? getTimeFromDateTime(call.attributes.date_end) : null,
                    rawData: call,
                    module: 'Calls'
                });
            });
        }

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

            // Load tasks, meetings and calls independently to handle partial failures
            let tasksData = [], meetingsData = [], callsData = [];
            
            try {
                const tasksResponse = await getTasksByMonthApi(startDate, endDate);
                tasksData = tasksResponse.data || [];
            } catch (taskError) {
                console.log('Failed to load tasks:', taskError.message);
                // Continue with empty tasks array
            }
            
            try {
                const meetingsResponse = await getMeetingsByMonthApi(startDate, endDate);
                meetingsData = meetingsResponse.data || [];
            } catch (meetingError) {
                console.log('Failed to load meetings:', meetingError.message);
                // Continue with empty meetings array
            }
            
            try {
                const callsResponse = await getCallsByMonthApi(startDate, endDate);
                callsData = callsResponse.data || [];
            } catch (callError) {
                console.log('Failed to load calls:', callError.message);
                // Continue with empty calls array
            }

            setTasks(tasksData);
            setMeetings(meetingsData);
            setCalls(callsData);

            // Combine data into events
            const combined = combineEventsData(tasksData, meetingsData, callsData);
            setCombinedEvents(combined);

        } catch (error) {
            console.error('Error loading calendar data:', error);
            
            // Only show error if we have no data at all
            if (tasksData.length === 0 && meetingsData.length === 0 && callsData.length === 0) {
                const errorMessage = await systemLanguageUtils.translate('LBL_LOADING_PAGE') || 'Không thể tải dữ liệu lịch';
                setError(errorMessage);
            }
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
        calls,
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
