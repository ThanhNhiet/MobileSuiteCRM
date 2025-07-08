import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";

import LoginScreen from "../pages/LoginScreen";

const Stack = createNativeStackNavigator();


export default function AppRouter() {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {/*
            <View style={{ width: 100, height: 100, backgroundColor: "blue" }} />
            <Text style={{ color: "black", fontSize: 20, marginTop: 20 }}>
                Welcome to the CRM App
            </Text>
            */}

            <NavigationContainer>
                <Stack.Navigator initialRouteName="LoginScreen">
                    {/*Login Screen*/}
                    <Stack.Screen
                        name="LoginScreen"
                        component={LoginScreen}
                        options={{
                            headerShown: true,
                        }}
                    />

                    {/*Home Screen - default is note list screen*/}
                    <Stack.Screen name="NoteListScreen" component={NoteListScreen} options={{ headerShown: false }} />

                    {/* <Stack.Screen
                        name="MessageStackNavigator"
                        component={MessageStackNavigator}
                        options={{ headerShown: false }}
                    /> */}
                </Stack.Navigator>
            </NavigationContainer>
        </View>
    );
}