import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useUserSetting } from '../../services/useApi/user/UseUser_Setting';

const ProfileSettingScreen = ({ navigation }) => {
    const {
        loading,
        error,
        currencies,
        selectedCurrency,
        dateFormat,
        thousandsSeparator,
        decimalSymbol,
        translations,
        showDateFormatModal,
        showCurrencyModal,
        dateFormatOptions,
        loadCurrencies,
        saveDateFormat,
        saveCurrency,
        saveThousandsSeparator,
        saveDecimalSymbol,
        getCurrencyExample,
        setShowDateFormatModal,
        setShowCurrencyModal,
        handleRefreshLanguage,
        handleRefreshFields
    } = useUserSetting();

    useEffect(() => {
        loadCurrencies();
    }, []);

    const showError = (message) => {
        Alert.alert('Error', message);
    };

    if (error) {
        showError(error);
    }

    const renderDateFormatItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.modalItem,
                dateFormat === item.value && styles.selectedItem
            ]}
            onPress={() => saveDateFormat(item.value)}
        >
            <View style={styles.modalItemContent}>
                <Text style={styles.modalItemText}>{item.label}</Text>
                <Text style={styles.modalItemExample}>
                    {translations.example}: {item.example}
                </Text>
            </View>
            {dateFormat === item.value && (
                <Ionicons name="checkmark" size={20} color="#4B84FF" />
            )}
        </TouchableOpacity>
    );

    const renderCurrencyItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.modalItem,
                selectedCurrency?.id === item.id && styles.selectedItem
            ]}
            onPress={() => saveCurrency(item)}
        >
            <View style={styles.modalItemContent}>
                <Text style={styles.modalItemText}>
                    {item.attributes.name} ({item.attributes.symbol})
                </Text>
                <Text style={styles.modalItemExample}>
                    {item.attributes.iso4217} - {translations.example}: {item.attributes.symbol}1,000.00
                </Text>
            </View>
            {selectedCurrency?.id === item.id && (
                <Ionicons name="checkmark" size={20} color="#4B84FF" />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Date Format Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {translations.type} {translations.time}
                        </Text>
                        <TouchableOpacity
                            style={styles.selectionButton}
                            onPress={() => setShowDateFormatModal(true)}
                        >
                            <Text style={styles.selectionText}>{dateFormat}</Text>
                            <Text style={styles.selectButton}>
                                {translations.selectButton}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Currency Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {translations.currency}
                        </Text>
                        <TouchableOpacity
                            style={styles.selectionButton}
                            onPress={() => setShowCurrencyModal(true)}
                            disabled={loading}
                        >
                            <Text style={styles.selectionText}>
                                {selectedCurrency ?
                                    `${selectedCurrency.attributes.name} (${selectedCurrency.attributes.symbol})` :
                                    'Loading...'
                                }
                            </Text>
                            <Text style={styles.selectButton}>
                                {translations.selectButton}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Thousands Separator Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {translations.thousandsSep}
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            value={thousandsSeparator}
                            onChangeText={saveThousandsSeparator}
                            maxLength={1}
                            placeholder=","
                        />
                    </View>

                    {/* Decimal Symbol Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {translations.decimalSym}
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            value={decimalSymbol}
                            onChangeText={saveDecimalSymbol}
                            maxLength={1}
                            placeholder="."
                        />
                    </View>

                    {/* Currency Example */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {translations.example}
                        </Text>
                        <View style={styles.exampleContainer}>
                            <Text style={styles.exampleText}>
                                {getCurrencyExample()}
                            </Text>
                        </View>
                    </View>

                    {/* Cache Management Buttons */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={handleRefreshLanguage}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.refreshButtonText}>
                                    {`${translations.update || 'Update'} ${translations.language || 'Language'}`}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={handleRefreshFields}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.refreshButtonText}>
                                    {`${translations.update || 'Update'} ${translations.field || 'Fields'}`}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Date Format Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showDateFormatModal}
                    onRequestClose={() => setShowDateFormatModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {translations.type} {translations.time}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowDateFormatModal(false)}
                                >
                                    <Ionicons name="close" size={24} color="black" />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={dateFormatOptions}
                                renderItem={renderDateFormatItem}
                                keyExtractor={(item) => item.value}
                                style={styles.modalList}
                            />
                        </View>
                    </View>
                </Modal>

                {/* Currency Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showCurrencyModal}
                    onRequestClose={() => setShowCurrencyModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {translations.currency}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowCurrencyModal(false)}
                                >
                                    <Ionicons name="close" size={24} color="black" />
                                </TouchableOpacity>
                            </View>
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#4B84FF" />
                                </View>
                            ) : (
                                <FlatList
                                    data={currencies}
                                    renderItem={renderCurrencyItem}
                                    keyExtractor={(item) => item.id}
                                    style={styles.modalList}
                                />
                            )}
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'black',
        marginBottom: 8,
    },
    selectionButton: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectionText: {
        fontSize: 16,
        color: 'black',
        flex: 1,
    },
    selectButton: {
        fontSize: 14,
        color: '#4B84FF',
        fontWeight: '500',
    },
    textInput: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        fontSize: 16,
        color: 'black',
    },
    exampleContainer: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    exampleText: {
        fontSize: 16,
        color: 'black',
        fontWeight: '500',
    },
    refreshButton: {
        backgroundColor: '#4B84FF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    refreshButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        maxHeight: '70%',
        width: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
    },
    modalList: {
        flexGrow: 0,
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    selectedItem: {
        backgroundColor: '#F0F8FF',
    },
    modalItemContent: {
        flex: 1,
    },
    modalItemText: {
        fontSize: 16,
        color: 'black',
        fontWeight: '500',
    },
    modalItemExample: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
});

export default ProfileSettingScreen;
