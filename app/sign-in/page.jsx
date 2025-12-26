// app/sign-in/page.js
"use client";
import { useState } from "react";
import { supabase } from "../../app/utils/supabase/client";
import { useRouter } from "next/navigation";
import Dexie from "dexie";

// Database Initialization
const authDb = new Dexie("AuthDB");
authDb.version(1).stores({
  user_session: "email"
});

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Supabase Auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. Offline Session save karein
      await authDb.user_session.put({
        email: email,
        isLoggedIn: true,
        last_login: new Date().toISOString()
      });

      // Dashboard par bhejein
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
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 mt-1 w-full rounded focus:outline-blue-500"
            required
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm font-semibold">Password:</span>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 mt-1 w-full rounded focus:outline-blue-500"
            required
          />
        </label>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 w-full rounded font-semibold transition-colors"
          disabled={loading}
        >
          {loading ? "Logging In..." : "Sign In"}
        </button>

        <p className="mt-4 text-center text-sm">
          Don't have an account? <a href="/sign-up" className="text-blue-500 hover:underline">Sign Up</a>
        </p>
      </form>
    </div>
  );
}