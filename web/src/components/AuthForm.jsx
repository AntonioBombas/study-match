import React, { useState } from "react";
import { auth } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged 
} from "firebase/auth";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const provider = new GoogleAuthProvider();

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError("");  // Reset any previous errors
      await createUserWithEmailAndPassword(auth, email, password);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");  // Reset any previous errors
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  const handleLoginWithGoogle = async () => {
    try {
      setLoading(true);
      setError("");  // Reset any previous errors
      await signInWithPopup(auth, provider);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    <div>
      <h1>Login / Registo</h1>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Password"
      />
      <button onClick={handleLogin} disabled={loading}>Login</button>
      <button onClick={handleRegister} disabled={loading}>Registar</button>
      <button onClick={handleLoginWithGoogle} disabled={loading}>
        {loading ? "Aguarde..." : "Entrar com Google"}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

