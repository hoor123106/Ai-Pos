"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authDb } from "../utils/db"; // Aapki banayi hui file ka path

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Pehle check karein user already exist to nahi karta
      const existingUser = await authDb.users.get(email);
      if (existingUser) throw new Error("User with this email already exists!");

      // User save karein
      await authDb.users.put({
        email,
        password,
        created_at: new Date().toISOString()
      });

      alert("Account created successfully!");
      router.push("/sign-in");
    } catch (error) {
      alert(`Sign Up Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form onSubmit={handleSignUp} className="p-8 border rounded shadow-lg w-full max-w-sm bg-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Your Account</h2>
        <label className="block mb-4">
          <span className="text-sm font-semibold">Email:</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 mt-1 w-full rounded focus:outline-blue-500" required />
        </label>
        <label className="block mb-6">
          <span className="text-sm font-semibold">Password:</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 mt-1 w-full rounded focus:outline-blue-500" required />
        </label>
        <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white p-3 w-full rounded font-semibold transition-colors">
          {loading ? "Creating..." : "Sign Up"}
        </button>
        <p className="mt-4 text-center text-sm">
          Already have an account? <a href="/sign-in" className="text-blue-500 hover:underline">Sign In</a>
        </p>
      </form>
    </div>
  );
}