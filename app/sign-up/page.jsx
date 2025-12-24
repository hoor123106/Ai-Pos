// app/sign-up/page.js
"use client";
import { useState } from "react";
import { supabase } from "../../app/utils/supabase/client"
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Supabase sign up function
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(`Sign Up Failed: ${error.message}`);
    } else if (data.user) {
      alert("Success! Check your email for a confirmation link to sign in.");
      // Email verification zaroori hai, isliye sign-in page par bhej rahe hain
      router.push("/sign-in");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSignUp} className="p-8 border rounded shadow-lg w-full max-w-sm">
        <h2 className="text-2xl mb-6 text-center">Create Your Account</h2>

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
          className="bg-green-500 hover:bg-green-600 text-white p-3 w-full rounded font-semibold"
          disabled={loading}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="mt-4 text-center text-sm">
          Already have an account? <a href="/sign-in" className="text-blue-500 hover:underline">Sign In</a>
        </p>

      </form>
    </div>
  );
}