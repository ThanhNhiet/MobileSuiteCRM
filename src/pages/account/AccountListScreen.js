import { formatDateTime } from '@/src/utils/format/FormatDateTime';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/navigations/BottomNavigation';
import TopNavigation from '../../components/navigations/TopNavigation';
import AccountData from '../../services/useApi/account/AccountData';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';


export default function AccountListScreen() {
    const navigation = useNavigation();
    const mdName = 'Khách hàng';
    const [page, setPage] = useState(1);
    const totalPages = 10;

    // dữ liệu từ API
    const [apiData, setApiData] = useState(null);
    // loading state
    const [loading, setLoading] = useState(true);

    // State cho dropdown
    const [selectedType1, setSelectedType1] = useState('');
    const [selectedType2, setSelectedType2] = useState('');
    const [showDropdown1, setShowDropdown1] = useState(false);
    const [showDropdown2, setShowDropdown2] = useState(false);

    // State cho search
    const [searchText, setSearchText] = useState('');
    const [filteredData, setFilteredData] = useState([]);

    // Options cho dropdown
   // const typeOptions1 = ['All', 'Personal', 'Business', 'Important'];
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    const [typeOptions1, setTypeOptions1] = useState([]);
    const [typeOptions2, setTypeOptions2] = useState([]);
    useEffect(() => {
        const setFilterTranslations = async () => {
            const filterTranslations = await systemLanguageUtils.translateKeys([
                'all',  // "Tất cả"
                'LBL_ACCOUNTS', // "Khách hàng"
                'LBL_CONTACTS', // "Liên hệ"
                'LBL_TASKS', // "Công việc"
                'LBL_MEETINGS', // "Hội họp" -> tương đương meetings
                'LBL_DROPDOWN_LIST_ALL', // "Tất cả"
                'today',    // "Hôm nay"
                'this_week', // "Tuần này"
                'this_month' // "Tháng này"
            ]);
            setTypeOptions1([
                { value: 'all', label: filterTranslations.all || 'Tất cả' },
                { value: 'Accounts', label: filterTranslations.LBL_ACCOUNTS || 'Khách hàng' },
                { value: 'Contacts', label: filterTranslations.LBL_CONTACTS || 'Liên hệ' },
                { value: 'Tasks', label: filterTranslations.LBL_TASKS || 'Công việc' },
                { value: 'Meetings', label: filterTranslations.LBL_MEETINGS || 'Hội họp' }
                ]);
                // Set time filter options with translations
                setTypeOptions2([
                    { value: 'all', label: filterTranslations.LBL_DROPDOWN_LIST_ALL || 'Tất cả' },
                    { value: 'today', label: filterTranslations.today || 'Hôm nay' },
                    { value: 'this_week', label: filterTranslations.this_week || 'Tuần này' },
                    { value: 'this_month', label: filterTranslations.this_month || 'Tháng này' }
                ]);
            };
        setFilterTranslations();
    }, []);
    useEffect(() => {
        setSelectedType1(typeOptions1[0]?.label); // Mặc định chọn "Tất cả"
        setSelectedType2(typeOptions2[0]?.label); // Mặc định chọn "Tất cả"
    },[typeOptions1, typeOptions2]);


    // Tính danh sách trang hiển thị (chỉ hiển thị 1 trang hiện tại)
    const visiblePages = [page];

    // Vô hiệu hóa khi ở đầu/cuối
    const isPrevDisabled = page === 1;
    const isNextDisabled = page >= totalPages;

    const handlePrev = () => {
        if (!isPrevDisabled) {
            const newPage = page - 1;
            setPage(newPage);
            // Lấy dữ liệu trang mới
            fetchDataByPage(newPage);
        }
    };

    const handleNext = () => {
        if (!isNextDisabled) {
            const newPage = page + 1;
            setPage(newPage);
            // Lấy dữ liệu trang mới
            fetchDataByPage(newPage);
        }
    };

    const handlePageClick = (pageNumber) => {
        setPage(pageNumber);
        // Lấy dữ liệu trang mới
        fetchDataByPage(pageNumber);
    };

    // Function để lấy dữ liệu theo trang
    const fetchDataByPage = async (pageNumber) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const language = await AsyncStorage.getItem('selectedLanguage');
            if (!token && !language) {
                navigation.navigate('LoginScreen');
                return;
            }
            // Lấy dữ liệu với 20 dòng mỗi trang
            //token, page, pageSize, language
            const result = await AccountData.useListData(token, pageNumber, 20, language);
            setApiData(result);
           //console.log('Dữ liệu trang', pageNumber, ':', result.accounts);
           // console.log('Dữ liệu trang', pageNumber, ':', result.listViews);
        } catch (error) {
            console.error('Lỗi lấy dữ liệu trang', pageNumber, ':', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDataByPage(1);
    }, []);
    useEffect(() => {
        if (!apiData) return;
        setFilteredData(apiData?.accounts || []); // Khởi tạo filtered data
    }, [apiData]);

    const searchData = async (searchQuery, fieldFilter) => {
        let filtered = apiData?.accounts || [];
        if (
            fieldFilter &&
            fieldFilter !== typeOptions1[0].label &&
            searchQuery &&
            searchQuery.trim() !== ''
        ) {
            const valueFilter = typeOptions1.find(option => option.label === fieldFilter)?.value;

            const searchResult = await AccountData.getSearchKeyWords(valueFilter, searchQuery, page);

            filtered = filtered.filter(account => {
                return searchResult.some(result => result.id === account.id);
            });
        }
        return filtered;
        };

    // Function để tìm kiếm và lọc dữ liệu
     const filterData = async (searchQuery, dateFilter) => {
         if (!apiData?.accounts) return [];
        let filtered = apiData?.accounts;
        // Filter theo date created (dropdown 2)
        if (dateFilter && dateFilter !== typeOptions2[0].label) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter(account => {
                const dateCreated = apiData.getFieldValue(account, 'date_entered') || 
                                  apiData.getFieldValue(account, 'date_created') ||
                                  apiData.getFieldValue(account, 'created_date');
                
                if (!dateCreated) return false;

                const accountDate = new Date(dateCreated);
                if (isNaN(accountDate.getTime())) return false;

                const accountDateOnly = new Date(accountDate.getFullYear(), accountDate.getMonth(), accountDate.getDate());

                switch (dateFilter) {
                    case 'Today':
                        return accountDateOnly.getTime() === today.getTime();
                    
                    case 'This Week':
                        const startOfWeek = new Date(today);
                        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
                        return accountDateOnly >= startOfWeek && accountDateOnly <= endOfWeek;
                      
                    case 'This Month':
                        return accountDate.getMonth() === now.getMonth() && 
                               accountDate.getFullYear() === now.getFullYear();
                    
                    default:
                        return true;
                }
            });
        }

        return filtered;
    };

    const handleSearch =async () => {
        if (!searchText.trim() && selectedType1 !== typeOptions1[0].label ) {
            const filtered = await searchData(searchText, selectedType1);
            console.log('Search text is empty, using selected type:', selectedType1);
            setFilteredData(filtered);
        } else {
            const filtered =  filterData(searchText, selectedType2);
            setFilteredData(filtered);
        }
    };

    // Function để reset search
    const handleReset = () => {
        setSearchText('');
        setSelectedType1(typeOptions1[0].label);
        setSelectedType2(typeOptions2[0].label);
        setFilteredData(apiData?.accounts || []);
    };

    const renderItem = ({ item }) => {
        // Lấy 3 fields đầu tiên (không bao gồm id) để hiển thị
        const displayFields = apiData?.listViews
             ?.filter(field =>
            ['name', 'phone_office', 'billing_address_city'].includes(field.key)
            )

        return (
            <TouchableOpacity style={styles.tableRow} onPress={() => {navigation.navigate('AccountDetailScreen', { account: item, editViews: apiData?.editViews, requiredFields: apiData?.requiredFields,listViews: apiData?.listViews,getFieldValue: apiData?.getFieldValue, getFieldLabel: apiData?.getFieldLabel, refreshAccount:() => fetchDataByPage(page)})}}>
                {displayFields.map((field, index) => {
                    const rawValue = apiData?.getFieldValue(item, field.key.toLowerCase()) || '';
                    // Kiểm tra và format nếu là dữ liệu ngày
                    let displayValue = rawValue;
                    if (rawValue && (
                        field.key.includes('date') ||
                        field.key.includes('time') ||
                        field.key === 'date_entered' ||
                        field.key === 'date_modified' ||
                        field.key === 'created_date' ||
                        field.key === 'modified_date'
                    )) {
                        displayValue = formatDateTime(rawValue);
                    }
                    
                    return (
                        <Text key={index} style={styles.cell}>
                            {displayValue}
                        </Text>
                    );
                })}
            </TouchableOpacity>
        );
    };
    // Component Dropdown
    const DropdownSelect = ({ options, selectedValue, onSelect, visible, onClose }) => (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <View style={styles.dropdownContainer}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dropdownItem,
                                option.label === selectedValue && styles.selectedItem
                            ]}
                            onPress={() => {
                                onSelect(option.label);
                                onClose();
                            }}
                        >
                            <Text style={[
                                styles.dropdownText,
                                option.label === selectedValue && styles.selectedText
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
           
                <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
                
                <TopNavigation moduleName={mdName} navigation={navigation}/>

                <View style={styles.content}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between'}}>
                        {/* Search Form */}
                        <View style={{ flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                            <View style={styles.searchBar}>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Tìm kiếm..." 
                                    value={searchText}
                                    onChangeText={setSearchText}
                                    returnKeyType="search"
                                />
                            </View>
                            {/* Filter Labels */}
                            <View style={styles.searchFormOptions}>
                                <TouchableOpacity 
                                    style={styles.select} 
                                    onPress={() => setShowDropdown1(true)}
                                >
                                    <Text numberOfLines={1} style={{}}>{selectedType1}</Text>
                                    <Text style={styles.dropdownArrow}>▼</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.select, { minWidth: 80 }]} 
                                    onPress={() => setShowDropdown2(true)}
                                >
                                    <Text numberOfLines={1} style={{ flex: 1 }}>{selectedType2}</Text>
                                    <Text style={styles.dropdownArrow}>▼</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                                    <Text style={{ color: '#fff' }}>Tìm</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                                    <Text style={{ color: '#666' }}>Reset</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Add new "+" */}
                        <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    // TODO: Điều hướng hoặc xử lý thêm mới dữ liệu
                                   // console.log('Add new');
                                   
                                    navigation.navigate('AccountCreateScreen', {
                                        getFieldLabel: apiData.getFieldLabel,
                                        getFieldValue: apiData.getFieldValue,
                                        editViews: apiData.editViews,
                                        requiredFields: apiData.requiredFields,
                                        refreshAccount: () => fetchDataByPage(page)
                                    });
                                }}
                                style={[styles.addNewBtn]}
                            >
                                <Text style={styles.plusText}>+</Text>
                            </TouchableOpacity>
                            <Text>Thêm</Text>
                        </View>
                    </View>


                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        {apiData?.listViews
                            ?.filter(field =>
                            ['name', 'phone_office', 'billing_address_city'].includes(field.key))
                            ?.map((field, index) => (
                            <Text key={index} style={styles.headerCell}>
                                {field.label }
                            </Text>
                            )) || []}
                    </View>

                    {/* Result Counter */}
                    {(filteredData.length !== (apiData?.accounts?.length || 0)) && (
                        <View style={styles.resultCounter}>
                            <Text style={styles.resultText}>
                                Hiển thị {filteredData.length} / {apiData?.accounts?.length || 0} kết quả
                            </Text>
                        </View>
                    )}

                    {/* Table Rows - Scrollable */}
                    <FlatList
                        data={filteredData}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        style={styles.list}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    {searchText ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
                                </Text>
                            </View>
                        )}
                    />

                    <View style={styles.pagination}>
                        {/* Prev */}
                        <TouchableOpacity
                            onPress={handlePrev}
                            style={[styles.pageBtn, isPrevDisabled && styles.disabledBtn]}
                            disabled={isPrevDisabled}
                        >
                            <Text style={isPrevDisabled ? { color: '#aaa' } : {}}>{'<'}</Text>
                        </TouchableOpacity>

                        {/* Page numbers */}
                        {visiblePages.map((num) => (
                            <TouchableOpacity
                                key={num}
                                onPress={() => handlePageClick(num)}
                                style={[styles.pageBtn, num === page && styles.activePage]}
                            >
                                <Text style={num === page ? { color: '#fff' } : {}}>{num}</Text>
                            </TouchableOpacity>
                        ))}

                        {/* Next */}
                        <TouchableOpacity
                            onPress={handleNext}
                            style={[styles.pageBtn, isNextDisabled && styles.disabledBtn]}
                            disabled={isNextDisabled}
                        >
                            <Text style={isNextDisabled ? { color: '#aaa' } : {}}>{'>'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                <BottomNavigation  navigation={navigation}/>

                {/* Dropdown Modals */}
                <DropdownSelect
                    options={typeOptions1}
                    selectedValue={selectedType1}
                    onSelect={setSelectedType1}
                    visible={showDropdown1}
                    onClose={() => setShowDropdown1(false)}
                />
                <DropdownSelect
                    options={typeOptions2}
                    selectedValue={selectedType2}
                    onSelect={setSelectedType2}
                    visible={showDropdown2}
                    onClose={() => setShowDropdown2(false)}
                />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },

    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
        minHeight: '80%',
    },
    searchBar: {
        height: 35,
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    searchFormOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    filterLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 4,
    },
    filterLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
        flex: 1,
    },
    input: {
        borderWidth: 1,
        padding: 6,
        flex: 1,
        minWidth: '80%',
        backgroundColor: '#fff',
    },
    select: {
        borderWidth: 1,
        padding: 6,
        backgroundColor: '#eee',
        minWidth: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 4,
    },
    dropdownArrow: {
        fontSize: 10,
        marginLeft: 5,
        color: '#666',
    },
    searchButton: {
        backgroundColor: '#4B84FF',
        padding: 6,
        paddingHorizontal: 16,
        borderRadius: 4,
    },
    resetButton: {
        backgroundColor: '#f0f0f0',
        padding: 6,
        paddingHorizontal: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#C9B4AB',
        padding: 8,
    },
    resultCounter: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    resultText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 11,
        backgroundColor: '#F3F0EF',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    cell: { flex: 1 },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center', 
        paddingVertical: 10,
        gap: 6,
    },
    pageBtn: {
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        minWidth: 32,
        alignItems: 'center',
    },
    activePage: {
        backgroundColor: '#4B84FF',
        borderColor: '#4B84FF',
    },
    disabledBtn: {
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    addNewBtn: {
        width: 60,
        height: 60,
        backgroundColor: '#4B84FF',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusText: {
        color: '#fff',
        fontSize: 40,
        lineHeight: 27, // Đảm bảo chữ "+" nằm giữa
    },
    list: {
        flexGrow: 0, // Đảm bảo không chiếm toàn bộ không gian
        maxHeight: 500, // Chiều cao list
    },
    // Dropdown styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownContainer: {
        backgroundColor: 'white',
        minWidth: 150,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        }
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedItem: {
        backgroundColor: '#4B84FF',
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    selectedText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // Empty state styles
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});
