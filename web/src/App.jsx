// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Link, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

import AuthForm from "./components/AuthForm";
import ProfileForm from "./components/ProfileForm";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import ProfilePublic from "./pages/ProfilePublic";
import Conversations from "./pages/Conversations";
import About from "./pages/About";
import Terms from "./pages/Terms";
import "./App.css";

function App() {
  const [user, setUser] = useState(undefined); // undefined = ainda a carregar
  const [unreadCount, setUnreadCount] = useState(0); // contador de mensagens novas
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 Atualiza o título da aba conforme a rota
  useEffect(() => {
    const titles = {
      "/": "Home | Study Match",
      "/profile": "O teu perfil | Study Match",
      "/login": "Entrar | Study Match",
      "/conversations": "Mensagens | Study Match",
    };
    document.title = titles[location.pathname] || "Study Match";
  }, [location]);

  // 🔹 Monitora o estado da autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Estado do utilizador:", u);
      setUser(u || null);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Escuta em tempo real o número de mensagens não lidas
  useEffect(() => {
    if (!user) return;

    const q = collection(db, "users", user.uid, "conversations");
    const unsub = onSnapshot(q, (snap) => {
      let count = 0;
      snap.forEach((doc) => {
        const data = doc.data();
        // Exemplo: cada conversa pode ter campo "unread" com número de mensagens por ler
        if (data.unread && data.unread > 0) count += data.unread;
      });
      setUnreadCount(count);
    });

    return () => unsub();
  }, [user]);

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
          <Link to="/conversations">
            💬 Mensagens {unreadCount > 0 && <strong>({unreadCount})</strong>}
          </Link>{" "}
          |{" "}
          <Link to="/about">Sobre</Link> | <Link to="/terms">Termos</Link>
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
      <div
        style={{
          textAlign: "center",
          marginTop: "100px",
          fontSize: "20px",
        }}
      >
        <h2>🔄 A verificar sessão...</h2>
        <p>Por favor, aguarda um momento.</p>
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
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />

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

