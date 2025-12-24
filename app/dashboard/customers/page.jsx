"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "../../utils/supabase/client"; 

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [rates, setRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });

  const [form, setForm] = useState({
<<<<<<< HEAD
    date: null, 
    account_name: "", 
    description: "", 
    qty: 0,
    reference: "", 
    debit: 0, 
    credit: 0, 
    balance: 0,
=======
    date: "", account_name: "", description: "", qty: 0,
    reference: "", debit: 0, credit: 0, balance: 0,
>>>>>>> 25ea72f5e9edcbe4dc55208d05764e3879fcfd93
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customer_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
=======
  // --- DELETE FUNCTION ---
>>>>>>> 25ea72f5e9edcbe4dc55208d05764e3879fcfd93
  const deleteCustomer = async (id) => {
    if (confirm("Are you sure you want to delete this record?")) {
      try {
        const { error } = await supabase
          .from("customer_records")
          .delete()
          .eq("id", id);

        if (error) throw error;
<<<<<<< HEAD
=======
        
        // List update karo bina page refresh kiye
>>>>>>> 25ea72f5e9edcbe4dc55208d05764e3879fcfd93
        setRows(rows.filter(row => row.id !== id));
      } catch (error) {
        alert("Delete failed: " + error.message);
      }
    }
  };

  useEffect(() => {
    fetchCustomers();
    axios.get("https://open.er-api.com/v6/latest/USD")
      .then(res => setRates(res.data.rates))
      .catch(err => console.log("Rates fetch error"));
  }, []);

  const convert = (val) => {
    if (!val) return "0.00";
    const converted = parseFloat(val) * rates[currency];
    return converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getSymbol = () => {
    if (currency === "PKR") return "Rs ";
    if (currency === "USD") return "$ ";
    if (currency === "AED") return "Dh ";
    return "";
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
<<<<<<< HEAD
    
    let finalValue = value;
    if (type === "number") finalValue = parseFloat(value) || 0;
    
    // Logic: Agar date empty ho to null bhejna hai taake entry save ho jaye
    if (type === "date" && value === "") {
        finalValue = null;
    }

    setForm({ 
      ...form, 
      [name]: finalValue 
=======
    setForm({ 
      ...form, 
      [name]: type === "number" ? parseFloat(value) || 0 : value 
>>>>>>> 25ea72f5e9edcbe4dc55208d05764e3879fcfd93
    });
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
<<<<<<< HEAD

    // --- MAIN LOGIC ---
    // Entry sirf tab rukegi agar Debit aur Credit dono 0 hon
    if (form.debit === 0 && form.credit === 0) {
      alert("Pehlay Debit ya Credit amount likhen!");
      return; 
    }

    try {
      // Baqi fields khali (empty) honay par bhi entry save ho jayegi
      const { error } = await supabase.from("customer_records").insert([form]);
      if (error) throw error;
      
      setShowForm(false);
      fetchCustomers();
      // Form reset
      setForm({ date: null, account_name: "", description: "", qty: 0, reference: "", debit: 0, credit: 0, balance: 0 });
=======
    try {
      const { error } = await supabase.from("customer_records").insert([form]);
      if (error) throw error;
      setShowForm(false);
      fetchCustomers();
      setForm({ date: "", account_name: "", description: "", qty: 0, reference: "", debit: 0, credit: 0, balance: 0 });
>>>>>>> 25ea72f5e9edcbe4dc55208d05764e3879fcfd93
    } catch (error) {
      alert("Error saving: " + error.message);
    }
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#000", margin: "0" }}>Customers</h1>
          <p style={{ color: "#666", fontSize: "14px", marginTop: "4px" }}>Manage your customer accounts and transaction history.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: "12px", fontWeight: "bold" }}>Currency:</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ border: "none", outline: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
            <option value="USD">USD ($)</option>
            <option value="PKR">PKR (Rs)</option>
            <option value="AED">AED</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setShowForm(true)} style={{ backgroundColor: "#000", color: "#fff", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500", fontSize: "14px" }}>
          + Add Customer
        </button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflowX: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#111" }}>Customer Records</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
          <thead style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
            <tr style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "15px 20px", textAlign: "left" }}>Date</th>
              <th style={{ padding: "15px 20px", textAlign: "left" }}>Account Name</th>
              <th style={{ padding: "15px 20px", textAlign: "left" }}>Description</th>
              <th style={{ padding: "15px 20px", textAlign: "center" }}>QTY</th>
              <th style={{ padding: "15px 20px", textAlign: "center" }}>Ref No.</th>
              <th style={{ padding: "15px 20px", textAlign: "right" }}>Debit</th>
              <th style={{ padding: "15px 20px", textAlign: "right" }}>Credit</th>
              <th style={{ padding: "15px 20px", textAlign: "right" }}>Balance</th>
              <th style={{ padding: "15px 20px", textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: "14px", color: "#374151" }}>
            {loading ? (
              <tr><td colSpan="9" style={{ padding: "40px", textAlign: "center" }}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="9" style={{ padding: "60px", textAlign: "center", color: "#9ca3af" }}>No records found.</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
<<<<<<< HEAD
                  <td style={{ padding: "15px 20px" }}>{row.date || "___"}</td>
                  <td style={{ padding: "15px 20px", fontWeight: "500" }}>{row.account_name || "___"}</td>
                  <td style={{ padding: "15px 20px" }}>{row.description || "___"}</td>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>{row.qty || "0"}</td>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>{row.reference || "___"}</td>
=======
                  <td style={{ padding: "15px 20px" }}>{row.date}</td>
                  <td style={{ padding: "15px 20px", fontWeight: "500" }}>{row.account_name}</td>
                  <td style={{ padding: "15px 20px" }}>{row.description}</td>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>{row.qty}</td>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>{row.reference}</td>
>>>>>>> 25ea72f5e9edcbe4dc55208d05764e3879fcfd93
                  <td style={{ padding: "15px 20px", textAlign: "right", color: "#0ca678" }}>{getSymbol()}{convert(row.debit)}</td>
                  <td style={{ padding: "15px 20px", textAlign: "right", color: "#e03131" }}>{getSymbol()}{convert(row.credit)}</td>
                  <td style={{ padding: "15px 20px", textAlign: "right", fontWeight: "bold" }}>{getSymbol()}{convert(row.balance)}</td>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>
<<<<<<< HEAD
                    <button onClick={() => deleteCustomer(row.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ff4d4f", padding: "5px" }}>
=======
                    <button 
                      onClick={() => deleteCustomer(row.id)}
                      style={{ border: "none", background: "none", cursor: "pointer", color: "#ff4d4f", padding: "5px" }}
                      title="Delete Record"
                    >
>>>>>>> 25ea72f5e9edcbe4dc55208d05764e3879fcfd93
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

<<<<<<< HEAD
      {/* Side Drawer Form */}
=======
      {/* Side Drawer Form (Keep your existing form code here) */}
>>>>>>> 25ea72f5e9edcbe4dc55208d05764e3879fcfd93
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: "fixed", top: "64px", left: 0, width: "100%", height: "calc(100% - 64px)", backgroundColor: "rgba(0,0,0,0.15)", zIndex: 998 }} />
          <div style={{ position: "fixed", top: "64px", right: 0, width: "400px", height: "calc(100% - 64px)", backgroundColor: "#fff", zIndex: 999, padding: "30px", boxShadow: "-5px 0 25px rgba(0,0,0,0.07)", overflowY: "auto", borderLeft: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Add New Customer</h2>
              <button onClick={() => setShowForm(false)} style={{ border: "none", background: "none", fontSize: "22px", cursor: "pointer", color: "#bbb" }}>✕</button>
            </div>
            <form onSubmit={saveCustomer} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
<<<<<<< HEAD
               {[
                { label: "Date", name: "date", type: "date", required: false }, // required false taake blank save ho
                { label: "Account Name", name: "account_name", type: "text", required: false },
                { label: "Description", name: "description", type: "text", required: false },
                { label: "QTY", name: "qty", type: "number", required: false },
                { label: "Reference No.", name: "reference", type: "text", required: false },
                { label: "Debit (Amount Paid)", name: "debit", type: "number", required: false },
                { label: "Credit (Amount Owed)", name: "credit", type: "number", required: false },
                { label: "Balance", name: "balance", type: "number", required: false },
              ].map((field) => (
                <div key={field.name}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#4b5563" }}>{field.label}</label>
                  <input 
                    name={field.name} 
                    type={field.type} 
                    onChange={handleChange} 
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", outline: "none", fontSize: "14px" }} 
                  />
=======
               {/* Same form fields as before... */}
               {[
                { label: "Date", name: "date", type: "date" },
                { label: "Account Name", name: "account_name", type: "text" },
                { label: "Description", name: "description", type: "text" },
                { label: "QTY", name: "qty", type: "number" },
                { label: "Reference No.", name: "reference", type: "text" },
                { label: "Debit (USD)", name: "debit", type: "number" },
                { label: "Credit (USD)", name: "credit", type: "number" },
                { label: "Balance (USD)", name: "balance", type: "number" },
              ].map((field) => (
                <div key={field.name}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#4b5563" }}>{field.label}</label>
                  <input name={field.name} type={field.type} required onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", outline: "none", fontSize: "14px" }} />
>>>>>>> 25ea72f5e9edcbe4dc55208d05764e3879fcfd93
                </div>
              ))}
              <div style={{ marginTop: "25px", display: "flex", gap: "12px" }}>
                <button type="submit" style={{ flex: 2, backgroundColor: "#000", color: "#fff", padding: "14px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>Save</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, backgroundColor: "#f3f4f6", color: "#4b5563", padding: "14px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>Cancel</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}