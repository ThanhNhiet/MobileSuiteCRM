import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ModulesConfig from '../../configs/ModulesConfig';
import RolesConfig from '../../configs/RolesConfig';
import { useLogin_out } from '../../services/useApi/login/UseLogin_out';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';

const { width } = Dimensions.get('window');

const HamburgerModal = ({ visible, onClose, navigation }) => {
    const slideAnim = useRef(new Animated.Value(-width * 0.6)).current; // Start off-screen left
    const { handleLogout } = useLogin_out();
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    const modulesConfig = ModulesConfig.getInstance();
    const rolesConfig = RolesConfig.getInstance();
    
    const [translations, setTranslations] = useState({});
    const [accessibleModules, setAccessibleModules] = useState([]);
    const [filteredModules, setFilteredModules] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Load modules and permissions
    useEffect(() => {
        const loadModulesAndPermissions = async () => {
            try {
                setLoading(true);
                
                // Load modules and user roles in parallel
                const [modules, roles] = await Promise.all([
                    modulesConfig.loadModules(),
                    rolesConfig.loadUserRoles()
                ]);

                // Get filtered modules for hamburger menu
                const filteredModules = modulesConfig.getFilteredModules();
                
                // Get only accessible modules based on user permissions
                const userAccessibleModules = rolesConfig.getAccessibleModules(filteredModules);
                
                // Convert to array format for easier rendering
                const moduleArray = Object.keys(userAccessibleModules).map(key => ({
                    key,
                    label: userAccessibleModules[key].label,
                    screenName: userAccessibleModules[key].screenName
                }));
                
                setAccessibleModules(moduleArray);
                setFilteredModules(moduleArray); // Initialize filtered modules
                
                // Load translations for accessible modules
                await loadTranslations(moduleArray);
                
            } catch (error) {
                console.error('Error loading modules and permissions:', error);
                // Set fallback modules if error occurs
                setAccessibleModules([]);
            } finally {
                setLoading(false);
            }
        };

        if (visible) {
            loadModulesAndPermissions();
            // Reset search when modal opens
            setSearchQuery('');
        }
    }, [visible]);

    // Handle search functionality
    useEffect(() => {
        if (!searchQuery.trim()) {
            // No search query - show all accessible modules
            setFilteredModules(accessibleModules);
        } else {
            // Filter modules based on translated text (case-insensitive)
            const query = searchQuery.toLowerCase().trim();
            const filtered = accessibleModules.filter(module => {
                const translatedText = translations[module.key] || module.label || '';
                return translatedText.toLowerCase().includes(query);
            });
            setFilteredModules(filtered);
        }
    }, [searchQuery, accessibleModules, translations]);

    // Load translations for modules and logout
    const loadTranslations = async (modules) => {
        try {
            // Create translation promises for accessible modules
            const translationPromises = modules.map(module => 
                systemLanguageUtils.translate(`${module.key}`, module.label)
            );
            
            // Add logout translation
            translationPromises.push(
                systemLanguageUtils.translate('LBL_LOGOUT', 'Logout')
            );
            
            const translationResults = await Promise.all(translationPromises);
            
            // Build translations object
            const translationsObj = {};
            modules.forEach((module, index) => {
                translationsObj[module.key] = translationResults[index];
            });
            translationsObj.logout = translationResults[translationResults.length - 1];
            
            setTranslations(translationsObj);
        } catch (error) {
            console.warn('Error loading HamburgerModal translations:', error);
            // Set fallback translations for accessible modules
            const fallbackTranslations = {};
            modules.forEach(module => {
                fallbackTranslations[module.key] = module.label;
            });
            fallbackTranslations.logout = 'Logout';
            setTranslations(fallbackTranslations);
        }
    };


    useEffect(() => {
        if (visible) {
            // Slide in from left
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            // Slide out to left
            Animated.timing(slideAnim, {
                toValue: -width * 0.6,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, slideAnim]);

    const handleClose = () => {
        // Animate out first, then close
        Animated.timing(slideAnim, {
            toValue: -width * 0.6,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const navigateTo = (screenName) => {
        handleClose();
        navigation.navigate(screenName);
    };

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                {/* Background overlay - close when tapped */}
                <TouchableOpacity
                    style={styles.backgroundOverlay}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                {/* Animated Sidebar Menu */}
                <Animated.View
                    style={[
                        styles.sidebar,
                        {
                            transform: [{ translateX: slideAnim }]
                        }
                    ]}
                >
                    {/* Header with Profile and Close */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.profileSection}
                            onPress={() => navigateTo('ProfileScreen')}
                        >
                            <View style={styles.profileIcon}>
                                <Ionicons name="person" size={24} color="white" />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Ionicons name="close" size={28} color="black" />
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="..."
                                placeholderTextColor="#999"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity
                                    style={styles.clearSearchButton}
                                    onPress={() => setSearchQuery('')}
                                >
                                    <Ionicons name="close-circle" size={20} color="#666" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Menu Items */}
                    <ScrollView
                        style={styles.menuContainer}
                        contentContainerStyle={styles.menuContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>Loading modules...</Text>
                            </View>
                        ) : filteredModules.length === 0 ? (
                            <View style={styles.noResultsContainer}>
                                <Ionicons name="search" size={48} color="#ccc" />
                                <Text style={styles.noResultsText}>
                                    {searchQuery.trim() 
                                        ? `No results for "${searchQuery}"`
                                        : 'No modules available'
                                    }
                                </Text>
                            </View>
                        ) : (
                            filteredModules.map((module) => (
                                <TouchableOpacity
                                    key={module.key}
                                    style={styles.menuItem}
                                    onPress={() => navigateTo(module.screenName)}
                                >
                                    <Text style={styles.menuText}>
                                        {translations[module.key] || module.label}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>

                    {/* Logout Button */}
                    <View style={styles.logoutContainer}>
                        <TouchableOpacity style={styles.logoutButton}
                            onPress={() => {
                                handleClose();
                                // Reset configs before logout
                                modulesConfig.reset();
                                rolesConfig.reset();
                                handleLogout();
                            }}
                        >
                            <Text style={styles.logoutText}>{translations.logout || 'Logout'}</Text>
                            <Ionicons name="log-out" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backgroundOverlay: {
        flex: 1,
    },
    sidebar: {
        width: width * 0.6, // 70% of screen width
        backgroundColor: '#F5F5F5',
        paddingVertical: 20,
        paddingHorizontal: 0,
        justifyContent: 'space-between',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    profileSection: {
        alignItems: 'center',
    },
    profileIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4B84FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
    },
    closeButton: {
        padding: 5,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 0, // Remove default padding on Android
    },
    clearSearchButton: {
        marginLeft: 10,
        padding: 2,
    },
    menuContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    menuContent: {
        paddingBottom: 10,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        color: '#666',
        fontSize: 14,
        fontStyle: 'italic',
    },
    noResultsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    noResultsText: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 15,
        lineHeight: 22,
    },
    menuItem: {
        backgroundColor: '#BFAAA1',
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginBottom: 15,
        borderRadius: 25,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    menuText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '500',
    },
    logoutContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    logoutButton: {
        backgroundColor: '#FF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    logoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
});

export default HamburgerModal;
