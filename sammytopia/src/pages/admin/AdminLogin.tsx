import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.admin.login(password);
      navigate("/admin/dashboard");
    } catch {
      setError("That password isn't right. Try again.");
    }
  };

  return (
    <form className="admin-form" onSubmit={submit}>
      <h1 style={{ fontSize: "1.4rem" }}>Sammytopia Admin</h1>
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        required
      />
      {error && <p style={{ color: "var(--ember)" }}>{error}</p>}
      <button type="submit">Log in</button>
    </form>
  );
}
