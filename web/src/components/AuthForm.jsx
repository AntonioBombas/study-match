import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  // 🔹 Cria o documento base do utilizador no Firestore (se não existir)
  const ensureUserDoc = async (user) => {
    try {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || "",
          createdAt: serverTimestamp(),
          isTutor: true,
        });
      }
    } catch (err) {
      console.error("Erro ao criar documento de utilizador:", err);
    }
  };

  // 🔹 Registo
  const handleRegister = async () => {
    try {
      setLoading(true);
      setError("");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await ensureUserDoc(user); // garante documento Firestore
      setSuccessMessage(`🎉 Bem-vindo, ${user.email}!`);
      navigate("/profile"); // ✅ já está autenticado, redireciona de imediato
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Login
  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await ensureUserDoc(user); // no caso de conta antiga sem doc
      setSuccessMessage(`👋 Bem-vindo de volta, ${user.email}!`);
      navigate("/"); // ✅ vai para home
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Login com Google
  const handleLoginWithGoogle = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await ensureUserDoc(user);
      const isNewUser = result?._tokenResponse?.isNewUser;

      if (isNewUser) {
        setSuccessMessage(
          `✨ Conta criada com Google: ${user.displayName || user.email}`
        );
        navigate("/profile");
      } else {
        setSuccessMessage(
          `👋 Bem-vindo de volta, ${user.displayName || user.email}!`
        );
        navigate("/");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", textAlign: "center" }}>
      <h1>Login / Registo</h1>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={{
          display: "block",
          width: "100%",
          marginBottom: 10,
          padding: 8,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        style={{
          display: "block",
          width: "100%",
          marginBottom: 10,
          padding: 8,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            marginRight: 8,
            padding: "8px 12px",
            borderRadius: 6,
            border: "none",
            background: "#007bff",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Login
        </button>
        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "none",
            background: "#28a745",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Registar
        </button>
      </div>

      <button
        onClick={handleLoginWithGoogle}
        disabled={loading}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          border: "none",
          background: "#db4437",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {loading ? "Aguarde..." : "Entrar com Google"}
      </button>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      {successMessage && (
        <p
          style={{
            color: "green",
            marginTop: 12,
            background: "#e6ffe6",
            padding: "8px",
            borderRadius: 6,
          }}
        >
          {successMessage}
        </p>
      )}
    </div>
  );
}

