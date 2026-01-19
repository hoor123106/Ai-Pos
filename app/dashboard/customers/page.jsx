"use client";

import { useState, useEffect, useMemo } from "react";
import Dexie from "dexie";

export default function Customers() {
  // --- DATABASE LOGIC START ---
  const db = useMemo(() => {
    let userEmail = "Guest";
    if (typeof window !== "undefined") {
      userEmail = localStorage.getItem("userEmail") || "Guest";
    }
    const dexieDb = new Dexie(`CustomerDB_${userEmail}`);
    // Schema version update for consistency
    dexieDb.version(2).stores({
      customer_records: "++id, item_code, date, customer_name, account_name, currency, description, memo"
    });
    return dexieDb;
  }, []);
  // --- DATABASE LOGIC END ---

  const [showForm, setShowForm] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [modalFilterDate, setModalFilterDate] = useState("");
  const [exchangeRates, setExchangeRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });
  const [formCurrency, setFormCurrency] = useState("USD");

  const initialFormState = {
    item_code: "",
    date: new Date().toISOString().split("T")[0],
    customer_name: "",
    account_name: "CASH IN HAND",
    description: "", 
    qty: 0,
    debit: 0,
    credit: 0,
    balance: 0,
    memo: "",
  };

  const [form, setForm] = useState(initialFormState);
  const currencySymbols = { USD: "$", PKR: "Rs", AED: "Dh" };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await db.customer_records.toArray();
      // Sort by date descending for the main list
      setRows(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [db]);

  // Grouping Logic: Same name entries ko merge karna
  const getGroupedSummary = () => {
    const summaryMap = {};
    rows.forEach(row => {
      const name = row.customer_name || "Unknown";
      if (!summaryMap[name]) {
        const customerHistory = rows.filter(r => r.customer_name === name);
        const totalD = customerHistory.reduce((s, r) => s + (Number(r.debit) || 0), 0);
        const totalC = customerHistory.reduce((s, r) => s + (Number(r.credit) || 0), 0);
        summaryMap[name] = { 
          ...row, 
          customerTotalBalance: totalD - totalC 
        };
      }
    });
    return Object.values(summaryMap);
  };

  const summaryRows = getGroupedSummary();
  const totalDebitAll = rows.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
  const totalCreditAll = rows.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0);
  const netBalanceAll = totalDebitAll - totalCreditAll;

  const handleCustomerClick = (custName) => {
    let history = rows.filter(r => r.customer_name === custName);
    history = history.sort((a, b) => new Date(a.date) - new Date(b.date));
    const totalDebit = history.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const totalCredit = history.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    const netBalance = totalDebit - totalCredit;
    setModalFilterDate(""); 
    setSelectedGroupData({
      name: custName || "N/A",
      history,
      netBalance: netBalance,
      currency: history[0]?.currency || "USD"
    });
  };

  const formatValue = (val, rowCurrency) => {
    const symbol = currencySymbols[rowCurrency || "USD"] || "";
    const color = Number(val) < 0 ? "#e03131" : "#0ca678";
    return {
      text: `${symbol} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      color: color
    };
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => {
      const updatedValue = type === "number" ? (value === "" ? 0 : parseFloat(value)) : value;
      const updated = { ...prev, [name]: updatedValue };
      if (name === "debit" || name === "credit") {
        const d = name === "debit" ? (parseFloat(value) || 0) : (prev.debit || 0);
        const c = name === "credit" ? (parseFloat(value) || 0) : (prev.credit || 0);
        updated.balance = Number((d - c).toFixed(2));
      }
      return updated;
    });
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({ ...row });
    setFormCurrency(row.currency || "USD");
    setShowForm(true);
    if (selectedGroupData) setSelectedGroupData(null);
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
      debit: Number(((prev.debit || 0) * factor).toFixed(2)),
      credit: Number(((prev.credit || 0) * factor).toFixed(2)),
      balance: Number(((prev.balance || 0) * factor).toFixed(2)),
    }));
    setFormCurrency(newCurr);
  };

  const handleManualRateChange = (currency, newRate) => {
    setExchangeRates(prev => ({ ...prev, [currency]: parseFloat(newRate) || 0 }));
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    const entryData = { ...form, currency: formCurrency, updated_at: new Date().toISOString() };
    if (editingId) {
      await db.customer_records.update(editingId, entryData);
    } else {
      await db.customer_records.add({ ...entryData, created_at: new Date().toISOString() });
    }
    closeForm();
    fetchCustomers();
  };

  const deleteCustomer = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    await db.customer_records.delete(id);
    fetchCustomers();
    if (selectedGroupData) setSelectedGroupData(null);
  };

  const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", marginTop: "5px", boxSizing: "border-box" };
  const labelStyle = { fontSize: "13px", fontWeight: "bold", display: "block", marginTop: "15px" };

  let ledgerRunningBalance = 0;

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Customer Ledger Summary</h1>
        <button onClick={() => { setEditingId(null); setForm(initialFormState); setShowForm(true); }} style={{ backgroundColor: "#000", color: "#fff", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500" }}>
          + Add Customer Entry
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>TOTAL DEBIT</span>
          <h2 style={{ color: "#0ca678", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(totalDebitAll, "USD").text}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>TOTAL CREDIT</span>
          <h2 style={{ color: "#e03131", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(totalCreditAll, "USD").text}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "2px solid #000" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>NET BALANCE</span>
          <h2 style={{ color: "#000", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(netBalanceAll, "USD").text}</h2>
        </div>
      </div>

      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
          <thead style={{ backgroundColor: "#fafafa" }}>
            <tr style={{ fontSize: "12px", color: "#6b7280" }}>
              <th style={{ padding: "15px" }}>ITEM CODE</th>
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
            {summaryRows.length > 0 ? summaryRows.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                <td style={{ padding: "15px", fontWeight: "bold", color: "#6b7280" }}>{row.item_code || "—"}</td>
                <td onClick={() => handleCustomerClick(row.customer_name)} style={{ padding: "15px", fontWeight: "bold", color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}>{row.customer_name}</td>
                <td style={{ padding: "15px" }}>{row.account_name}</td>
                <td style={{ padding: "15px" }}>{row.date}</td>
                <td style={{ padding: "15px" }}>{row.description}</td>
                <td style={{ padding: "15px" }}>{row.qty}</td>
                <td style={{ padding: "15px", color: "#0ca678", fontWeight: "bold" }}>{formatValue(row.debit, row.currency).text}</td>
                <td style={{ padding: "15px", color: "#e03131", fontWeight: "bold" }}>{formatValue(row.credit, row.currency).text}</td>
                <td style={{ padding: "15px", fontWeight: "bold" }}>{formatValue(row.customerTotalBalance, row.currency).text}</td>
                <td style={{ padding: "15px", display: "flex", gap: "10px", justifyContent: "center" }}>
                  <button onClick={() => handleEdit(row)} style={{ color: "#2563eb", border: "none", background: "none", cursor: "pointer" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="10" style={{ padding: "30px", textAlign: "center", color: "#9ca3af" }}>Koi record nahi mila.</td></tr>
            )}
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
              
              <label style={labelStyle}>Item Code</label>
              <input name="item_code" value={form.item_code} onChange={handleChange} style={inputStyle} />

              <label style={labelStyle}>Customer Name</label>
              <input name="customer_name" value={form.customer_name} onChange={handleChange} style={inputStyle} required />
              
              <label style={labelStyle}>Account Name</label>
              <select name="account_name" value={form.account_name} onChange={handleChange} style={inputStyle}>
                <option value="CASH IN HAND">CASH IN HAND</option>
                <option value="DASTI">DASTI</option>
                <option value="MEEZAN BANK">MEEZAN BANK</option>
                <option value="DEBIT">DEBIT</option>
                <option value="CREDIT">CREDIT</option>
              </select>

              <label style={labelStyle}>Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} style={inputStyle} />
              
              <label style={labelStyle}>Item Name</label>
              <textarea name="description" value={form.description} onChange={handleChange} style={{ ...inputStyle, height: "60px" }} />
              
              <label style={labelStyle}>Memo</label>
              <textarea name="memo" value={form.memo} onChange={handleChange} style={{ ...inputStyle, height: "60px", resize: "none" }} placeholder="Enter additional details..." />
              
              <label style={labelStyle}>Qty</label>
              <input name="qty" type="number" value={form.qty || ""} onChange={handleChange} style={inputStyle} />
              
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Debit</label><input name="debit" type="number" value={form.debit || ""} onChange={handleChange} style={inputStyle} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Credit</label><input name="credit" type="number" value={form.credit || ""} onChange={handleChange} style={inputStyle} /></div>
              </div>

              <label style={{ ...labelStyle, color: "#2563eb" }}>Entry Balance</label>
              <input value={formatValue(form.balance, formCurrency).text} style={{ ...inputStyle, backgroundColor: "#f0f7ff", fontWeight: "bold" }} disabled />
              
              <button type="submit" style={{ width: "100%", backgroundColor: editingId ? "#2563eb" : "#000", color: "#fff", padding: "15px", borderRadius: "8px", marginTop: "25px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                {editingId ? "Update Customer" : "Save Customer"}
              </button>
            </form>
          </div>
        </>
      )}

      {selectedGroupData && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
          <div style={{ backgroundColor: "#fff", width: "1000px", maxHeight: "92vh", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            <div style={{ backgroundColor: "#1e3a8a", color: "#fff", padding: "24px 30px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px" }}>Individual Customer Ledger</h2>
                <p style={{ margin: "4px 0 0", opacity: 0.9 }}>Customer: {selectedGroupData.name}</p>
              </div>
              
              {/* Date Filter (Calendar) added like in Vendors */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#000', padding: '8px 15px', borderRadius: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: "#fff" }}>FILTER DATE:</label>
                <input 
                  type="date" 
                  value={modalFilterDate}
                  onChange={(e) => setModalFilterDate(e.target.value)}
                  style={{ padding: '6px', borderRadius: '6px', border: 'none', outline: 'none', cursor: 'pointer', fontSize: "13px", background: "#fff", color: "#000" }}
                />
                {modalFilterDate && (
                  <button onClick={() => setModalFilterDate("")} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: "bold" }}>Clear</button>
                )}
              </div>
            </div>

            <div style={{ padding: "30px", overflowY: "auto", flex: 1 }}>
                <div style={{ display: 'none' }}>{ledgerRunningBalance = 0}</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "2px solid #f3f4f6" }}>
                      <th style={{ padding: "12px 10px", fontSize: "13px", color: "#4b5563" }}>Code</th>
                      <th style={{ padding: "12px 10px", fontSize: "13px", color: "#4b5563" }}>Date</th>
                      <th style={{ padding: "12px 10px", fontSize: "13px", color: "#4b5563" }}>Account</th>
                      <th style={{ padding: "12px 10px", fontSize: "13px", color: "#4b5563" }}>Memo</th>
                      <th style={{ padding: "12px 10px", fontSize: "13px", color: "#4b5563" }}>Debit</th>
                      <th style={{ padding: "12px 10px", fontSize: "13px", color: "#4b5563" }}>Credit</th>
                      <th style={{ padding: "12px 10px", fontSize: "13px", color: "#4b5563" }}>Balance</th>
                      <th style={{ padding: "12px 10px", fontSize: "13px", color: "#4b5563", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroupData.history
                      .filter(item => modalFilterDate ? item.date === modalFilterDate : true)
                      .map(item => {
                        ledgerRunningBalance += (Number(item.debit) || 0) - (Number(item.credit) || 0);
                        const deb = formatValue(item.debit, item.currency);
                        const cre = formatValue(item.credit, item.currency);
                        const bal = formatValue(ledgerRunningBalance, item.currency);
                        return (
                          <tr key={item.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                            <td style={{ padding: "14px 10px", fontWeight: "bold" }}>{item.item_code || "—"}</td>
                            <td style={{ padding: "14px 10px" }}>{item.date}</td>
                            <td style={{ padding: "14px 10px" }}>{item.account_name}</td>
                            <td style={{ padding: "14px 10px", color: "#6b7280" }}>{item.memo || "—"}</td>
                            <td style={{ padding: "14px 10px", fontWeight: "500", color: deb.color }}>{deb.text}</td>
                            <td style={{ padding: "14px 10px", fontWeight: "500", color: cre.color }}>{cre.text}</td>
                            <td style={{ padding: "14px 10px", fontWeight: "600", color: bal.color }}>{bal.text}</td>
                            <td style={{ padding: "14px 10px", display: "flex", gap: "15px", justifyContent: "center" }}>
                              <button onClick={() => handleEdit(item)} style={{ color: "#3b82f6", border: "none", background: "none", cursor: "pointer" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </button>
                              <button onClick={() => deleteCustomer(item.id)} style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                <div style={{ background: "#f8f9fa", padding: "18px 25px", marginTop: "25px", borderRadius: "12px", border: "1px solid #edf2f7", textAlign: 'right' }}>
                    <span style={{ fontSize: "14px", color: "#64748b", marginRight: "10px" }}>Net Total for {selectedGroupData.name}:</span>
                    <span style={{ fontSize: "18px", color: "#1e3a8a", fontWeight: "bold" }}>{formatValue(selectedGroupData.netBalance, selectedGroupData.currency).text}</span>
                </div>
                <button onClick={() => setSelectedGroupData(null)} style={{ width: "100%", padding: "14px", backgroundColor: "#1e3a8a", color: "#fff", border: "none", borderRadius: "12px", marginTop: "25px", cursor: "pointer", fontWeight: 'bold' }}>Close Ledger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}