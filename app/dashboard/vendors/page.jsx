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
  const [selectedVendorData, setSelectedVendorData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [exchangeRates, setExchangeRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });
  const [formCurrency, setFormCurrency] = useState("USD");

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    vendor_name: "", qty: 0, invoice_no: "", description: "",
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

  // --- Nayi Summary Calculation Logic ---
  const totalDebitAll = rows.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
  const totalCreditAll = rows.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0);
  const netBalanceAll = totalDebitAll - totalCreditAll;

  const handleVendorClick = (name) => {
    const history = rows.filter(r => r.vendor_name === name);
    const totalDebit = history.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const totalCredit = history.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    const grossProfit = totalCredit - totalDebit;

    setSelectedVendorData({
      name,
      history,
      totalDebit,
      totalCredit,
      grossProfit,
      trialBalance: totalDebit === totalCredit ? "Balanced ✅" : "Unbalanced ⚠️",
      netBalance: totalDebit - totalCredit
    });
  };

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
      setForm({ date: new Date().toISOString().split("T")[0], vendor_name: "", qty: 0, invoice_no: "", description: "", debit: 0, credit: 0, balance: 0 });
      setFormCurrency("USD");
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const deleteEntry = async (id) => {
    if (!confirm("Are you sure?")) return;
    await db.vendor_records.delete(id);
    fetchVendors();
  };

  const labelStyle = { fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "5px" };
  const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box" };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>

      <div style={{ marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#000", margin: "0" }}>Vendors Ledger</h1>
        <button onClick={() => setShowForm(true)} style={{ backgroundColor: "#000", color: "#fff", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500" }}>
          + Add Vendor
        </button>
      </div>

      {/* --- QUICK SUMMARY CARDS --- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>TOTAL BUYING (DEBIT)</span>
          <h2 style={{ color: "#e03131", margin: "10px 0 0" }}>{formatValue(totalDebitAll, "USD")}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>TOTAL RETURNS (CREDIT)</span>
          <h2 style={{ color: "#0ca678", margin: "10px 0 0" }}>{formatValue(totalCreditAll, "USD")}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "2px solid #000" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>NET PAYABLES (BALANCE)</span>
          <h2 style={{ color: "#000", margin: "10px 0 0" }}>{formatValue(netBalanceAll, "USD")}</h2>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
          <thead style={{ backgroundColor: "#fafafa" }}>
            <tr style={{ fontSize: "12px", color: "#6b7280", textAlign: "left" }}>
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
              <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "15px" }}>{row.date || "—"}</td>
                <td
                  onClick={() => handleVendorClick(row.vendor_name)}
                  style={{ padding: "15px", fontWeight: "bold", color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
                >
                  {row.vendor_name || "—"}
                </td>
                <td style={{ padding: "15px" }}>{row.qty || 0}</td>
                <td style={{ padding: "15px" }}>{row.invoice_no || "—"}</td>
                <td style={{ padding: "15px", color: "#e03131", fontWeight: "bold" }}>{formatValue(row.debit, row.currency)}</td>
                <td style={{ padding: "15px", color: "#0ca678", fontWeight: "bold" }}>{formatValue(row.credit, row.currency)}</td>
                <td style={{ padding: "15px", fontWeight: "bold" }}>{formatValue(row.balance, row.currency)}</td>
                <td style={{ padding: "15px" }}>
                  <button onClick={() => deleteEntry(row.id)} style={{ color: "#ff4d4f", border: "none", background: "none", cursor: "pointer" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- CENTER POPUP (VENDOR REPORT) --- */}
      {selectedVendorData && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
          <div style={{ backgroundColor: "#fff", width: "600px", maxHeight: "90vh", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ backgroundColor: "#1a5f7a", color: "#fff", padding: "25px", position: "relative" }}>
              <h2 style={{ margin: 0, fontSize: "22px" }}>VENDOR FINANCIAL INVOICE</h2>
              <p style={{ margin: "5px 0 0", opacity: 0.8 }}>Vendor: {selectedVendorData.name}</p>
              <button onClick={() => setSelectedVendorData(null)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer" }}>&times;</button>
            </div>
            <div style={{ padding: "30px", overflowY: "auto" }}>
              <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
                <div style={{ flex: 1, background: "#fef2f2", padding: "15px", borderRadius: "10px", border: "1px solid #fecaca" }}>
                  <small style={{ color: "#991b1b", fontWeight: "bold" }}>TOTAL BUYING</small>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>{formatValue(selectedVendorData.totalDebit)}</div>
                </div>
                <div style={{ flex: 1, background: "#f0fdf4", padding: "15px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <small style={{ color: "#166534", fontWeight: "bold" }}>TOTAL RETURNS</small>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>{formatValue(selectedVendorData.totalCredit)}</div>
                </div>
              </div>
              <h4 style={{ borderBottom: "2px solid #1a5f7a", paddingBottom: "8px", color: "#1a5f7a" }}>Financial Analysis</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #eee" }}><td style={{ padding: "10px 0" }}>Gross Profit / Loss:</td><td align="right" style={{ fontWeight: "bold", color: selectedVendorData.grossProfit >= 0 ? "green" : "red" }}>{formatValue(selectedVendorData.grossProfit)}</td></tr>
                  <tr style={{ borderBottom: "1px solid #eee" }}><td style={{ padding: "10px 0" }}>Trial Balance Status:</td><td align="right" style={{ fontWeight: "bold" }}>{selectedVendorData.trialBalance}</td></tr>
                </tbody>
              </table>
              <button onClick={() => setSelectedVendorData(null)} style={{ width: "100%", padding: "14px", backgroundColor: "#1a5f7a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Close Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Drawer (Aapki logic as it is) */}
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
              <label style={labelStyle}>Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} style={inputStyle} />
              <label style={labelStyle}>Vendor Name</label>
              <input name="vendor_name" value={form.vendor_name} onChange={handleChange} placeholder="Account Name" style={inputStyle} required />
              <label style={labelStyle}>Invoice No</label>
              <input name="invoice_no" value={form.invoice_no} onChange={handleChange} style={inputStyle} />
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Debit (Buy)</label><input name="debit" type="number" value={form.debit || ""} onChange={handleChange} style={inputStyle} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Credit (Return)</label><input name="credit" type="number" value={form.credit || ""} onChange={handleChange} style={inputStyle} /></div>
              </div>
              <button type="submit" style={{ backgroundColor: "#000", color: "#fff", padding: "16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}>Save Entry</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}