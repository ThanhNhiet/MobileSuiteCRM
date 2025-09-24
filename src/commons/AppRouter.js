import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

//import page home
import HomeScreen from "../pages/home/HomeScreen";

//import page calendar
import CalendarScreen from "../pages/calendar/CalendarScreen";
import TimetableScreen from "../pages/calendar/TimetableScreen";

//import page login
import LoginScreen from "../pages/login/LoginScreen";

//import page module
import ModuleCreateScreen from "../pages/module/ModuleCreateScreen";
import ModuleDetailScreen from "../pages/module/ModuleDetailScreen";
import ModuleListScreen from "../pages/module/ModuleListScreen";
import ModuleUpdateScreen from "../pages/module/ModuleUpdateScreen";

//import page profile
import ChangePasswordScreen from "../pages/profile/ChangePasswordScreen";
import ProfileScreen from "../pages/profile/ProfileScreen";
import ProfileSettingScreen from "../pages/profile/ProfileSettingScreen";
import UpdateProfileScreen from "../pages/profile/UpdateProfileScreen";

//import page relationship
import RelationshipCreateScreen_New from "../pages/relationship/RelationshipCreateScreen_New";
import RelationshipDetailScreen_New from "../pages/relationship/RelationshipDetailScreen_New";
import RelationshipListScreen_New from "../pages/relationship/RelationshipListScreen_New";
import RelationshipUpdateScreen_New from "../pages/relationship/RelationshipUpdateScreen_New";

//import page search
import SearchModulesScreen from "../pages/search/SearchModulesScreen";

const Stack = createNativeStackNavigator();

export default function AppRouter() {
    return (
        <Stack.Navigator initialRouteName="LoginScreen">
                {/*Login Screen*/}
                <Stack.Screen
                    name="LoginScreen"
                    component={LoginScreen}
                    options={{
                        headerShown: false,
                    }}
                />
                {/*Home Screen*/}
                <Stack.Screen
                    name="HomeScreen"
                    component={HomeScreen}  
                    options={{
                        headerShown: false,
                    }}
                />

                {/*Search Modules Screen*/}
                <Stack.Screen name="SearchModulesScreen" component={SearchModulesScreen} options={{ headerShown: false }} />
              
                {/*ModuleScreen*/}
                {/*ListScreen*/}
                <Stack.Screen name="ModuleListScreen" component={ModuleListScreen} options={{ headerShown: false }} />
                {/*DetailScreen*/}
                <Stack.Screen name="ModuleDetailScreen" component={ModuleDetailScreen} options={{ headerShown: false }} />
                {/*UpdateScreen*/}
                <Stack.Screen name="ModuleUpdateScreen" component={ModuleUpdateScreen} options={{ headerShown: false }} />
                {/*CreateScreen*/}
                <Stack.Screen name="ModuleCreateScreen" component={ModuleCreateScreen} options={{ headerShown: false }} />
                
                {/*Profile Screen*/}
                <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: true, title: "Profile" }} />
                {/*Update Profile Screen*/}
                <Stack.Screen name="UpdateProfileScreen" component={UpdateProfileScreen} options={{ headerShown: true, title: "Update Profile" }} />
                {/*Change Password Screen*/}
                <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} options={{ headerShown: true, title: "Change Password" }} />
                {/*Profile Setting Screen*/}
                <Stack.Screen name="ProfileSettingScreen" component={ProfileSettingScreen} options={{ headerShown: false}} />

                {/*Calendar Screen*/}
                <Stack.Screen name="CalendarScreen" component={CalendarScreen} options={{ headerShown: false }} />
                {/*Timetable Screen*/}
                <Stack.Screen name="TimetableScreen" component={TimetableScreen} options={{ headerShown: false }} />
                
                {/*Relationship List Screen*/}
                <Stack.Screen name="RelationshipListScreen_New" component={RelationshipListScreen_New} options={{ headerShown: false }} />
                {/*Relationship Create Screen*/}
                <Stack.Screen name="RelationshipCreateScreen_New" component={RelationshipCreateScreen_New} options={{ headerShown: false }} />

                {/*Relationship Detail Screen*/}
                <Stack.Screen name="RelationshipDetailScreen_New" component={RelationshipDetailScreen_New} options={{ headerShown: false }} />

                {/*Relationship Update Screen*/}
                <Stack.Screen name="RelationshipUpdateScreen_New" component={RelationshipUpdateScreen_New} options={{ headerShown: false }} />

                {/* Add more screens as needed */}

                {/* <Stack.Screen name="MessageStackNavigator" component={MessageStackNavigator} options={{ headerShown: false }} /> */}

            </Stack.Navigator>
    );
}