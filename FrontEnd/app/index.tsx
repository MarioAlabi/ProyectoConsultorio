import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

const API_URL = '/api'; 

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      if (res.status === 200) {
        Alert.alert("Éxito", "Bienvenido " + res.data.user.nombre);
        router.replace('/home'); 
      }
    } catch (error) {
      // Opción A: Alert genérico
      Alert.alert("Error", "Credenciales inválidas o error de red");
    }
  };

  const quickRegister = async () => {
    try {
        const clinica = await axios.post(`${API_URL}/clinicas`, { nombre: "Clinica Central", logo: "logo.png" });
        await axios.post(`${API_URL}/register`, {
            nombre: "Mario Admin",
            email: email,
            password: password,
            rol: "Admin",
            id_clinica: clinica.data.id_clinica
        });
        Alert.alert("Creado", "Usuario de prueba creado. Ahora dale Login.");
    } catch (e: any) { 
        // Corrección: Tipamos 'e' como 'any' para poder leer e.message
        Alert.alert("Error", e.message || "Error desconocido"); 
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consultorio Médico</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      
      <View style={{ gap: 10 }}>
        <Button title="Iniciar Sesión" onPress={handleLogin} />
        <Button title="Registrar (Test)" color="gray" onPress={quickRegister} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 }
});