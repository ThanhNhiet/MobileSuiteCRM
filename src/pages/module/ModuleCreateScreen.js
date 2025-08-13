import { useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

export default function ModuleCreateScreen() {
    const route = useRoute();
    const { moduleName } = route.params || {};

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Module</Text>
            <Text style={styles.info}>Module: {moduleName || 'N/A'}</Text>
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