import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';


import BottomNavigation from '../../components/navigations/BottomNavigation';
import TopNavigation from '../../components/navigations/TopNavigation';

const dummyData = new Array(20).fill(0).map((_, i) => ({
    id: i.toString(),
    name: `Name ${i}`,
    date_entered: `Date ${i}`,
    description: `description ${i}`,
}));

export default function NoteListScreen() {
    const navigation = useNavigation();

    const [page, setPage] = useState(1);
    const totalPages = 10; // Thay bằng số thật nếu có
    const [startPage, setStartPage] = useState(1);

    // Tính danh sách trang hiển thị (tối đa 3 trang)
    const visiblePages = Array.from({ length: 3 }, (_, i) => startPage + i).filter(p => p <= totalPages);

    // Vô hiệu hóa khi ở đầu/cuối
    const isPrevDisabled = startPage === 1;
    const isNextDisabled = startPage + 2 >= totalPages;

    const handlePrev = () => {
        if (!isPrevDisabled) {
            const newStart = startPage - 1;
            setStartPage(newStart);
            setPage(newStart);
        }
    };

    const handleNext = () => {
        if (!isNextDisabled) {
            const newStart = startPage + 1;
            setStartPage(newStart);
            setPage(newStart);
        }
    };


    const handleSearch = () => {
        // Xử lý tìm kiếm
    };

    const renderItem = ({ item }) => (
        <View style={styles.tableRow}>
            <Text style={styles.cell}>{item.name}</Text>
            <Text style={styles.cell}>{item.date_entered}</Text>
            <Text style={styles.cell}>{item.description}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <SafeAreaProvider>
                <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
                <TopNavigation />
                <View style={styles.content}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Search Form */}
                        <View style={{ flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                            <View style={styles.searchBar}>
                                <TextInput style={styles.input} placeholder="Key search" />
                            </View>
                            <View style={styles.searchFormOptions}>
                                <TouchableOpacity style={styles.select}><Text>Type</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.select}><Text>Type</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                                    <Text style={{ color: '#fff' }}>Search</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Add new "+" */}
                        <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    // TODO: Điều hướng hoặc xử lý thêm mới dữ liệu
                                    console.log('Add new');
                                }}
                                style={[styles.addNewBtn]}
                            >
                                <Text style={styles.plusText}>+</Text>
                            </TouchableOpacity>
                            <Text style={{ marginTop: 2 }}>Thêm mới</Text>
                        </View>
                    </View>


                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={styles.headerCell}>Tên chủ đề</Text>
                        <Text style={styles.headerCell}>Ngày tạo</Text>
                        <Text style={styles.headerCell}>Mô tả</Text>
                    </View>

                    {/* Table Rows - Scrollable */}
                    <FlatList
                        data={dummyData}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        style={styles.list}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
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
                                onPress={() => setPage(num)}
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
                <BottomNavigation />
            </SafeAreaProvider>
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
    input: {
        borderWidth: 1,
        padding: 6,
        flex: 1,
        minWidth: '70%',
        backgroundColor: '#fff',
    },
    select: {
        borderWidth: 1,
        padding: 6,
        backgroundColor: '#eee',
        minWidth: 60,
    },
    searchButton: {
        backgroundColor: '#4B84FF',
        padding: 6,
        paddingHorizontal: 16,
        borderRadius: 4,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#C9B4AB',
        padding: 8,
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
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
});
