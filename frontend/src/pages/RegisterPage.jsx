import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export function RegisterPage({ onRegister }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }
    try {
      setWorking(true);
      setError("");
      await api.register(username, email, password, confirmPassword);
      await onRegister();
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <form
      className="mx-auto mt-10 max-w-md space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      onSubmit={submit}
    >
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Create account</h2>
      {error && <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>}
      <input
        className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-red-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-red-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-red-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-red-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        placeholder="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button
        className="h-11 w-full rounded-xl bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={working}
      >
        {working ? "Creating..." : "Register"}
      </button>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Already have an account?{" "}
        <Link className="font-medium text-red-600 dark:text-red-400" to="/login">
          Login
        </Link>
      </p>
    </form>
  );
}
