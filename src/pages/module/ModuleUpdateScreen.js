import { useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

export default function ModuleUpdateScreen() {
    const route = useRoute();
    const { moduleName, recordId } = route.params || {};

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Update Module</Text>
            <Text style={styles.info}>Module: {moduleName || 'N/A'}</Text>
            <Text style={styles.info}>Record ID: {recordId || 'N/A'}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    info: {
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'center',
    },
});