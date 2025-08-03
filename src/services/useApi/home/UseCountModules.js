import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { SystemLanguageUtils } from '../../../utils/SystemLanguageUtils';
import {
  getCountAllAccounts,
  getCountMyMeetings,
  getCountMyNotes,
  getCountMyTasks
} from '../../api/home/CountModulesApi';
import { eventEmitter } from '../../EventEmitter';

export const useCountModules = () => {
  const systemLanguageUtils = SystemLanguageUtils.getInstance();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [translations, setTranslations] = useState({});
  const [data, setData] = useState([
    { title: 'Khách hàng', module: 'Accounts', all: 0 },
    { title: 'Ghi chú', module: 'Notes', my: 0 },
    { title: 'Công việc', module: 'Tasks', my: 0 },
    { title: 'Cuộc họp', module: 'Meetings', my: 0 }
  ]);

  // Load translations
  const loadTranslations = useCallback(async () => {
    try {
      const [accounts, notes, tasks, meetings] = await Promise.all([
        systemLanguageUtils.translate('LBL_ACCOUNTS', 'Khách hàng'),
        systemLanguageUtils.translate('LBL_NOTES', 'Ghi chú'),
        systemLanguageUtils.translate('LBL_TASKS', 'Công việc'),
        systemLanguageUtils.translate('LBL_MEETINGS', 'Cuộc họp')
      ]);
      
      const newTranslations = {
        accounts,
        notes,
        tasks,
        meetings
      };
      
      setTranslations(newTranslations);
      return newTranslations;
    } catch (error) {
      console.warn('Error loading UseCountModules translations:', error);
      const fallbackTranslations = {
        accounts: 'Khách hàng',
        notes: 'Ghi chú',
        tasks: 'Công việc',
        meetings: 'Cuộc họp'
      };
      setTranslations(fallbackTranslations);
      return fallbackTranslations;
    }
  }, [systemLanguageUtils]);

  const fetchCountModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have a valid token before making API calls
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token available, skipping count modules fetch');
        return;
      }

      // Load translations first if not loaded
      let currentTranslations = translations;
      if (Object.keys(currentTranslations).length === 0) {
        currentTranslations = await loadTranslations();
      }

      // Gọi các API song song để tăng hiệu suất
      const results = await Promise.allSettled([
        getCountAllAccounts(),
        getCountMyMeetings(),
        getCountMyTasks(),
        getCountMyNotes()
      ]);

      // Extract results with fallback values and validation
      const accountsCount = results[0].status === 'fulfilled' && typeof results[0].value === 'number' ? results[0].value : 0;
      const meetingsCount = results[1].status === 'fulfilled' && typeof results[1].value === 'number' ? results[1].value : 0;
      const tasksCount = results[2].status === 'fulfilled' && typeof results[2].value === 'number' ? results[2].value : 0;
      const notesCount = results[3].status === 'fulfilled' && typeof results[3].value === 'number' ? results[3].value : 0;

      // Log any rejected promises
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const modules = ['Accounts', 'Meetings', 'Tasks', 'Notes'];
          console.warn(`Failed to fetch ${modules[index]} count:`, result.reason);
        }
      });

      // Log if any count is invalid (for debugging)
      if (accountsCount < 0 || meetingsCount < 0 || tasksCount < 0 || notesCount < 0) {
        console.warn('Invalid count values detected:', { accountsCount, meetingsCount, tasksCount, notesCount });
      }

      setData([
        { title: currentTranslations.accounts, module: 'Accounts', all: Math.max(0, accountsCount) },
        { title: currentTranslations.notes, module: 'Notes', my: Math.max(0, notesCount) },
        { title: currentTranslations.tasks, module: 'Tasks', my: Math.max(0, tasksCount) },
        { title: currentTranslations.meetings, module: 'Meetings', my: Math.max(0, meetingsCount) }
      ]);
    } catch (err) {
      console.error('Error fetching count modules:', err);
      
      // If it's a 401 error, don't set error state as token refresh might be in progress
      if (err.response?.status === 401) {
        console.log('Authentication error, will retry automatically');
        return;
      }
      
      // For other errors, set fallback data to prevent UI crash
      let currentTranslations = translations;
      if (Object.keys(currentTranslations).length === 0) {
        currentTranslations = await loadTranslations();
      }
      
      setData([
        { title: currentTranslations.accounts, module: 'Accounts', all: 0 },
        { title: currentTranslations.notes, module: 'Notes', my: 0 },
        { title: currentTranslations.tasks, module: 'Tasks', my: 0 },
        { title: currentTranslations.meetings, module: 'Meetings', my: 0 }
      ]);
      
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [translations, loadTranslations]);

  const refresh = () => {
    fetchCountModules();
  };

  // Clear data when logout
  const clearData = useCallback(async () => {
    // Use current translations or load if needed
    let currentTranslations = translations;
    if (Object.keys(currentTranslations).length === 0) {
      currentTranslations = await loadTranslations();
    }
    
    setData([
      { title: currentTranslations.accounts, module: 'Accounts', all: 0 },
      { title: currentTranslations.notes, module: 'Notes', my: 0 },
      { title: currentTranslations.tasks, module: 'Tasks', my: 0 },
      { title: currentTranslations.meetings, module: 'Meetings', my: 0 }
    ]);
    setLoading(false);
    setError(null);
  }, [translations, loadTranslations]);

  useEffect(() => {
    // Initialize data only once with delay to allow auth check to complete
    const initializeData = async () => {
      await loadTranslations();
      
      // Add a small delay to ensure auth check has completed
      setTimeout(() => {
        fetchCountModules();
      }, 1000);
    };
    
    initializeData();

    // Listen for logout event
    const handleLogout = () => {
      clearData();
    };
    
    // Listen for successful login to refetch data
    const handleLoginSuccess = () => {
      setTimeout(() => {
        fetchCountModules();
      }, 500);
    };
    
    eventEmitter.on('logout', handleLogout);
    eventEmitter.on('loginSuccess', handleLoginSuccess);

    return () => {
      eventEmitter.off('logout', handleLogout);
      eventEmitter.off('loginSuccess', handleLoginSuccess);
    };
  }, []); // Empty dependency array to run only once

  return {
    data,
    loading,
    error,
    refresh
  };
};