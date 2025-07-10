//For creating and updating a customer account
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';

const AccountCUScreen = () => {
    const navigation = useNavigation();
    const user = useSelector(selectUser);
    const account = useSelector(selectAccount);
    const note = useSelector(selectNote);
    return(
        <View>
            <Text>Account Creation/Update</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 20,
        color: '#333',
    },
});
export default AccountCUScreen;
