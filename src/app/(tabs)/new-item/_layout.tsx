import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'format',
};

export default function NewItemLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
