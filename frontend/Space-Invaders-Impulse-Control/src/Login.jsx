import { useState } from "react";

export default function Login({ setCurrentPage, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert("Login failed: " + (data.error || "Invalid credentials"));
      return;
    }

    // Correct fields from backend
    const userId = data.user._id;
    const username = data.user.username;

    // Save login info
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("username", username);

    // Notify parent App
    onAuth({
      userId,
      username
    });

    setCurrentPage("home");
  };

  return (
    <div>
      <h1>Login</h1>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
    </div>
  );
}
