import { useState } from "react";

export default function Signup({ setCurrentPage, onAuth }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    const res = await fetch("http://localhost:8000/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.error || "Signup failed");
      return;
    }

    // Save login info locally
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.user._id);
    localStorage.setItem("username", data.user.username);

    // Update parent App state
    onAuth({
      userId: data.user._id,
      username: data.user.username
    });

    alert("Signup successful!");
    setCurrentPage("home");
  };

  return (
    <div>
      <h1>Sign Up</h1>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
      <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={submit}>Sign Up</button>
    </div>
  );
}
