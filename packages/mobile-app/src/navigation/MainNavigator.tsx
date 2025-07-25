import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import FeedScreen from '../screens/FeedScreen';
import StoresScreen from '../screens/StoresScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type MainTabParamList = {
  Feed: undefined;
  Stores: undefined;
  Products: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  ProductDetail: { productId: string; storeId: string };
  Cart: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Stores') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Stores" 
        component={StoresScreen}
        options={{ title: 'Tiendas' }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ title: 'Productos' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ title: 'Producto' }}
      />
      <Stack.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ title: 'Carrito' }}
      />
    </Stack.Navigator>
  );
}