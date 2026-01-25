import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native'; // <--- Importamos View para el fondo
import 'react-native-reanimated';

// Ya no necesitamos detectar el esquema de color del sistema
// import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  // Asegúrate de que esto apunte a tu pantalla inicial real.
  // Si no usas pestañas (tabs), cámbialo a 'index'.
  anchor: 'index', 
};

export default function RootLayout() {
  return (
    // 1. FORZAR TEMA CLARO (DefaultTheme)
    <ThemeProvider value={DefaultTheme}>
      
      {/* 2. LIENZO BLANCO: Fondo físico detrás de la app para la Web */}
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        
        <Stack
          screenOptions={{
            // 3. ESTILOS FORZADOS: Todo blanco, texto negro
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#000000',
            contentStyle: { backgroundColor: '#ffffff' },
            headerTitleStyle: { color: '#000000' },
          }}
        >
          {/* Definimos tus pantallas del Consultorio */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ title: 'Gestión de Clínicas' }} />
          
          {/* Mantengo 'modal' por si lo usas, pero oculto '(tabs)' si no existe */}
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        
      </View>

      {/* 4. Iconos de barra de estado oscuros (para que se vean sobre fondo blanco) */}
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}