import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function NoteListScreen() {
    const navigation = useNavigation();
    const [act, setAct] = useState('');

    // Function to handle
    const handle = () => {
        
    };

    return (
        <View style={styles.container} >
            {/* Status Bar */}
            <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
            
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    <Text>Something cool here</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
    },
    imageSize: {
        width: 370,
        height: 110,
    },
});
