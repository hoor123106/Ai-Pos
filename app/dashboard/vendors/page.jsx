"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "../../utils/supabase/client";

export default function Vendors() {
  const [showForm, setShowForm] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [rates, setRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });

  const [form, setForm] = useState({
    date: "", vendor_name: "", invoice_no: "", description: "", debit: 0, credit: 0, balance: 0,
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendor_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteVendor = async (id) => {
    if (confirm("Are you sure you want to delete this vendor record?")) {
      try {
        await supabase.from("vendor_records").delete().eq("id", id);
        setRows(rows.filter(row => row.id !== id));
      } catch (error) {
        alert("Delete failed: " + error.message);
      }
    }
  };

  useEffect(() => {
    fetchVendors();
    axios.get("https://open.er-api.com/v6/latest/USD").then(res => setRates(res.data.rates));
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm({ ...form, [name]: type === "number" ? parseFloat(value) || 0 : value });
  };

  const saveVendor = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("vendor_records").insert([form]);
    if (!error) {
      setShowForm(false);
      fetchVendors();
      setForm({ date: "", vendor_name: "", invoice_no: "", description: "", debit: 0, credit: 0, balance: 0 });
    } else {
      alert(error.message);
    }
  };

  const convert = (val) => (parseFloat(val || 0) * rates[currency]).toLocaleString(undefined, { minimumFractionDigits: 2 });
  const getSymbol = () => currency === "PKR" ? "Rs " : currency === "USD" ? "$ " : "Dh ";

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>

      <div style={{ marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Vendors</h1>
          <p style={{ color: "#666", fontSize: "14px" }}>Manage vendor invoices and payments.</p>
        </div>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <option value="USD">USD ($)</option><option value="PKR">PKR (Rs)</option><option value="AED">AED</option>
        </select>
      </div>

      <button onClick={() => setShowForm(true)} style={{ backgroundColor: "#000", color: "#fff", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", marginBottom: "20px" }}>
        + Add Vendor Invoice
      </button>

      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
          <thead style={{ backgroundColor: "#fafafa" }}>
            <tr style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase" }}>
              <th style={{ padding: "15px", textAlign: "left" }}>Date</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Vendor Name</th>
              <th style={{ padding: "15px", textAlign: "right" }}>Debit (Paid)</th>
              <th style={{ padding: "15px", textAlign: "right" }}>Credit (Owed)</th>
              <th style={{ padding: "15px", textAlign: "right" }}>Balance</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "15px" }}>{row.date}</td>
                <td style={{ padding: "15px", fontWeight: "600" }}>{row.vendor_name || "---"}</td>
                <td style={{ padding: "15px", textAlign: "right", color: "#0ca678" }}>{getSymbol()}{convert(row.debit)}</td>
                <td style={{ padding: "15px", textAlign: "right", color: "#e03131" }}>{getSymbol()}{convert(row.credit)}</td>
                <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold" }}>{getSymbol()}{convert(row.balance)}</td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <button onClick={() => deleteVendor(row.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ff4d4f" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.15)", zIndex: 998 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: "400px", height: "100%", backgroundColor: "#fff", zIndex: 999, padding: "30px", boxShadow: "-5px 0 25px rgba(0,0,0,0.07)", overflowY: "auto" }}>
            <h2 style={{ marginBottom: "25px" }}>Add Vendor Invoice</h2>
            <form onSubmit={saveVendor} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {[
                { label: "Date", name: "date", type: "date" },
                { label: "Vendor Name", name: "vendor_name", type: "text" },
                { label: "Invoice No", name: "invoice_no", type: "text" },
                { label: "Debit (Paid)", name: "debit", type: "number" },
                { label: "Credit (Owed)", name: "credit", type: "number" },
                { label: "Balance", name: "balance", type: "number" },
              ].map((field) => (
                <div key={field.name}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>{field.label}</label>
                  <input name={field.name} type={field.type} onChange={handleChange} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
                </div>
              ))}
              <button type="submit" style={{ backgroundColor: "#000", color: "#fff", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer", marginTop: "10px" }}>Save Vendor</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}