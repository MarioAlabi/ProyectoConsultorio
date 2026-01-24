import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet } from 'react-native';
import axios from 'axios';

// 1. Definimos el "molde" de los datos
interface Clinica {
  id_clinica: number;
  nombre: string;
  logo?: string;
}

const API_URL = 'http://localhost:3000/api';

export default function HomeScreen() {
  // 2. Le decimos al estado que guardará un Array de Clinicas (<Clinica[]>)
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [nombreNueva, setNombreNueva] = useState('');

  const fetchClinicas = async () => {
    try {
      const res = await axios.get(`${API_URL}/clinicas`);
      setClinicas(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchClinicas(); }, []);

  const agregarClinica = async () => {
    if (!nombreNueva) return;
    try {
      await axios.post(`${API_URL}/clinicas`, { nombre: nombreNueva, logo: 'default.png' });
      setNombreNueva('');
      fetchClinicas();
    } catch (e) { console.error(e); }
  };

  // 3. Tipamos el 'id' como número
  const eliminarClinica = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/clinicas/${id}`);
      fetchClinicas();
    } catch (e) { console.error(e); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Clínicas</Text>
      
      <View style={styles.form}>
        <TextInput 
            placeholder="Nombre nueva clínica" 
            value={nombreNueva} 
            onChangeText={setNombreNueva} 
            style={styles.input} 
        />
        <Button title="Agregar" onPress={agregarClinica} />
      </View>

      <FlatList
        data={clinicas}
        keyExtractor={(item) => item.id_clinica.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardText}>{item.nombre}</Text>
            {/* Ahora TypeScript sabe que item tiene id_clinica */}
            <Button title="X" color="red" onPress={() => eliminarClinica(item.id_clinica)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  form: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 5 },
  card: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#f0f0f0', marginBottom: 10, borderRadius: 8 },
  cardText: { fontSize: 18 }
});