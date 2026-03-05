import { writeCacheTheme } from '../utils/cacheViewManagement/Theme/WriteCacheTheme';

// Default fallback colors
const defaultColors = {
  primaryColor1: '#E85A4F',
  primaryColor2: '#007AFF',
  primaryColor1SupperLight: '#f1edecff',
  formInput: '#e4a0a0ff',
  modalEditBG: '#e3e7e8ff',
  modalEditTitle: '#000000',
  hamburgerContainer: '#F5F5F5',
  hamburgerCardContainer: '#BFAAA1',
  hamburgerText: '#000000',
  backgroundContainer: '#f0f0f0',
  cardItem: '#FFFFFF',
  navBG: '#BFAAA1',
  navText: '#000000',
  navIcon: '#000000',
  importantText: '#E85A4F',
  loadingIcon: '#E85A4F',
  loadingText: '#666',
  btnPrimary: '#E85A4F',
  btnSecondary: '#007AFF',
  normalText: '#000000',
  normalIcon: '#000000',
};

// Theme Manager Class
class ThemeManager {
  constructor() {
    this.colors = { ...defaultColors }; // Start with defaults
    this.isLoaded = false;
  }

  // Get singleton instance
  static getInstance() {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // Load theme colors from cache (call this on app start)
  async loadThemeColors() {
    try {
      // Use writeCacheTheme's loadThemeColors which handles cache-first strategy
      const themeColors = await writeCacheTheme.loadThemeColors();
      
      if (themeColors && typeof themeColors === 'object') {
        // Validate and merge with defaults
        this.colors = this.validateAndMergeColors(themeColors);
        this.isLoaded = true;
        
        // Update AppTheme.colors for backward compatibility
        Object.assign(AppTheme.colors, this.colors);
      } else {
        console.warn('Invalid theme data, using defaults');
        this.colors = { ...defaultColors };
        this.isLoaded = true;
      }
      
      return this.colors;
    } catch (error) {
      console.error('Error loading theme colors:', error);
      this.colors = { ...defaultColors };
      this.isLoaded = true;
      return this.colors;
    }
  }

  // Validate and merge colors with defaults
  validateAndMergeColors(cachedColors) {
    const mergedColors = {};
    
    Object.keys(defaultColors).forEach(key => {
      // Use cached color if valid, otherwise use default
      if (cachedColors[key] && this.isValidColor(cachedColors[key])) {
        mergedColors[key] = cachedColors[key];
      } else {
        mergedColors[key] = defaultColors[key];
        if (cachedColors[key]) {
          console.warn(`Invalid color for ${key}, using default`);
        }
      }
    });
    
    return mergedColors;
  }

  // Validate hex color format
  isValidColor(value) {
    if (!value || typeof value !== 'string') return false;
    const hexColorRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
    return hexColorRegex.test(value);
  }

  // Get current colors (sync)
  getColors() {
    if (!this.isLoaded) {
      console.warn('Theme not loaded yet, returning defaults');
    }
    return this.colors;
  }

  // Get specific color
  getColor(key) {
    return this.colors[key] || defaultColors[key] || '#000000';
  }

  // Refresh theme from API
  async refreshTheme() {
    try {
      const freshColors = await writeCacheTheme.refreshThemeColors();
      
      if (freshColors) {
        this.colors = this.validateAndMergeColors(freshColors);
        
        // Update AppTheme.colors for backward compatibility
        Object.assign(AppTheme.colors, this.colors);
        return this.colors;
      }
      
      return null;
    } catch (error) {
      console.error('Error refreshing theme:', error);
      return null;
    }
  }

  // Reset to defaults
  resetToDefaults() {
    this.colors = { ...defaultColors };
    return this.colors;
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();

// Export default colors for reference
export const defaultThemeColors = defaultColors;

// Create mutable colors object that will be updated
const mutableColors = { ...defaultColors };

// Export AppTheme for backward compatibility
export const AppTheme = {
  colors: mutableColors, // This object will be mutated when theme loads
  
  // Helper to get current colors
  getCurrentColors: () => themeManager.getColors(),
};

// Helper function to create dynamic styles that always use latest theme colors
// Use this instead of StyleSheet.create() for theme-dependent styles
export const createThemedStyles = (styleGenerator) => {
  // Return a getter that creates styles on-demand with current colors
  return () => styleGenerator(AppTheme.colors);
};