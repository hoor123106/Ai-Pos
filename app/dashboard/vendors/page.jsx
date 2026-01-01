"use client";

import { useState, useEffect } from "react";
import Dexie from "dexie";

// Database Setup
const db = new Dexie("VendorDB");
db.version(4).stores({
  vendor_records: "++id, date, vendor_name, account_name, currency, item_name, reference"
});

export default function Vendors() {
  const [showForm, setShowForm] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Edit States ---
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [exchangeRates, setExchangeRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });
  const [formCurrency, setFormCurrency] = useState("USD");

  const initialFormState = {
    date: new Date().toISOString().split("T")[0],
    vendor_name: "",
    account_name: "",
    item_name: "",
    qty: 0,
    reference: "",
    debit: 0,
    credit: 0,
    balance: 0,
  };

  const [form, setForm] = useState(initialFormState);
  const currencySymbols = { USD: "$", PKR: "Rs", AED: "Dh" };

  // Fetch Data
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await db.vendor_records.toArray();
      setRows(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  // Summary Calculations
  const totalDebitAll = rows.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
  const totalCreditAll = rows.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0);
  const netBalanceAll = totalDebitAll - totalCreditAll;

  // Auto Balance Calculation for Main Table
  let runningBalanceMain = 0;
  const rowsWithAutoBalance = [...rows].map((row) => {
    runningBalanceMain += (Number(row.debit) || 0) - (Number(row.credit) || 0);
    return { ...row, autoBalance: runningBalanceMain };
  }).reverse();

  const handleVendorClick = (refNo, vendorName) => {
    const history = rows
      .filter(r => refNo ? r.reference === refNo : r.vendor_name === vendorName)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalDebit = history.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const totalCredit = history.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    const netBalance = totalDebit - totalCredit;

    setSelectedGroupData({
      reference: refNo || "N/A",
      name: vendorName,
      history,
      totalDebit,
      totalCredit,
      trialBalance: netBalance === 0 ? "Balanced ✅" : "Unbalanced ⚠️",
      netBalance: netBalance,
      currency: history[0]?.currency || "USD"
    });
  };

  const formatValue = (val, rowCurrency) => {
    const symbol = currencySymbols[rowCurrency || "USD"] || "";
    return `${symbol} ${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Input khali ho to 0 save karein, warna number
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

  const handleEdit = (row) => {
    setForm({ ...row });
    setFormCurrency(row.currency || "USD");
    setCurrentId(row.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentId(null);
    setForm(initialFormState);
    setFormCurrency("USD");
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
    const entryData = {
      ...form,
      currency: formCurrency,
      updated_at: new Date().toISOString()
    };

    if (isEditing) {
      await db.vendor_records.update(currentId, entryData);
    } else {
      await db.vendor_records.add({ ...entryData, created_at: new Date().toISOString() });
    }

    closeForm();
    fetchVendors();
  };

  const deleteVendor = async (id) => {
    if (!confirm("Are you sure?")) return;
    await db.vendor_records.delete(id);
    fetchVendors();
  };

  const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", marginTop: "5px", boxSizing: "border-box" };
  const labelStyle = { fontSize: "13px", fontWeight: "bold", display: "block", marginTop: "15px" };

  let modalRunningBal = 0;

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
      
      <div style={{ marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Vendor Ledger</h1>
        <button onClick={() => { setIsEditing(false); setForm(initialFormState); setShowForm(true); }} style={{ backgroundColor: "#000", color: "#fff", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500" }}>
          + Add Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>TOTAL DEBIT (BUYING)</span>
          <h2 style={{ color: "#e03131", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(totalDebitAll, "USD")}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>TOTAL CREDIT (RETURNS)</span>
          <h2 style={{ color: "#0ca678", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(totalCreditAll, "USD")}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "2px solid #000" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>NET BALANCE</span>
          <h2 style={{ color: "#000", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(netBalanceAll, "USD")}</h2>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1200px" }}>
          <thead style={{ backgroundColor: "#fafafa" }}>
            <tr style={{ fontSize: "12px", color: "#6b7280" }}>
              <th style={{ padding: "15px" }}>DATE</th>
              <th style={{ padding: "15px" }}>VENDOR NAME</th>
              <th style={{ padding: "15px" }}>ACCOUNT NAME</th>
              <th style={{ padding: "15px" }}>ITEM NAME</th>
              <th style={{ padding: "15px" }}>QTY</th>
              <th style={{ padding: "15px" }}>REF NO.</th>
              <th style={{ padding: "15px" }}>DEBIT (BUY)</th>
              <th style={{ padding: "15px" }}>CREDIT (RET)</th>
              <th style={{ padding: "15px" }}>BALANCE</th>
              <th style={{ padding: "15px" }}>ACTION</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: "14px" }}>
            {rowsWithAutoBalance.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                <td style={{ padding: "15px" }}>{row.date || "—"}</td>
                <td 
                  onClick={() => handleVendorClick(row.reference, row.vendor_name)} 
                  style={{ padding: "15px", fontWeight: "bold", color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
                >
                  {row.vendor_name || "—"}
                </td>
                <td style={{ padding: "15px" }}>{row.account_name || "—"}</td>
                <td style={{ padding: "15px" }}>{row.item_name || "—"}</td>
                <td style={{ padding: "15px" }}>{row.qty || 0}</td>
                <td style={{ padding: "15px" }}>{row.reference || "—"}</td>
                <td style={{ padding: "15px", color: "#e03131", fontWeight: "bold" }}>{formatValue(row.debit, row.currency)}</td>
                <td style={{ padding: "15px", color: "#0ca678", fontWeight: "bold" }}>{formatValue(row.credit, row.currency)}</td>
                <td style={{ padding: "15px", fontWeight: "bold", background: "#f8f9fa" }}>{formatValue(row.autoBalance, row.currency)}</td>
                <td style={{ padding: "15px", display: "flex", gap: "10px", justifyContent: "center", alignItems: "center" }}>
                  <button onClick={() => handleEdit(row)} style={{ color: "#2563eb", border: "none", background: "none", cursor: "pointer" }} title="Edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button onClick={() => deleteVendor(row.id)} style={{ color: "#ff4d4f", border: "none", background: "none", cursor: "pointer" }} title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sidebar Form */}
      {showForm && (
        <>
          <div onClick={closeForm} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.2)", zIndex: 998 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: "400px", height: "100%", backgroundColor: "#fff", zIndex: 999, padding: "30px", overflowY: "auto", boxShadow: "-5px 0 20px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>{isEditing ? "Edit Vendor Entry" : "Add Vendor Entry"}</h2>
                <button onClick={closeForm} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={saveVendor}>
              <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #eee", marginBottom: "15px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Currency & Rates</label>
                <select value={formCurrency} onChange={(e) => handleCurrencyChange(e.target.value)} style={inputStyle}>
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="AED">AED (Dh)</option>
                </select>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: "10px" }}>PKR Rate</label><input type="number" value={exchangeRates.PKR || ""} onChange={(e) => handleManualRateChange("PKR", e.target.value)} style={{ width: "100%", padding: "5px" }} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: "10px" }}>AED Rate</label><input type="number" value={exchangeRates.AED || ""} onChange={(e) => handleManualRateChange("AED", e.target.value)} style={{ width: "100%", padding: "5px" }} /></div>
                </div>
              </div>

              <label style={labelStyle}>Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} style={inputStyle} />
              
              <label style={labelStyle}>Vendor Name</label>
              <input name="vendor_name" value={form.vendor_name} onChange={handleChange} style={inputStyle} required />

              <label style={labelStyle}>Account Name</label>
              <input name="account_name" value={form.account_name} onChange={handleChange} style={inputStyle} placeholder="Enter account name" />
              
              <label style={labelStyle}>Item Name</label>
              <input name="item_name" value={form.item_name} onChange={handleChange} style={inputStyle} placeholder="What was bought?" />
              
              <label style={labelStyle}>Quantity (QTY)</label>
              {/* Logic: form.qty agar 0 hai to khali rakho placeholder dikhane ke liye */}
              <input name="qty" type="number" value={form.qty || ""} onChange={handleChange} style={inputStyle} placeholder="0" />
              
              <label style={labelStyle}>Reference No. (Invoice #)</label>
              <input name="reference" value={form.reference} onChange={handleChange} style={inputStyle} placeholder="Invoice #" required />

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Debit (Buy)</label>
                  {/* Logic: form.debit agar 0 hai to khali rakho placeholder dikhane ke liye */}
                  <input name="debit" type="number" value={form.debit || ""} onChange={handleChange} style={inputStyle} placeholder="0.00" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Credit (Ret)</label>
                  {/* Logic: form.credit agar 0 hai to khali rakho placeholder dikhane ke liye */}
                  <input name="credit" type="number" value={form.credit || ""} onChange={handleChange} style={inputStyle} placeholder="0.00" />
                </div>
              </div>

              <label style={{ ...labelStyle, color: "#2563eb" }}>Entry Net Balance</label>
              <div style={{ ...inputStyle, background: "#f0f7ff", border: "1px solid #bcd7ff", fontWeight: "bold" }}>
                {formatValue(form.balance, formCurrency)}
              </div>

              <button type="submit" style={{ width: "100%", backgroundColor: isEditing ? "#2563eb" : "#000", color: "#fff", padding: "15px", borderRadius: "8px", marginTop: "25px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                {isEditing ? "Update Record" : "Save Record"}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Selected Group Report Modal */}
      {selectedGroupData && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
          <div style={{ backgroundColor: "#fff", width: "950px", maxHeight: "90vh", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ backgroundColor: "#1a5f7a", color: "#fff", padding: "25px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0 }}>Reference Report: {selectedGroupData.reference}</h2>
                <p style={{ margin: "5px 0 0", opacity: 0.9 }}>Vendor: {selectedGroupData.name}</p>
              </div>
              <button onClick={() => setSelectedGroupData(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer" }}>&times;</button>
            </div>
            <div style={{ padding: "30px", overflowY: "auto" }}>
                <div style={{ display: 'none' }}>{modalRunningBal = 0}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ textAlign: "left", background: "#f8f9fa" }}>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Date</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Account</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Item Name</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Qty</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Debit (Buy)</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Credit (Ret)</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Running Bal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroupData.history.map((h, i) => {
                      modalRunningBal += (Number(h.debit) || 0) - (Number(h.credit) || 0);
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "12px" }}>{h.date}</td>
                          <td style={{ padding: "12px" }}>{h.account_name || "—"}</td>
                          <td style={{ padding: "12px" }}>{h.item_name}</td>
                          <td style={{ padding: "12px" }}>{h.qty}</td>
                          <td style={{ padding: "12px", color: "#e03131", fontWeight: "bold" }}>{formatValue(h.debit, h.currency)}</td>
                          <td style={{ padding: "12px", color: "#0ca678", fontWeight: "bold" }}>{formatValue(h.credit, h.currency)}</td>
                          <td style={{ padding: "12px", fontWeight: "bold" }}>{formatValue(modalRunningBal, h.currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}