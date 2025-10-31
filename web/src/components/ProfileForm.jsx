// src/components/ProfileForm.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { setDoc, doc, getDoc } from 'firebase/firestore';

const ProfileForm = () => {
  // --- Tipo de utilizador (Tutor ou Aluno) ---
  const [isTutor, setIsTutor] = useState(true);

  // --- Dados base ---
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [modes, setModes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Carrega o perfil atual (se existir)
  useEffect(() => {
    const loadProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || '');
          setUniversity(data.university || '');
          setCourse(data.course || '');
          setSubjects(data.subjects || []);
          setModes(data.modes || []);
          setIsTutor(data.isTutor ?? true);
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // 🔹 Adiciona disciplina
  const addSubject = () => {
    const trimmed = newSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed]);
      setNewSubject('');
    }
  };

  // 🔹 Remove disciplina
  const removeSubject = (subj) => {
    setSubjects(subjects.filter((s) => s !== subj));
  };

  // 🔹 Alterna modo de explicação
  const toggleMode = (mode) => {
    if (modes.includes(mode)) {
      setModes(modes.filter((m) => m !== mode));
    } else {
      setModes([...modes, mode]);
    }
  };

  // 🔹 Submeter alterações
  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;

    if (!uid) {
      alert('Tens de estar autenticado para guardar o perfil!');
      return;
    }

    if (!name || !university || !course) {
      alert('Preenche todos os campos obrigatórios!');
      return;
    }

    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          name,
          university,
          course,
          subjects,
          modes,
          isTutor,
        },
        { merge: true } // Atualiza apenas campos novos/alterados
      );

      alert('✅ Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao guardar perfil:', error);
      alert('Erro ao guardar perfil. Ver consola.');
    }
  };

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>A carregar perfil...</p>;
  }

  return (
    <div style={{ maxWidth: 500, margin: 'auto', padding: '1.5rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Editar o teu perfil</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {/* --- Tipo de Utilizador --- */}
        <label>Tipo de utilizador:</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <label>
            <input
              type="radio"
              checked={isTutor === true}
              onChange={() => setIsTutor(true)}
            /> Tutor
          </label>
          <label>
            <input
              type="radio"
              checked={isTutor === false}
              onChange={() => setIsTutor(false)}
            /> Aluno
          </label>
        </div>

        {/* --- Campos principais --- */}
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Universidade"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Curso"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          required
        />

        {/* --- Disciplinas --- */}
        {isTutor && (
          <>
            <label>Disciplinas que dás</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Ex: Cálculo 1"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubject();
                  }
                }}
              />
              <button type="button" onClick={addSubject}>+</button>
            </div>

            {subjects.length > 0 && (
              <ul style={{ marginTop: '8px' }}>
                {subjects.map((s, i) => (
                  <li key={i}>
                    {s}{' '}
                    <button
                      type="button"
                      onClick={() => removeSubject(s)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      ❌
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* --- Modos de explicação --- */}
        {isTutor && (
          <>
            <label>Modo de explicação</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={modes.includes('online')}
                  onChange={() => toggleMode('online')}
                /> Online
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={modes.includes('presencial')}
                  onChange={() => toggleMode('presencial')}
                /> Presencial
              </label>
            </div>
          </>
        )}

        <button
          type="submit"
          style={{
            marginTop: '1rem',
            padding: '0.6rem 1rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Salvar Perfil
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;

