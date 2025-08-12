import { StyleSheet, Text, View } from 'react-native';
export default function ModuleListScreen() {
    return (
        <View>
            <Text>Module List</Text>
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