import React, { useState } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function EditProfile() {
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [subjects, setSubjects] = useState("");
  const [isTutor, setIsTutor] = useState(false);

  const saveProfile = async () => {
    const uid = auth.currentUser.uid;
    await setDoc(doc(db, "users", uid), {
      uid,
      name,
      university,
      course,
      subjects: subjects.split(","),
      isTutor,
    });
    alert("Perfil guardado!");
  };

  return (
    <div>
      <h2>O teu perfil</h2>
      <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Universidade" value={university} onChange={(e) => setUniversity(e.target.value)} />
      <input placeholder="Curso" value={course} onChange={(e) => setCourse(e.target.value)} />
      <input placeholder="Disciplinas (separa por vírgulas)" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
      <label>
        <input type="checkbox" checked={isTutor} onChange={(e) => setIsTutor(e.target.checked)} />
        Sou explicador
      </label>
      <button onClick={saveProfile}>Guardar</button>
    </div>
  );
}

