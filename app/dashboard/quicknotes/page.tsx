"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase/client";

// TypeScript Interface for better editor support
interface LedgerEntry {
  id: string;
  entry_date: string;
  name: string;
  description: string;
  debit: number;
  credit: number;
  total: number;
}

export default function QuickNotes() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    name: "",
    description: "",
    debit: 0,
    credit: 0,
  });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("general_ledger")
        .select("*")
        .order("entry_date", { ascending: false });

      if (error) {
        console.error("Fetch Error:", error.message);
      } else {
        setEntries((data as LedgerEntry[]) || []);
      }
    } catch (err) {
      console.error("System Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Logic: Credit (In) - Debit (Out)
    const netTotal = Number(form.credit) - Number(form.debit);

    const payload = {
      entry_date: form.entry_date,
      name: form.name,
      description: form.description,
      debit: Number(form.debit),
      credit: Number(form.credit),
      total: netTotal
    };

    try {
      if (isEditing && currentId) {
        const { error } = await supabase
          .from("general_ledger")
          .update(payload)
          .eq("id", currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("general_ledger")
          .insert([payload]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchEntries();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const openEditModal = (item: LedgerEntry) => {
    setIsEditing(true);
    setCurrentId(item.id);
    setForm({
      entry_date: item.entry_date,
      name: item.name || "",
      description: item.description || "",
      debit: item.debit || 0,
      credit: item.credit || 0,
    });
    setShowModal(true);
  };

  const deleteEntry = async (id: string) => {
    if (confirm("Kya aap waqai ye entry delete karna chahte hain?")) {
      const { error } = await supabase.from("general_ledger").delete().eq("id", id);
      if (!error) fetchEntries();
      else alert(error.message);
    }
  };

  return (
    <div style={{ padding: "40px", backgroundColor: "#f9fafb", minHeight: "100vh", fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111" }}>General Ledger</h1>
          <p style={{ color: "#666" }}>Record and track all financial entries in one place.</p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setForm({ entry_date: new Date().toISOString().split("T")[0], name: "", description: "", debit: 0, credit: 0 });
            setShowModal(true);
          }}
          style={{ backgroundColor: "#000", color: "#fff", padding: "12px 25px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}
        >
          + Add New Entry
        </button>
      </div>

      {/* Table Section */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#fafafa" }}>
            <tr style={{ textAlign: "left", fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <th style={{ padding: "15px" }}>Date</th>
              <th style={{ padding: "15px" }}>Name</th>
              <th style={{ padding: "15px" }}>Description</th>
              <th style={{ padding: "15px", textAlign: "right" }}>Debit (Out)</th>
              <th style={{ padding: "15px", textAlign: "right" }}>Credit (In)</th>
              <th style={{ padding: "15px", textAlign: "right" }}>Net Total</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "20px", textAlign: "center" }}>Loading records...</td></tr>
            ) : entries.length > 0 ? entries.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "15px", fontSize: "14px" }}>{item.entry_date}</td>
                <td style={{ padding: "15px", fontWeight: "600", fontSize: "14px" }}>{item.name}</td>
                <td style={{ padding: "15px", fontSize: "14px", color: "#444" }}>{item.description}</td>
                <td style={{ padding: "15px", textAlign: "right", color: "#111", fontWeight: "500" }}>{item.debit.toLocaleString()}</td>
                <td style={{ padding: "15px", textAlign: "right", color: "#111", fontWeight: "500" }}>{item.credit.toLocaleString()}</td>
                <td style={{
                  padding: "15px",
                  textAlign: "right",
                  fontWeight: "bold",
                  color: "#111"
                }}>
                  {item.total >= 0 ? `+${item.total.toLocaleString()}` : item.total.toLocaleString()}
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <button onClick={() => openEditModal(item)} style={{ cursor: "pointer", color: "#228be6", border: "none", background: "none", marginRight: "15px", fontWeight: "600" }}>View/Edit</button>
                  <button onClick={() => deleteEntry(item.id)} style={{ cursor: "pointer", color: "#fa5252", border: "none", background: "none", fontWeight: "600" }}>Delete</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#999" }}>Abhi tak koi entry nahi mili.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal / Popup Form */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "16px", width: "100%", maxWidth: "450px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginBottom: "20px", fontSize: "22px", fontWeight: "bold" }}>{isEditing ? "Edit Entry" : "Add New Entry"}</h2>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "5px", color: "#374151" }}>Date</label>
                <input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }} required />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "5px", color: "#374151" }}>Name / Account</label>
                <input type="text" placeholder="e.g. Ali Khan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }} required />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "5px", color: "#374151" }}>Description</label>
                <textarea placeholder="Transaction details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", height: "80px", resize: "none" }} required />
              </div>

              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "5px", color: "#374151" }}>Debit (Out)</label>
                  <input type="number" value={form.debit} onChange={e => setForm({ ...form, debit: Number(e.target.value) })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "5px", color: "#374151" }}>Credit (In)</label>
                  <input type="number" value={form.credit} onChange={e => setForm({ ...form, credit: Number(e.target.value) })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
                </div>
              </div>

              {/* Live Calculation (Without Colors) */}
              <div style={{ padding: "15px", backgroundColor: "#f3f4f6", borderRadius: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "14px", color: "#4b5563" }}>Net Balance Calculation: </span>
                <strong style={{ fontSize: "18px", color: "#111" }}>
                  {(form.credit - form.debit).toLocaleString()}
                </strong>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button type="submit" style={{ flex: 2, padding: "14px", background: "#000", color: "#fff", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}>Save Entry</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "14px", background: "#f3f4f6", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", color: "#4b5563" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}