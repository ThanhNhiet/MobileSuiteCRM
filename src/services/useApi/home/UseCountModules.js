import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import ModulesConfig from '../../../configs/ModulesConfig';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import {
  getAccessibleModuleCounts,
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
    { title: 'Khách hàng', module: 'Accounts', my: 0 },
    { title: 'Ghi chú', module: 'Notes', my: 0 },
    { title: 'Công việc', module: 'Tasks', my: 0 },
    { title: 'Cuộc họp', module: 'Meetings', my: 0 }
  ]);

  // Load translations dynamically for all available modules
  const loadTranslations = useCallback(async (moduleData = null) => {
    try {
      let modulesToTranslate = [];
      
      if (moduleData && typeof moduleData === 'object') {
        // Use provided module data with labels from API
        modulesToTranslate = Object.entries(moduleData).map(([moduleName, moduleInfo]) => ({
          moduleName,
          labelKey: moduleInfo.label || moduleName // Use label from API as translation key
        }));
      } else if (Array.isArray(moduleData)) {
        // Legacy: array of module names
        modulesToTranslate = moduleData.map(moduleName => ({
          moduleName,
          labelKey: moduleName
        }));
      } else {
        // Get modules from ModulesConfig if available
        try {
          const modulesConfig = ModulesConfig.getInstance();
          await modulesConfig.loadModules();
          const availableModules = modulesConfig.getRequiredModules();
          const filteredModules = modulesConfig.getFilteredModules();
          
          modulesToTranslate = Object.keys(availableModules).map(moduleName => ({
            moduleName,
            labelKey: filteredModules[moduleName]?.label || moduleName
          }));
        } catch (error) {
          console.warn('Could not load modules from ModulesConfig, using fallback:', error);
          // Fallback to common modules
          const fallbackModules = ['Accounts', 'Notes', 'Tasks', 'Meetings', 'Calendar', 'Contacts', 'Calls', 'Leads', 'Opportunities'];
          modulesToTranslate = fallbackModules.map(moduleName => ({
            moduleName,
            labelKey: moduleName
          }));
        }
      }
      
      // Create translation promises for all modules
      const translationPromises = modulesToTranslate.map(async ({ moduleName, labelKey }) => {
        // Use label value from API response as translation key
        try {
          // Try to translate the label using SystemLanguageUtils
          const translation = await systemLanguageUtils.translate(labelKey);
          return { moduleName, translation, labelKey };
        } catch (error) {
          console.warn(`Failed to translate "${labelKey}", using original label as fallback`);
          return { moduleName, translation: labelKey, labelKey }; // Use original label as fallback
        }
      });
      
      // Wait for all translations
      const translationResults = await Promise.all(translationPromises);
      
      // Build translations object
      const newTranslations = {};
      translationResults.forEach(({ moduleName, translation, labelKey }) => {
        const key = moduleName.toLowerCase();
        // Use the label value directly from API response
        newTranslations[key] = translation || labelKey || moduleName;
      });
      
      setTranslations(newTranslations);
      return newTranslations;
      
    } catch (error) {
      console.warn('Error loading UseCountModules translations:', error);
      
      // Simple fallback with direct label values from API structure
      const fallbackTranslations = {
        accounts: 'Accounts',
        calls: 'Calls', 
        campaigns: 'Campaigns',
        cases: 'Cases',
        contacts: 'Contacts',
        aos_contracts: 'Contracts',
        documents: 'Documents',
        emailtemplates: 'Email - Templates',
        emails: 'Emails',
        fp_events: 'Events',
        aos_invoices: 'Invoices',
        aok_knowledge_base_categories: 'KB - Categories',
        aok_knowledgebase: 'Knowledge Base',
        leads: 'Leads',
        fp_event_locations: 'Locations',
        meetings: 'Meetings',
        notes: 'Notes',
        opportunities: 'Opportunities',
        aos_pdf_templates: 'PDF - Templates',
        aos_products: 'Products',
        aos_product_categories: 'Products - Categories',
        project: 'Projects',
        am_projecttemplates: 'Projects - Templates',
        aos_quotes: 'Quotes',
        aor_reports: 'Reports',
        spots: 'Spots',
        surveys: 'Surveys',
        tasks: 'Tasks',
        calendar: 'Calendar'
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

      // Get dynamic module list from ModulesConfig
      const modulesConfig = ModulesConfig.getInstance();
      await modulesConfig.loadModules();
      const availableModules = modulesConfig.getRequiredModules();
      const filteredModules = modulesConfig.getFilteredModules();
      
      // Load translations for available modules with label keys from API
      const moduleList = Object.keys(availableModules);
      let currentTranslations = translations;
      if (Object.keys(currentTranslations).length === 0 || 
          !moduleList.every(module => currentTranslations.hasOwnProperty(module.toLowerCase()))) {
        currentTranslations = await loadTranslations(filteredModules);
      }

      // Use new permission-based API
      const result = await getAccessibleModuleCounts();
      
      if (result.success) {
        const { moduleCounts } = result;
        const newData = [];
        
        // Process accessible modules based on ModulesConfig order
        const moduleOrder = Object.keys(availableModules);
        
        moduleOrder.forEach(moduleName => {
          if (moduleCounts[moduleName]) {
            const module = moduleCounts[moduleName];
            
            // Create data object based on module type
            let dataItem = {
              title: getModuleTitle(moduleName, currentTranslations),
              module: moduleName,
              icon: module.icon,
              navigationTarget: module.navigationTarget || availableModules[moduleName],
              hasAccess: module.hasAccess
            };
            
            // Add count fields based on module showType (only 'my' and 'calendar')
            if (module.showType === 'calendar') {
              dataItem.calendar = true;
            } else {
              // All other modules show 'my' records count
              dataItem.my = module.count;
            }
            
            newData.push(dataItem);
          }
        });
        
        setData(newData);
      } else {
        throw new Error('Failed to get accessible module counts');
      }
      
    } catch (err) {
      console.error('Error fetching count modules:', err);
      
      // If it's a 401 error, don't set error state as token refresh might be in progress
      if (err.response?.status === 401) {
        console.log('Authentication error, will retry automatically');
        return;
      }
      
      // For other errors, fallback to original method without permissions
      await fetchCountModulesLegacy(currentTranslations);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [translations, loadTranslations]);

  // Legacy fallback method (original implementation)
  const fetchCountModulesLegacy = async (currentTranslations) => {
    try {
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

      setData([
        { title: currentTranslations.accounts || 'Accounts', module: 'Accounts', my: Math.max(0, accountsCount) },
        { title: currentTranslations.notes || 'Notes', module: 'Notes', my: Math.max(0, notesCount) },
        { title: currentTranslations.tasks || 'Tasks', module: 'Tasks', my: Math.max(0, tasksCount) },
        { title: currentTranslations.meetings || 'Meetings', module: 'Meetings', my: Math.max(0, meetingsCount) }
      ]);
    } catch (legacyError) {
      console.error('Legacy fetch also failed:', legacyError);
      
      // Final fallback - show empty data with English names (all using 'my')
      setData([
        { title: currentTranslations.accounts || 'Accounts', module: 'Accounts', my: 0 },
        { title: currentTranslations.notes || 'Notes', module: 'Notes', my: 0 },
        { title: currentTranslations.tasks || 'Tasks', module: 'Tasks', my: 0 },
        { title: currentTranslations.meetings || 'Meetings', module: 'Meetings', my: 0 }
      ]);
    }
  };

  // Helper function to get module title
  const getModuleTitle = (moduleName, currentTranslations) => {
    if (!moduleName) return 'Unknown Module';
    
    // Look up translation by lowercase module name
    const key = moduleName.toLowerCase();
    const translation = currentTranslations[key];
    
    if (translation) {
      return translation;
    }
    
    // If no translation found, return the module name in English
    console.warn(`No translation found for module: ${moduleName}, using English fallback`);
    return moduleName;
  };

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
    
    // Clear data with English fallback for core modules (all using 'my')
    setData([
      { title: currentTranslations.accounts || 'Accounts', module: 'Accounts', my: 0 },
      { title: currentTranslations.notes || 'Notes', module: 'Notes', my: 0 },
      { title: currentTranslations.tasks || 'Tasks', module: 'Tasks', my: 0 },
      { title: currentTranslations.meetings || 'Meetings', module: 'Meetings', my: 0 }
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