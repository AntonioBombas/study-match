// src/components/ProfileForm.jsx
import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { setDoc, doc } from 'firebase/firestore';

const ProfileForm = () => {
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const uid = auth.currentUser.uid; // Pega o UID do utilizador autenticado
    await setDoc(doc(db, 'users', uid), {
      name,
      university,
      course,
    });

    alert('Perfil salvo!');
  };

  return (
    <div>
      <h2>Completa o teu perfil</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Universidade"
          value={university}
          onChange={(e) => setUniversity(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Curso"
          value={course}
          onChange={(e) => setCourse(e.target.value)} 
        />
        <button type="submit">Salvar Perfil</button>
      </form>
    </div>
  );
};

export default ProfileForm;

