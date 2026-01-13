"use client";

import { useState, useEffect } from "react";
import Dexie from "dexie";

const db = new Dexie("CustomerDB");
db.version(3).stores({
  customer_records: "++id, date, customer_name, account_name, currency, description"
});

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [exchangeRates, setExchangeRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });
  const [formCurrency, setFormCurrency] = useState("USD");

  const initialFormState = {
    date: new Date().toISOString().split("T")[0],
    customer_name: "",
    account_name: "CASH IN HAND", // Default value
    description: "",
    qty: 0,
    debit: 0,
    credit: 0,
    balance: 0,
  };

  const [form, setForm] = useState(initialFormState);
  const currencySymbols = { USD: "$", PKR: "Rs", AED: "Dh" };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await db.customer_records.toArray();
      setRows(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const getGroupedSummary = () => {
    const summaryMap = {};
    rows.forEach(row => {
      const name = row.customer_name || "Unknown";
      if (!summaryMap[name]) {
        summaryMap[name] = { ...row };
      }
    });
    return Object.values(summaryMap);
  };

  const summaryRows = getGroupedSummary();
  const uniqueAccountNames = Array.from(new Set(rows.map(r => r.account_name).filter(Boolean)));

  const totalDebitAll = rows.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
  const totalCreditAll = rows.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0);
  const netBalanceAll = totalDebitAll - totalCreditAll;

  const handleCustomerClick = (custName) => {
    let history = rows.filter(r => r.customer_name === custName);
    history = history.sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalDebit = history.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const totalCredit = history.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    const netBalance = totalDebit - totalCredit;

    setSelectedGroupData({
      name: custName || "N/A",
      history,
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
    setEditingId(row.id);
    setForm({ ...row });
    setFormCurrency(row.currency || "USD");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialFormState);
    setFormCurrency("USD");
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
    const entryData = {
      ...form,
      currency: formCurrency,
      updated_at: new Date().toISOString()
    };

    if (editingId) {
      await db.customer_records.update(editingId, entryData);
    } else {
      await db.customer_records.add({ ...entryData, created_at: new Date().toISOString() });
    }

    closeForm();
    fetchCustomers();
  };

  const deleteCustomer = async (id) => {
    if (!confirm("Are you sure?")) return;
    await db.customer_records.delete(id);
    fetchCustomers();
  };

  const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", marginTop: "5px", boxSizing: "border-box" };
  const labelStyle = { fontSize: "13px", fontWeight: "bold", display: "block", marginTop: "15px" };

  let ledgerRunningBalance = 0;

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Customer Ledger Summary</h1>
        <button onClick={() => setShowForm(true)} style={{ backgroundColor: "#000", color: "#fff", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500" }}>
          + Add Entry
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>OVERALL DEBIT</span>
          <h2 style={{ color: "#0ca678", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(totalDebitAll, "USD")}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>OVERALL CREDIT</span>
          <h2 style={{ color: "#e03131", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(totalCreditAll, "USD")}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "2px solid #000" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>NET PORTFOLIO BALANCE</span>
          <h2 style={{ color: "#000", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(netBalanceAll, "USD")}</h2>
        </div>
      </div>

      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
          <thead style={{ backgroundColor: "#fafafa" }}>
            <tr style={{ fontSize: "12px", color: "#6b7280" }}>
              <th style={{ padding: "15px" }}>CUSTOMER NAME</th>
              <th style={{ padding: "15px" }}>ACCOUNT NAME</th>
              <th style={{ padding: "15px" }}>DATE</th>
              <th style={{ padding: "15px" }}>ITEM</th>
              <th style={{ padding: "15px" }}>QTY</th>
              <th style={{ padding: "15px" }}>DEBIT</th>
              <th style={{ padding: "15px" }}>CREDIT</th>
              <th style={{ padding: "15px" }}>BALANCE</th>
              <th style={{ padding: "15px" }}>ACTION</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: "14px" }}>
            {summaryRows.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                <td 
                  onClick={() => handleCustomerClick(row.customer_name)}
                  style={{ padding: "15px", fontWeight: "bold", color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
                >
                  {row.customer_name || "—"}
                </td>
                <td style={{ padding: "15px" }}>{row.account_name || "—"}</td>
                <td style={{ padding: "15px" }}>{row.date || "—"}</td>
                <td style={{ padding: "15px" }}>{row.description || "—"}</td>
                <td style={{ padding: "15px" }}>{row.qty || "0"}</td>
                <td style={{ padding: "15px", color: "#0ca678", fontWeight: "bold" }}>{formatValue(row.debit, row.currency)}</td>
                <td style={{ padding: "15px", color: "#e03131", fontWeight: "bold" }}>{formatValue(row.credit, row.currency)}</td>
                <td style={{ padding: "15px", fontWeight: "bold" }}>{formatValue(row.balance, row.currency)}</td>
                <td style={{ padding: "15px", display: "flex", gap: "10px", justifyContent: "center", alignItems: "center" }}>
                  <button onClick={() => handleEdit(row)} title="Edit Latest Entry" style={{ color: "#2563eb", border: "none", background: "none", cursor: "pointer" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button onClick={() => deleteCustomer(row.id)} title="Delete Entry" style={{ color: "#ff4d4f", border: "none", background: "none", cursor: "pointer" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <>
          <div onClick={closeForm} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.2)", zIndex: 998 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: "400px", height: "100%", backgroundColor: "#fff", zIndex: 999, padding: "30px", overflowY: "auto", boxShadow: "-5px 0 20px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>{editingId ? "Edit Entry" : "Add New Entry"}</h2>
                <button onClick={closeForm} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={saveCustomer}>
              <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #eee", marginBottom: "20px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Currency & Exchange</label>
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

              <label style={labelStyle}>Customer Name</label>
              <input name="customer_name" value={form.customer_name} onChange={handleChange} style={inputStyle} required />

              {/* --- DROPDOWN ADDED HERE --- */}
              <label style={labelStyle}>Account Name</label>
              <select 
                name="account_name" 
                value={form.account_name} 
                onChange={handleChange} 
                style={inputStyle}
              >
                <option value="CASH IN HAND">CASH IN HAND</option>
                <option value="DASTI">DASTI</option>
                <option value="MEEZAN BANK">MEEZAN BANK</option>
                <option value="DEBIT">DEBIT</option>
                <option value="CREDIT">CREDIT</option>
              </select>

              <label style={labelStyle}>Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} style={inputStyle} />
              
              <label style={labelStyle}>Item Name / Memo</label>
              <textarea name="description" value={form.description} onChange={handleChange} style={{ ...inputStyle, height: "60px" }} />
              
              <label style={labelStyle}>Qty</label>
              <input name="qty" type="number" value={form.qty === 0 ? "" : form.qty} onChange={handleChange} style={inputStyle} />
              
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Debit</label><input name="debit" type="number" value={form.debit === 0 ? "" : form.debit} onChange={handleChange} style={inputStyle} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Credit</label><input name="credit" type="number" value={form.credit === 0 ? "" : form.credit} onChange={handleChange} style={inputStyle} /></div>
              </div>

              <label style={{ ...labelStyle, color: "#2563eb" }}>Entry Balance</label>
              <input value={formatValue(form.balance, formCurrency)} style={{ ...inputStyle, backgroundColor: "#f0f7ff", fontWeight: "bold" }} disabled />

              <button type="submit" style={{ width: "100%", backgroundColor: editingId ? "#2563eb" : "#000", color: "#fff", padding: "15px", borderRadius: "8px", marginTop: "25px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                {editingId ? "Update Entry" : "Save Entry"}
              </button>
            </form>
          </div>
        </>
      )}

      {selectedGroupData && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
          <div style={{ backgroundColor: "#fff", width: "950px", maxHeight: "90vh", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ backgroundColor: "#1a5f7a", color: "#fff", padding: "25px" }}>
              <h2 style={{ margin: 0 }}>Individual Customer Ledger</h2>
              <p style={{ margin: "5px 0 0" }}>Banda: {selectedGroupData.name}</p>
            </div>
            <div style={{ padding: "30px", overflowY: "auto" }}>
                <div style={{ display: 'none' }}>{ledgerRunningBalance = 0}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ textAlign: "left", background: "#f8f9fa" }}>
                      <th style={{ padding: "10px" }}>Date</th>
                      <th style={{ padding: "10px" }}>Account</th>
                      <th style={{ padding: "10px" }}>Item Name / Memo</th>
                      <th style={{ padding: "10px" }}>Debit</th>
                      <th style={{ padding: "10px" }}>Credit</th>
                      <th style={{ padding: "10px" }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroupData.history.map(item => {
                      ledgerRunningBalance += (Number(item.debit) || 0) - (Number(item.credit) || 0);
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "10px" }}>{item.date}</td>
                          <td style={{ padding: "10px" }}>{item.account_name}</td>
                          <td style={{ padding: "10px" }}>{item.description}</td>
                          <td style={{ padding: "10px", color: "#0ca678" }}>{formatValue(item.debit, item.currency)}</td>
                          <td style={{ padding: "10px", color: "#e03131" }}>{formatValue(item.credit, item.currency)}</td>
                          <td style={{ padding: "10px", fontWeight: "bold" }}>{formatValue(ledgerRunningBalance, item.currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ background: "#f8f9fa", padding: "15px", marginTop: "20px", borderRadius: "8px", border: "1px solid #eee", textAlign: 'right' }}>
                    <span style={{ fontSize: "14px", color: "#6b7280", marginRight: "8px" }}>Net Total for {selectedGroupData.name}:</span>
                    <span style={{ fontSize: "16px", color: "#1a5f7a", fontWeight: "bold" }}>{formatValue(selectedGroupData.netBalance, selectedGroupData.currency)}</span>
                </div>
                <button onClick={() => setSelectedGroupData(null)} style={{ width: "100%", padding: "12px", backgroundColor: "#1a5f7a", color: "#fff", border: "none", borderRadius: "8px", marginTop: "20px", cursor: "pointer", fontWeight: 'bold' }}>Close Ledger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}