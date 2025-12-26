"use client";

import { useState, useEffect } from "react";
import Dexie from "dexie";

// Database Setup
const db = new Dexie("CustomerDB");
db.version(1).stores({
  customer_records: "++id, date, account_name, currency, description, reference" 
});

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [exchangeRates, setExchangeRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });
  const [formCurrency, setFormCurrency] = useState("USD");

  const [form, setForm] = useState({
    date: "", account_name: "", description: "", qty: 0,
    reference: "", debit: 0, credit: 0, balance: 0,
  });

  const currencySymbols = { USD: "$", PKR: "Rs", AED: "Dh" };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await db.customer_records.toArray();
      setRows(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const formatValue = (val, rowCurrency) => {
    const amount = val !== undefined && val !== null ? val : 0;
    const activeCurrency = rowCurrency || "USD"; 
    const symbol = currencySymbols[activeCurrency] || "";
    return `${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const numValue = type === "number" ? (value === "" ? 0 : parseFloat(value)) : value;
    
    setForm((prev) => {
        const updated = { ...prev, [name]: numValue };
        if (name === "debit" || name === "credit") {
            const d = name === "debit" ? (value === "" ? 0 : parseFloat(value)) : (prev.debit || 0);
            const c = name === "credit" ? (value === "" ? 0 : parseFloat(value)) : (prev.credit || 0);
            updated.balance = parseFloat((d - c).toFixed(2));
        }
        return updated;
    });
  };

  const handleCurrencyChange = (newCurr) => {
    const factor = exchangeRates[newCurr] / exchangeRates[formCurrency];
    setForm((prev) => ({
      ...prev,
      debit: parseFloat((prev.debit * factor).toFixed(2)),
      credit: parseFloat((prev.credit * factor).toFixed(2)),
      balance: parseFloat((prev.balance * factor).toFixed(2)),
    }));
    setFormCurrency(newCurr);
  };

  const handleManualRateChange = (currency, newRate) => {
    setExchangeRates(prev => ({ ...prev, [currency]: parseFloat(newRate) || 0 }));
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    await db.customer_records.add({ 
      ...form, 
      currency: formCurrency, 
      created_at: new Date().toISOString() 
    });
    setShowForm(false);
    fetchCustomers();
    setForm({ date: "", account_name: "", description: "", qty: 0, reference: "", debit: 0, credit: 0, balance: 0 });
    setFormCurrency("USD");
  };

  const deleteCustomer = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    await db.customer_records.delete(id);
    fetchCustomers();
  };

  const inputStyle = {
    width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd",
    fontSize: "14px", marginTop: "5px", boxSizing: "border-box"
  };

  const labelStyle = { fontSize: "13px", fontWeight: "bold", display: "block", marginTop: "15px" };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Customers</h1>
      <button onClick={() => setShowForm(true)} style={{ backgroundColor: "#000", color: "#fff", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", margin: "20px 0" }}>
        + Add Customer
      </button>

      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1200px" }}>
          <thead style={{ backgroundColor: "#fafafa" }}>
            <tr style={{ fontSize: "12px", color: "#6b7280" }}>
              <th style={{ padding: "15px" }}>DATE</th>
              <th style={{ padding: "15px" }}>ACCOUNT NAME</th>
              <th style={{ padding: "15px" }}>DESCRIPTION</th>
              <th style={{ padding: "15px" }}>QTY</th>
              <th style={{ padding: "15px" }}>REF NO.</th>
              <th style={{ padding: "15px" }}>DEBIT</th>
              <th style={{ padding: "15px" }}>CREDIT</th>
              <th style={{ padding: "15px" }}>BALANCE</th>
              <th style={{ padding: "15px" }}>ACTION</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: "14px" }}>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                <td style={{ padding: "15px" }}>{row.date || "—"}</td>
                <td style={{ padding: "15px", fontWeight: "500" }}>{row.account_name || "—"}</td>
                <td style={{ padding: "15px" }}>{row.description || "—"}</td>
                <td style={{ padding: "15px" }}>{row.qty || 0}</td>
                <td style={{ padding: "15px" }}>{row.reference || "—"}</td>
                <td style={{ padding: "15px", color: "#0ca678", fontWeight: "bold" }}>{formatValue(row.debit, row.currency)}</td>
                <td style={{ padding: "15px", color: "#e03131", fontWeight: "bold" }}>{formatValue(row.credit, row.currency)}</td>
                <td style={{ padding: "15px", fontWeight: "bold" }}>{formatValue(row.balance, row.currency)}</td>
                <td style={{ padding: "15px" }}>
                  <button onClick={() => deleteCustomer(row.id)} title="Delete" style={{ color: "#ff4d4f", border: "none", background: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.2)", zIndex: 998 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: "400px", height: "100%", backgroundColor: "#fff", zIndex: 999, padding: "30px", overflowY: "auto", boxShadow: "-5px 0 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginBottom: "20px" }}>Add Entry</h2>
            
            <form onSubmit={saveCustomer}>
              {/* Currency & Rates Section */}
              <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #eee" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Currency & Live Rates</label>
                <select value={formCurrency} onChange={(e) => handleCurrencyChange(e.target.value)} style={inputStyle}>
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="AED">AED (Dh)</option>
                </select>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px" }}>PKR/USD Rate</label>
                    <input type="number" value={exchangeRates.PKR} onChange={(e) => handleManualRateChange("PKR", e.target.value)} style={{ width: "100%", padding: "5px", border: "1px solid #ccc" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px" }}>AED/USD Rate</label>
                    <input type="number" value={exchangeRates.AED} onChange={(e) => handleManualRateChange("AED", e.target.value)} style={{ width: "100%", padding: "5px", border: "1px solid #ccc" }} />
                  </div>
                </div>
              </div>

              <label style={labelStyle}>Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} style={inputStyle} />

              <label style={labelStyle}>Customer Name</label>
              <input name="account_name" value={form.account_name} onChange={handleChange} placeholder="-" style={inputStyle} />

              <label style={labelStyle}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="-" style={{ ...inputStyle, height: "60px", resize: "none" }} />

              <label style={labelStyle}>Quantity (QTY)</label>
              <input name="qty" type="number" value={form.qty || ""} onChange={handleChange} placeholder="0" style={inputStyle} />

              <label style={labelStyle}>Reference No.</label>
              <input name="reference" value={form.reference} onChange={handleChange} placeholder="-" style={inputStyle} />

              <label style={{ ...labelStyle, color: "#0ca678" }}>Debit ({currencySymbols[formCurrency]})</label>
              <input name="debit" type="number" step="any" value={form.debit || ""} onChange={handleChange} placeholder="0.00" style={inputStyle} />

              <label style={{ ...labelStyle, color: "#e03131" }}>Credit ({currencySymbols[formCurrency]})</label>
              <input name="credit" type="number" step="any" value={form.credit || ""} onChange={handleChange} placeholder="0.00" style={inputStyle} />

              <label style={labelStyle}>Balance ({currencySymbols[formCurrency]})</label>
              <input name="balance" type="number" value={form.balance} readOnly style={{ ...inputStyle, backgroundColor: "#f3f4f6", fontWeight: "bold" }} />

              <button type="submit" style={{ width: "100%", backgroundColor: "#000", color: "#fff", padding: "15px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px", marginTop: "25px" }}>
                Save Record
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}