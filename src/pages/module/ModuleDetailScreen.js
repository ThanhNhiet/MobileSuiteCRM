import { StyleSheet, Text, View } from 'react-native';
export default function ModuleDetailScreen() {
    return (
        <View>
            <Text>Module Detail</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});