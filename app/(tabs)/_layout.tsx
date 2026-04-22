import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { GLASS } from '../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.40)',
        tabBarBackground: () => (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '材料库', tabBarIcon: ({ color }) => <TabIcon emoji="🫧" color={color} /> }}
      />
      <Tabs.Screen
        name="barrel"
        options={{ title: '酒桶', tabBarIcon: ({ color }) => <TabIcon emoji="🛢" color={color} /> }}
      />
      <Tabs.Screen
        name="gallery"
        options={{ title: '展柜', tabBarIcon: ({ color }) => <TabIcon emoji="🏆" color={color} /> }}
      />
    </Tabs>
  );
}

import { Text } from 'react-native';
const TabIcon = ({ emoji, color }: { emoji: string; color: string }) => (
  <Text style={{ fontSize: 20, opacity: color === '#ffffff' ? 1 : 0.45 }}>{emoji}</Text>
);

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: GLASS.border,
    backgroundColor: 'transparent',
    elevation: 0,
  },
});
