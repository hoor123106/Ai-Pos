"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authDb } from "../utils/db"; // Path check kar lein

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // User ko email se find karein
      const user = await authDb.users.get(email);

      if (!user || user.password !== password) {
        throw new Error("Invalid email or password");
      }

      // Session save karein
      localStorage.setItem("isLoggedIn", "true");
      await authDb.user_session.put({
        id: "active_user",
        email: email,
        last_login: new Date().toISOString()
      });

      router.push("/dashboard");
    } catch (error) {
      alert(`Login Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form onSubmit={handleSignIn} className="p-8 border rounded shadow-lg w-full max-w-sm bg-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
        <label className="block mb-4">
          <span className="text-sm font-semibold">Email:</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 mt-1 w-full rounded focus:outline-blue-500" required />
        </label>
        <label className="block mb-6">
          <span className="text-sm font-semibold">Password:</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 mt-1 w-full rounded focus:outline-blue-500" required />
        </label>
        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white p-3 w-full rounded font-semibold transition-colors">
          {loading ? "Logging In..." : "Sign In"}
        </button>
        <p className="mt-4 text-center text-sm">
          Don't have an account? <a href="/sign-up" className="text-blue-500 hover:underline">Sign Up</a>
        </p>
      </form>
    </div>
  );
}