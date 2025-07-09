import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../pages/login/LoginScreen";
import NoteListScreen from "../pages/note/NoteListScreen";
import ChangePasswordScreen from "../pages/profile/ChangePasswordScreen";
import ProfileScreen from "../pages/profile/ProfileScreen";
import UpdateProfileScreen from "../pages/profile/UpdateProfileScreen";

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

                {/*Profile Screen*/}
                <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: true, title: "Thông tin hồ sơ" }} />
                {/*Update Profile Screen*/}
                <Stack.Screen name="UpdateProfileScreen" component={UpdateProfileScreen} options={{ headerShown: true, title: "Chỉnh sửa thông tin" }} />
                {/*Change Password Screen*/}
                <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} options={{ headerShown: true, title: "Đổi mật khẩu" }} />

                {/* <Stack.Screen
                    name="MessageStackNavigator"
                    component={MessageStackNavigator}
                    options={{ headerShown: false }}
                /> */}
            </Stack.Navigator>
        </NavigationContainer>
    );
}