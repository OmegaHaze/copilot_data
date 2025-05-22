import { useState } from "react";

export default function Login({ onComplete }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleKey = async (e) => {
    if (e.key !== "Enter") return;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Invalid login");

      onComplete();
    } catch {
      setError("NOPE");
      setUsername("");
      setPassword("");
    }
  };

  return (
    <div className="text-green-500 uppercase">
      <div className={`text-center text-lg mb-2 tracking-widest ${error ? "animate-glitch text-red-500" : ""}`}>
        {error || "LOGIN"}
      </div>

      <div className="flex flex-col items-center gap-2">
        <input
          type="text"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="USERNAME"
          className="bg-black border-b border-green-500 text-green-500 text-center tracking-widest outline-none placeholder-green-700"
          onKeyDown={handleKey}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="PASSWORD"
          className="bg-black border-b border-green-500 text-green-500 text-center tracking-widest outline-none placeholder-green-700"
          onKeyDown={handleKey}
        />
      </div>
    </div>
  );
}
