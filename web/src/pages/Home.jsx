// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Importa o Firestore

const Home = () => {
  const [users, setUsers] = useState([]); // Estado para armazenar os utilizadores

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, 'users')); // Pega todos os documentos na coleção "users"
      const usersList = querySnapshot.docs.map(doc => doc.data()); // Extraí os dados dos utilizadores
      setUsers(usersList); // Atualiza o estado com a lista de utilizadores
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h2>Lista de Perfis</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index}>
            <h3>{user.name}</h3>
            <p>{user.course}</p>
            <p>{user.university}</p>
            <button>Ver Perfil</button>
            <button>Contactar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;

