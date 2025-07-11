import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from "react";
import {
    Dimensions,
    FlatList,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from "react-native";
import TopNavigationDetail from "../../components/navigations/TopNavigationDetail";

const { width } = Dimensions.get('window');
const ITEM_W = (width - 8 * 2 - 4 * 2 * 4) / 4;
export default function NoteDetailScreen() {
    const mdName = 'Ghi chú';
    const name = 'NoteUpdateScreen';
    const navigation = useNavigation();
    const data =[
        { id: '1', name: 'Khách hàng' },
        { id: '2', name: 'Cuộc họp' },
        { id: '3', name: 'Liên hệ' },
        { id: '4', name: 'ABC' },
        { id: '5', name: 'Hoạt động' }
    ]
    const data2 = [
        { id: '1', name: 'Mối quan hệ 1' },
        { id: '2', name: 'Mối quan hệ 2' },
        { id: '3', name: 'Mối quan hệ 3' },
        { id: '4', name: 'Mối quan hệ 4' },
        { id: '5', name: 'Mối quan hệ 5' }
    ];
    const padData = (raw, cols) => {
    const fullRows = Math.floor(raw.length / cols);
    let lastRowCount = raw.length - fullRows * cols;
    while (lastRowCount !== 0 && lastRowCount < cols) {
    raw.push({ id: `blank-${lastRowCount}`, empty: true });
    lastRowCount++;
   }
     return raw;
  };

   // trong component
   const paddedData = useMemo(() => padData([...data], 4), [data]);

    const renderItem = ({ item }) => {
  if (item.empty) {
    return <View style={styles.cardInvisible} />;
  }

  return (
    <Pressable
      onPress={() => console.log('Bạn vừa chạm: ', item.id)}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,   // thêm nền khi nhấn
      ]}
    >
      <Text style={({pressed})=>[  pressed ? styles.cardText : styles.text]}>
        {item.name}
      </Text>
    </Pressable>
  );
};

    return (
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
      <TopNavigationDetail moduleName={mdName} navigation={navigation} name={name} />

      {/* ---------- NỘI DUNG ---------- */}
      <View style={styles.content}>

        {/* ===== Box 1: Thông tin chính ===== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Thông tin chính</Text>
        </View>

        <View style={styles.infoCard}>
          {/** Các dòng thông tin **/}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tên ghi chú</Text>
            <Text style={styles.value}>ABC Corp</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Mã ghi chú</Text>
            <Text style={styles.value}>12345</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ngày tạo</Text>
            <Text style={styles.value}>01/01/2023</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Mô tả</Text>
            <Text style={styles.value} numberOfLines={2}>
              Khách hàng lớn trong ngành công nghiệp.
            </Text>
          </View>
        </View>

        {/* ===== Box 2: Mối quan hệ ===== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mối quan hệ</Text>
        </View>

        <View style={styles.infoCard}>
          <FlatList
            data={paddedData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={4}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
     /* Header mini cho section */
  sectionHeader: { marginBottom: 6, paddingHorizontal: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#4B84FF' },

  /* Thẻ thông tin */
  infoCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: { flex: 1, fontSize: 14, color: '#555' },
  value: { flex: 1, fontSize: 14, color: '#1e1e1e', textAlign: 'right' },
    text: {
        fontSize: 20,
        color: "#333",
    },
    text2:{
        fontSize: 13,
        color: "#666",
    },
    textBold:{
        fontWeight: 'bold',
        fontSize: 20,
        color: "#333",
    },
    tableRow: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    cell: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    content: {
        flex: 1,
    },
    row: {
    paddingHorizontal: 8,
    justifyContent: 'flex-start',
  },
  card: {
    width: ITEM_W,
    marginHorizontal: 2,
    marginVertical: 8,
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#ececec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInvisible: {
    width: ITEM_W,
    marginHorizontal: 2,
    marginVertical: 8,
    backgroundColor: 'transparent',
  },
  cardPressed:{
    backgroundColor:"blue",
  },
  cardText: {
    fontSize: 13,
    color: 'black',
  },
});
