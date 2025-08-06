import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

//import page account
import AccountCreateScreen from "../pages/account/AccountCreateScreen";
import AccountCUScreen from "../pages/account/AccountCUScreen";
import AccountDetailScreen from "../pages/account/AccountDetailScreen";
import AccountListScreen from "../pages/account/AccountListScreen";
import AccountUpdateScreen from "../pages/account/AccountUpdateScreen";
//import page home
import HomeScreen from "../pages/home/HomeScreen";

//import page calendar
import CalendarScreen from "../pages/calendar/CalendarScreen";
import TimetableScreen from "../pages/calendar/TimetableScreen";
import LoginScreen from "../pages/login/LoginScreen";

//import page meeting
import MeetingCreateScreen from "../pages/meeting/MeetingCreateScreen";
import MeetingDetailScreen from "../pages/meeting/MeetingDetailScreen";
import MeetingListScreen from "../pages/meeting/MeetingListScreen";
import MeetingUpdateScreen from "../pages/meeting/MeetingUpdateScreen";

//import page note
import NoteCreateScreen from "../pages/note/NoteCreateScreen";
import NoteDetailScreen from "../pages/note/NoteDetailScreen";
import NoteListScreen from "../pages/note/NoteListScreen";
import NoteUpdateScreen from "../pages/note/NoteUpdateScreen";

//import page profile
import ChangePasswordScreen from "../pages/profile/ChangePasswordScreen";
import ProfileScreen from "../pages/profile/ProfileScreen";
import UpdateProfileScreen from "../pages/profile/UpdateProfileScreen";

//import page task
import TaskCreateScreen from "../pages/task/TaskCreateScreen";
import TaskDetailScreen from "../pages/task/TaskDetailScreen";
import TaskListScreen from "../pages/task/TaskListScreen";
import TaskUpdateScreen from "../pages/task/TaskUpdateScreen";

//import page relationship
import RelationshipListScreen from "../pages/relationship/RelationshipListScreen";

//import page search
import SearchModulesScreen from "../pages/search/SearchModulesScreen";

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
                {/*Home Screen*/}
                <Stack.Screen
                    name="HomeScreen"
                    component={HomeScreen}  
                    options={{
                        headerShown: false,
                    }}
                />
                {/*Home Screen - default is note list screen*/}
                <Stack.Screen name="NoteListScreen" component={NoteListScreen} options={{ headerShown: false }} />
                {/*Note Detail Screen*/}
                <Stack.Screen name="NoteDetailScreen" component={NoteDetailScreen} options={{ headerShown: false }} />
                {/*Note Update Screen*/}
                <Stack.Screen name="NoteUpdateScreen" component={NoteUpdateScreen} options={{ headerShown: false }} />
                {/*Note Create Screen*/}
                <Stack.Screen name="NoteCreateScreen" component={NoteCreateScreen} options={{ headerShown: false }} />

                {/*Search Modules Screen*/}
                <Stack.Screen name="SearchModulesScreen" component={SearchModulesScreen} options={{ headerShown: false }} />

                {/*Profile Screen*/}
                <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: true, title: "Profile" }} />
                {/*Update Profile Screen*/}
                <Stack.Screen name="UpdateProfileScreen" component={UpdateProfileScreen} options={{ headerShown: true, title: "Update Profile" }} />
                {/*Change Password Screen*/}
                <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} options={{ headerShown: true, title: "Change Password" }} />

                {/*Calendar Screen*/}
                <Stack.Screen name="CalendarScreen" component={CalendarScreen} options={{ headerShown: false }} />
                {/*Timetable Screen*/}
                <Stack.Screen name="TimetableScreen" component={TimetableScreen} options={{ headerShown: false }} />

                {/*Account Creation/Update Screen*/}
                <Stack.Screen name="AccountCUScreen" component={AccountCUScreen} options={{ headerShown: false }} />
                {/*Account List Screen*/}
                <Stack.Screen name="AccountListScreen" component={AccountListScreen} options={{ headerShown: false }} />
                {/*Account Detail Screen*/}
                <Stack.Screen name="AccountDetailScreen" component={AccountDetailScreen} options={{ headerShown: false }} />
                {/*Account Update Screen*/}
                <Stack.Screen name="AccountUpdateScreen" component={AccountUpdateScreen} options={{ headerShown: false }} />
                {/*Account Create Screen*/}
                <Stack.Screen name="AccountCreateScreen" component={AccountCreateScreen} options={{ headerShown: false }} />

                {/*Meeting List Screen*/}
                <Stack.Screen name="MeetingListScreen" component={MeetingListScreen} options={{ headerShown: false }} />
                {/*Meeting Detail Screen*/}
                <Stack.Screen name="MeetingDetailScreen" component={MeetingDetailScreen} options={{ headerShown: false }} />
                {/*Meeting Create Screen*/}
                <Stack.Screen name="MeetingCreateScreen" component={MeetingCreateScreen} options={{ headerShown: false }} />
                {/*Meeting Update Screen*/}
                <Stack.Screen name="MeetingUpdateScreen" component={MeetingUpdateScreen} options={{ headerShown: false }} />

                {/*Task List Screen*/}
                <Stack.Screen name="TaskListScreen" component={TaskListScreen} options={{ headerShown: false }} />
                {/*Task Detail Screen*/}
                <Stack.Screen name="TaskDetailScreen" component={TaskDetailScreen} options={{ headerShown: false }} />
                {/*Task Create Screen*/}
                <Stack.Screen name="TaskCreateScreen" component={TaskCreateScreen} options={{ headerShown: false }} />
                {/*Task Update Screen*/}
                <Stack.Screen name="TaskUpdateScreen" component={TaskUpdateScreen} options={{ headerShown: false }} />
                
                {/*Relationship List Screen*/}
                <Stack.Screen name="RelationshipListScreen" component={RelationshipListScreen} options={{ headerShown: false }} />
                {/* Add more screens as needed */}

                {/* <Stack.Screen name="MessageStackNavigator" component={MessageStackNavigator} options={{ headerShown: false }} /> */}

            </Stack.Navigator>
        </NavigationContainer>
    );
}