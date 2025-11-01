// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import AuthForm from "./components/AuthForm";
import ProfileForm from "./components/ProfileForm";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import ProfilePublic from "./pages/ProfilePublic";
import Conversations from "./pages/Conversations";

import "./App.css";

function App() {
  const [user, setUser] = useState(undefined); // undefined = ainda a carregar
  const navigate = useNavigate();

  // 🔹 Monitora o estado da autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Estado do utilizador:", u);
      setUser(u || null);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    navigate("/login");
  };

  // 🔹 Barra de navegação
  const NavBar = () => (
    <nav
      style={{
        padding: "10px",
        borderBottom: "1px solid #ddd",
        marginBottom: "20px",
      }}
    >
      {user ? (
        <>
          <Link to="/">🏠 Home</Link> |{" "}
          <Link to="/profile">👤 Perfil</Link> |{" "}
          <Link to="/conversations">💬 Mensagens</Link> |{" "}
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "blue",
              cursor: "pointer",
            }}
          >
            🚪 Sair
          </button>
          <span style={{ marginLeft: "10px", color: "#555" }}>
            {user.email}
          </span>
        </>
      ) : (
        <>
          <Link to="/">🏠 Home</Link> | <Link to="/login">Entrar</Link>
        </>
      )}
    </nav>
  );

  // 🔹 Enquanto o auth ainda está a carregar
  if (user === undefined) {
    return (
      <div style={{ padding: "2rem", fontSize: "20px" }}>
        <h2>Carregando autenticação...</h2>
      </div>
    );
  }

  // 🔹 Estrutura principal
  return (
    <div className="App" style={{ padding: "2rem" }}>
      <h1>🎓 Study Match MVP</h1>

      <NavBar />

      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            user ? (
              <Home />
            ) : (
              <div>
                <h2>Bem-vindo ao Study Match!</h2>
                <p>Entra para encontrares explicadores ou alunos.</p>
                <Link to="/login">Ir para Login</Link>
              </div>
            )
          }
        />

        {/* Perfil (edição do utilizador logado) */}
        <Route
          path="/profile"
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

        {/* Página pública de um perfil */}
        <Route path="/profile/:uid" element={<ProfilePublic />} />

        {/* Chat individual */}
        <Route path="/chat/:uid" element={<Chat />} />

        {/* Conversas recentes */}
        <Route
          path="/conversations"
          element={
            user ? (
              <Conversations />
            ) : (
              <div>
                <h2>Precisas de entrar para ver as tuas conversas.</h2>
                <Link to="/login">Ir para login</Link>
              </div>
            )
          }
        />

        {/* Login */}
        <Route path="/login" element={<AuthForm />} />

        {/* Página 404 */}
        <Route
          path="*"
          element={
            <div>
              <h2>Página não encontrada 😕</h2>
              <Link to="/">Voltar à Home</Link>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;

