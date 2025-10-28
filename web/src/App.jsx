import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import AuthForm from "./components/AuthForm.jsx";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <div>
      {user ? (
        <>
          <h3>Olá, {user.email}</h3>
          <button onClick={() => signOut(auth)}>Sair</button>
        </>
      ) : (
        <AuthForm />
      )}
    </div>
  );
}

export default App;

