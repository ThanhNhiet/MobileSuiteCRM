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

      // Load translations first if not loaded
      let currentTranslations = translations;
      if (Object.keys(currentTranslations).length === 0) {
        currentTranslations = await loadTranslations();
      }

      // Gọi các API song song để tăng hiệu suất
      const [accountsCount, meetingsCount, tasksCount, notesCount] = await Promise.all([
        getCountAllAccounts(),
        getCountMyMeetings(),
        getCountMyTasks(),
        getCountMyNotes()
      ]);

      setData([
        { title: currentTranslations.accounts, module: 'Accounts', all: accountsCount },
        { title: currentTranslations.notes, module: 'Notes', my: notesCount },
        { title: currentTranslations.tasks, module: 'Tasks', my: tasksCount },
        { title: currentTranslations.meetings, module: 'Meetings', my: meetingsCount }
      ]);
    } catch (err) {
      console.error('Error fetching count modules:', err);
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
    // Initialize data only once
    const initializeData = async () => {
      await loadTranslations();
      fetchCountModules();
    };
    
    initializeData();

    // Listen for logout event
    const handleLogout = () => {
      clearData();
    };
    eventEmitter.on('logout', handleLogout);

    return () => {
      eventEmitter.off('logout', handleLogout);
    };
  }, []); // Empty dependency array to run only once

  return {
    data,
    loading,
    error,
    refresh
  };
};