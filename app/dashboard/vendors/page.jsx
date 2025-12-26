"use client";

import { useState, useEffect } from "react";
import Dexie from "dexie";

// Database Setup
const db = new Dexie("VendorDB");
db.version(2).stores({
  vendor_records: "++id, date, vendor_name, currency" 
});

export default function Vendors() {
  const [showForm, setShowForm] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [exchangeRates, setExchangeRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });
  const [formCurrency, setFormCurrency] = useState("USD");

  const [form, setForm] = useState({
    date: "", vendor_name: "", qty: 0, invoice_no: "", description: "",
    debit: 0, credit: 0, balance: 0,
  });

  const currencySymbols = { USD: "$", PKR: "Rs", AED: "Dh" };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await db.vendor_records.toArray();
      setRows(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

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
      debit: parseFloat(((prev.debit || 0) * factor).toFixed(2)),
      credit: parseFloat(((prev.credit || 0) * factor).toFixed(2)),
      balance: parseFloat(((prev.balance || 0) * factor).toFixed(2)),
    }));
    setFormCurrency(newCurr);
  };

  const handleManualRateChange = (currency, newRate) => {
    setExchangeRates(prev => ({ ...prev, [currency]: parseFloat(newRate) || 0 }));
  };

  const saveVendor = async (e) => {
    e.preventDefault();
    try {
      await db.vendor_records.add({ 
        ...form, 
        currency: formCurrency,
        created_at: new Date().toISOString() 
      });
      
      setShowForm(false);
      fetchVendors(); 
      setForm({ date: "", vendor_name: "", qty: 0, invoice_no: "", description: "", debit: 0, credit: 0, balance: 0 });
      setFormCurrency("USD");
    } catch (error) { 
      console.error("Save error:", error);
    }
  };

  const deleteEntry = async (id) => {
    if (!confirm("Are you sure you want to delete this vendor entry?")) return;
    await db.vendor_records.delete(id);
    fetchVendors();
  };

  const labelStyle = { fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "5px" };
  const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box" };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: "25px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#000", margin: "0" }}>Vendors</h1>
      </div>

      <button onClick={() => setShowForm(true)} style={{ backgroundColor: "#000", color: "#fff", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500", marginBottom: "20px" }}>
        + Add Vendor
      </button>

      {/* Table Section */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
          <thead style={{ backgroundColor: "#fafafa" }}>
            <tr style={{ fontSize: "12px", color: "#6b7280" }}>
              <th style={{ padding: "15px" }}>DATE</th>
              <th style={{ padding: "15px" }}>VENDOR NAME</th>
              <th style={{ padding: "15px" }}>QTY</th>
              <th style={{ padding: "15px" }}>INVOICE NO</th>
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
                <td style={{ padding: "15px", fontWeight: "500" }}>{row.vendor_name || "—"}</td>
                <td style={{ padding: "15px" }}>{row.qty || 0}</td>
                <td style={{ padding: "15px" }}>{row.invoice_no || "—"}</td>
                <td style={{ padding: "15px", color: "#e03131", fontWeight: "bold" }}>{formatValue(row.debit, row.currency)}</td>
                <td style={{ padding: "15px", color: "#0ca678", fontWeight: "bold" }}>{formatValue(row.credit, row.currency)}</td>
                <td style={{ padding: "15px", fontWeight: "bold" }}>{formatValue(row.balance, row.currency)}</td>
                <td style={{ padding: "15px" }}>
                  <button onClick={() => deleteEntry(row.id)} title="Delete" style={{ color: "#ff4d4f", border: "none", background: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Drawer */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.15)", zIndex: 998 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: "400px", height: "100%", backgroundColor: "#fff", zIndex: 999, padding: "30px", overflowY: "auto", boxShadow: "-5px 0 25px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>Add Entry</h2>
            
            <form onSubmit={saveVendor} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #eee" }}>
                <label style={{ fontSize: "12px", fontWeight: "bold" }}>Currency & Rates</label>
                <select value={formCurrency} onChange={(e) => handleCurrencyChange(e.target.value)} style={{ ...inputStyle, marginTop: "5px" }}>
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="AED">AED (Dh)</option>
                </select>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                   <input type="number" value={exchangeRates.PKR} onChange={(e) => handleManualRateChange("PKR", e.target.value)} placeholder="PKR Rate" style={{ ...inputStyle, padding: "8px" }} />
                   <input type="number" value={exchangeRates.AED} onChange={(e) => handleManualRateChange("AED", e.target.value)} placeholder="AED Rate" style={{ ...inputStyle, padding: "8px" }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Date</label>
                <input name="date" type="date" value={form.date} onChange={handleChange} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Vendor Name</label>
                <input name="vendor_name" value={form.vendor_name} onChange={handleChange} placeholder="-" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Invoice No</label>
                <input name="invoice_no" value={form.invoice_no} onChange={handleChange} placeholder="-" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Quantity (Qty)</label>
                <input name="qty" type="number" value={form.qty || ""} onChange={handleChange} placeholder="0" style={inputStyle} />
              </div>

              <div>
                <label style={{ ...labelStyle, color: "#e03131" }}>Debit ({currencySymbols[formCurrency]})</label>
                <input name="debit" type="number" step="any" value={form.debit || ""} onChange={handleChange} placeholder="0.00" style={inputStyle} />
              </div>

              <div>
                <label style={{ ...labelStyle, color: "#0ca678" }}>Credit ({currencySymbols[formCurrency]})</label>
                <input name="credit" type="number" step="any" value={form.credit || ""} onChange={handleChange} placeholder="0.00" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Calculated Balance</label>
                <input name="balance" type="number" value={form.balance} readOnly style={{ ...inputStyle, backgroundColor: "#f3f4f6", fontWeight: "bold" }} />
              </div>

              <button type="submit" style={{ backgroundColor: "#000", color: "#fff", padding: "16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px", marginTop: "10px" }}>
                Save Entry
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}