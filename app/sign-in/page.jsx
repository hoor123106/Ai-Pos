// app/sign-in/page.js
"use client";
import { useState } from "react";
import { supabase } from "../../app/utils/supabase/client"
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Supabase sign in function
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(`Login Failed: ${error.message}`);
    } else {
      // Login successful, dashboard par redirect karen
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSignIn} className="p-8 border rounded shadow-lg w-full max-w-sm">
        <h2 className="text-2xl mb-6 text-center">Sign In</h2>

        <label className="block mb-4">
          Email:
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 mt-1 w-full rounded"
            required
          />
        </label>

        <label className="block mb-6">
          Password:
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 mt-1 w-full rounded"
            required
          />
        </label>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 w-full rounded font-semibold"
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