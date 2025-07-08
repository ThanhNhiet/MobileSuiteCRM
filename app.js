import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppRouter from "./src/commons/AppRouter";
// export default function App() {
//   return <AppRouter />;
// }

export default function App() {
  return (
      <GestureHandlerRootView style={{ flex: 1}}>
        <AppRouter />
      </GestureHandlerRootView>
  );
}