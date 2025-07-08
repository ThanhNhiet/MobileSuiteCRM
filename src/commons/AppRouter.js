import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../pages/login/LoginScreen";
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
            </Stack.Navigator>
        </NavigationContainer>
    );
}