// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import AuthForm from "./components/AuthForm";
import ProfileForm from "./components/ProfileForm";
import Home from "./pages/Home";
import Chat from "./pages/Chat";


import "./App.css";

function App() {
  const [user, setUser] = useState(undefined); // undefined = a verificar autenticação
  const navigate = useNavigate();

  // Verifica se o utilizador está autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Estado do utilizador:", u);
      if (u) {
        setUser(u);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Função de logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    navigate("/login");
  };

  // Enquanto o estado está a carregar
  if (user === undefined) {
    return (
      <div style={{ padding: "2rem", fontSize: "20px" }}>
        <h2>Carregando autenticação...</h2>
      </div>
    );
  }

  return (
    <div className="App" style={{ padding: "2rem" }}>
      <h1>🎓 Study Match MVP</h1>

      {/* Barra de navegação simples */}
      <nav style={{ marginBottom: "20px" }}>
        {user ? (
          <>
            <Link to="/">Home</Link> |{" "}
            <Link to="/edit-profile">Editar Perfil</Link> |{" "}
            <button onClick={handleLogout}>Sair</button>
          </>
        ) : (
          <Link to="/login">Entrar</Link>
        )}
      </nav>

      {/* Rotas principais */}
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Home />
            ) : (
              <div>
                <h2>Bem-vindo ao Study Match!</h2>
                <p>Por favor, entra para ver os perfis.</p>
              </div>
            )
          }
        />

        <Route
          path="/edit-profile"
          element={
            user ? (
              <ProfileForm />
            ) : (
              <div>
                <h2>Precisas de entrar para editar o teu perfil.</h2>
                <Link to="/login">Ir para login</Link>
              </div>
            )
          }
        />

        <Route path="/login" element={<AuthForm />} />

        {/* Rota de fallback (caso URL errada) */}
        <Route
          path="*"
          element={
            <div>
              <h2>Página não encontrada</h2>
              <Link to="/">Voltar à Home</Link>
            </div>
          }
        />
        <Route path="/chat/:uid" element={<Chat />} />

      </Routes>
    </div>
  );
}

export default App;

