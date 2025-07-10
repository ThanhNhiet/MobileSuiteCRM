import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AccountCreateScreen from "../pages/account/AccountCreateScreen";
import AccountCUScreen from "../pages/account/AccountCUScreen";
import AccountDetailScreen from "../pages/account/AccountDetailScreen";
import AccountListScreen from "../pages/account/AccountListScreen";
import AccountUpdateScreen from "../pages/account/AccountUpdateScreen";
import LoginScreen from "../pages/login/LoginScreen";
import MeetingDetailScreen from "../pages/meeting/MeetingDetailScreen";
import MeetingListScreen from "../pages/meeting/MeetingListScreen";
import NoteListScreen from "../pages/note/NoteListScreen";


const Stack = createNativeStackNavigator();

export default function AppRouter() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="LoginScreen">
                {/*Login Screen*/}
                <Stack.Screen
                    name="LoginScreen"
                    component={LoginScreen}
                    options={{
                        headerShown: false,
                    }}
                />

                {/*Home Screen - default is note list screen*/}
                <Stack.Screen name="NoteListScreen" component={NoteListScreen} options={{ headerShown: false }} />

                {/* <Stack.Screen
                    name="MessageStackNavigator"
                    component={MessageStackNavigator}
                    options={{ headerShown: false }}
                /> */}
                {/*Account Creation/Update Screen*/}
                <Stack.Screen
                    name="AccountCUScreen"
                    component={AccountCUScreen}
                    options={{ headerShown: false }}
                />
                {/*Account List Screen*/}
                <Stack.Screen
                    name="AccountListScreen"
                    component={AccountListScreen}
                    options={{ headerShown: false }}
                />
                {/*Account Detail Screen*/}
                <Stack.Screen
                    name="AccountDetailScreen"
                    component={AccountDetailScreen}
                    options={{ headerShown: false }}
                />
                {/*Account Update Screen*/}
                <Stack.Screen
                    name="AccountUpdateScreen"
                    component={AccountUpdateScreen}
                    options={{ headerShown: false }}
                />
                {/*Account Create Screen*/}
                <Stack.Screen
                    name="AccountCreateScreen"
                    component={AccountCreateScreen}
                    options={{ headerShown: false }}
                />
                {/*Meeting List Screen*/}
                <Stack.Screen
                    name="MeetingListScreen"
                    component={MeetingListScreen}
                    options={{ headerShown: false }}
                />
                {/*Meeting Detail Screen*/}
                <Stack.Screen
                    name="MeetingDetailScreen"
                    component={MeetingDetailScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}