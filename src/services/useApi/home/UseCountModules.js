// React hooks
import { useCallback, useEffect, useState } from 'react';

// Configs & Utils
import ModulesConfig from '../../../configs/ModulesConfig';
import RolesConfig from '../../../configs/RolesConfig';
import ReadCacheView from '../../../utils/cacheViewManagement/ReadCacheView';
import { SystemLanguageUtils } from '../../../utils/cacheViewManagement/SystemLanguageUtils';
import WriteCacheView from '../../../utils/cacheViewManagement/WriteCacheView';

// API & Events
import { getAccessibleModuleCounts } from '../../api/home/CountModulesApi';
import { eventEmitter } from '../../EventEmitter';

export const useCountModules = () => {
  const systemLanguageUtils = SystemLanguageUtils.getInstance();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [translations, setTranslations] = useState({});
  const [data, setData] = useState([]);
  const [allModules, setAllModules] = useState([]);      // all module names user can access
  const [selectedModules, setSelectedModules] = useState([]); // modules user chose to show

  /**
   * Load translations dynamically for all available modules
   */
  const loadTranslations = useCallback(async (moduleData = null) => {
    try {
      let modulesToTranslate = [];

      if (moduleData && typeof moduleData === 'object') {
        modulesToTranslate = Object.entries(moduleData).map(
          ([moduleName, moduleInfo]) => ({
            moduleName,
            labelKey: moduleInfo.label ? moduleInfo.label : moduleName
          })
        );
      } else if (Array.isArray(moduleData)) {
        modulesToTranslate = moduleData.map(moduleName => ({
          moduleName,
          labelKey: moduleName
        }));
      } else {
        try {
          const modulesConfig = ModulesConfig.getInstance();
          await modulesConfig.loadModules();
          const availableModules = modulesConfig.getRequiredModules();
          const filteredModules = modulesConfig.getFilteredModules();
          modulesToTranslate = Object.keys(availableModules).map(moduleName => ({
            moduleName,
            labelKey: filteredModules[moduleName]?.label ? filteredModules[moduleName].label : moduleName
          }));
        } catch (error) {
          console.warn('Could not load modules from ModulesConfig:', error);
          return;
        }
      }

      const translationPromises = modulesToTranslate.map(async ({ moduleName, labelKey }) => {
        try {
          const translation = await systemLanguageUtils.translate(labelKey);
          return { moduleName, translation, labelKey };
        } catch {
          console.warn(`Failed to translate "${labelKey}", fallback to original`);
          return { moduleName, translation: labelKey, labelKey };
        }
      });

      const translationResults = await Promise.all(translationPromises);

      const newTranslations = {};
      translationResults.forEach(({ moduleName, translation, labelKey }) => {
        newTranslations[moduleName.toLowerCase()] = translation || labelKey || moduleName;
      });

      setTranslations(newTranslations);
      return newTranslations;

    } catch (error) {
      console.warn('Error loading UseCountModules translations:', error);

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

  /**
   * Fetch module settings from cache or fallback
   */
  const fetchCountModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Read home settings from cache
      let homeSettings = null;
      try {
        homeSettings = await ReadCacheView.getHomeSettings();
      } catch {
        homeSettings = null;
      }

      const modulesConfig = ModulesConfig.getInstance();
      await modulesConfig.loadModules();

      const availableModules = modulesConfig.getRequiredModules();
      const filteredModules = modulesConfig.getFilteredModules();

      // Accessible modules by role
      const rolesConfig = RolesConfig.getInstance();
      const accessibleModules = Object.keys(filteredModules).filter(m => rolesConfig.hasModuleAccess(m));

      // Create array allModules with {key, trans} for each module
      let allModulesTranslations = translations;
      if (
        Object.keys(allModulesTranslations).length === 0 ||
        !accessibleModules.every(m => allModulesTranslations.hasOwnProperty(m.toLowerCase()))
      ) {
        allModulesTranslations = await loadTranslations(filteredModules);
      }
      const translationsMap = accessibleModules.map(m => ({
        key: m,
        trans: allModulesTranslations[m.toLowerCase()] || m
      }));
      setAllModules(translationsMap);

      // Chosen modules
      const chosenModules = (homeSettings?.length > 0)
        ? homeSettings
        : accessibleModules.slice(0, 2);

      setSelectedModules(chosenModules);
      const modulesToShow = chosenModules;

      // Load translations
      let currentTranslations = translations;
      if (
        Object.keys(currentTranslations).length === 0 ||
        !modulesToShow.every(m => currentTranslations.hasOwnProperty(m.toLowerCase()))
      ) {
        currentTranslations = await loadTranslations(filteredModules);
      }

      // Get counts
      const result = await getAccessibleModuleCounts();
      if (!result.success) throw new Error('Failed to get accessible module counts');

      const { moduleCounts } = result;
      const newData = [];

      modulesToShow.forEach(moduleName => {
        if (moduleCounts[moduleName]) {
          const module = moduleCounts[moduleName];
          const item = {
            title: getModuleTitle(moduleName, currentTranslations),
            module: moduleName,
            icon: module.icon,
            navigationTarget: module.navigationTarget || availableModules[moduleName],
            hasAccess: module.hasAccess
          };
          if (module.showType === 'calendar') {
            item.calendar = true;
          } else {
            item.my = module.count;
          }
          newData.push(item);
        }
      });

      setData(newData);
    } catch (err) {
      console.error('Error fetching count modules:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [translations, loadTranslations]);

  /**
   * Fallback data builder
   */
  const setFallbackData = useCallback(async (currentTranslations) => {
    try {
      const modulesConfig = ModulesConfig.getInstance();
      await modulesConfig.loadModules();

      const availableModules = modulesConfig.getRequiredModules();
      const moduleOrder = Object.keys(availableModules);

      const fallbackData = moduleOrder.map(moduleName => ({
        title: getModuleTitle(moduleName, currentTranslations),
        module: moduleName,
        navigationTarget: availableModules[moduleName],
        hasAccess: true,
        ...(moduleName === 'Calendar' ? { calendar: true } : { my: 0 })
      }));

      setData(fallbackData);

    } catch (error) {
      console.error('Error setting fallback data:', error);
    }
  }, []);

  /**
   * Get module title from translations
   */
  const getModuleTitle = (moduleName, currentTranslations) => {
    if (!moduleName) return 'Unknown Module';
    const key = moduleName.toLowerCase();
    const translation = currentTranslations[key];
    if (translation) return translation;

    console.warn(`No translation for module: ${moduleName}, using fallback`);
    return moduleName;
  };

  const refresh = () => {
    fetchCountModules();
  };

  /**
   * Clear data when logout
   */
  const clearData = useCallback(async () => {
    let currentTranslations = translations;
    if (Object.keys(currentTranslations).length === 0) {
      currentTranslations = await loadTranslations();
    }

    await setFallbackData(currentTranslations);
    setLoading(false);
    setError(null);
  }, [translations, loadTranslations, setFallbackData]);

  useEffect(() => {
    const initializeData = async () => {
      await loadTranslations();
      setTimeout(() => fetchCountModules(), 1000);
    };

    initializeData();

    eventEmitter.on('logout', clearData);
    eventEmitter.on('loginSuccess', () => setTimeout(fetchCountModules, 500));

    return () => {
      eventEmitter.off('logout', clearData);
      eventEmitter.off('loginSuccess', fetchCountModules);
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    allModules,
    selectedModules,
    saveHomeSettings: async (modules) => {
      try {
        await WriteCacheView.saveHomeSettings(modules);
        setSelectedModules(modules);
      } catch (e) {
        console.error('Error saving home settings:', e);
      }
    }
  };
};