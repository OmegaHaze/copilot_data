import { useState } from 'react';

export default function SetAdmin({ onComplete }) {
  const [step, setStep] = useState("name");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (password !== confirm) {
      setError("NOPE");
      setTimeout(() => {
        setError("");
        setStep("password");
        setPassword("");
        setConfirm("");
      }, 800);
      return;
    }

    try {
      const res = await fetch("/api/auth/set-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, password }),
      });

      if (!res.ok) throw new Error("Error");

      onComplete();
    } catch {
      setError("NOPE");
      setTimeout(() => {
        setError("");
        setStep("name");
        setName("");
        setPassword("");
        setConfirm("");
      }, 800);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") {
      if (step === "name" && name) setStep("password");
      else if (step === "password" && password) setStep("confirm");
      else if (step === "confirm" && confirm) handleSubmit();
    }
  };

  const placeholder = step === "name" ? "NAME" : step === "password" ? "PASSWORD" : "CONFIRM";
  const value = step === "name" ? name : step === "password" ? password : confirm;

  return (
    <div className="text-green-500 uppercase w-full text-center font-mono">
      <div className={`text-lg mb-2 tracking-widest ${error ? "text-red-500 animate-glitch" : ""}`}>
        {error || "SET ADMIN"}
      </div>

      <div className="flex justify-center">
        <div className="bg-black border border-green-600 p-2 shadow-inner w-64">
          <input
            autoFocus
            type={step === "name" ? "text" : "password"}
            value={value}
            onChange={(e) => {
              if (step === "name") setName(e.target.value);
              else if (step === "password") setPassword(e.target.value);
              else setConfirm(e.target.value);
            }}
            onKeyDown={handleKey}
            placeholder={placeholder}
            className="bg-black text-green-500 w-full text-center tracking-widest outline-none border-none placeholder-green-700"
          />
        </div>
      </div>
    </div>
  );
}
