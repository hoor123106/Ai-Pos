"use client";

import { useState, useEffect } from "react";
import Dexie from "dexie";

const db = new Dexie("CustomerDB");
db.version(1).stores({
  customer_records: "++id, date, account_name, currency, description, reference"
});

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [exchangeRates, setExchangeRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });
  const [formCurrency, setFormCurrency] = useState("USD");

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    account_name: "",
    description: "",
    qty: 0,
    reference: "",
    debit: 0,
    credit: 0,
    balance: 0,
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

  const totalDebitAll = rows.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
  const totalCreditAll = rows.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0);
  const netBalanceAll = totalDebitAll - totalCreditAll;

  const handleCustomerClick = (refNo, fallbackName) => {
    const history = rows.filter(r =>
      refNo ? r.reference === refNo : r.account_name === fallbackName
    );

    const totalDebit = history.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const totalCredit = history.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    const grossProfit = totalDebit - totalCredit;

    setSelectedGroupData({
      reference: refNo || "N/A",
      name: fallbackName,
      history,
      totalDebit,
      totalCredit,
      grossProfit,
      trialBalance: totalDebit === totalCredit ? "Balanced ✅" : "Unbalanced ⚠️",
      netBalance: totalDebit - totalCredit
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
    setForm({ date: new Date().toISOString().split("T")[0], account_name: "", description: "", qty: 0, reference: "", debit: 0, credit: 0, balance: 0 });
    setFormCurrency("USD");
  };

  const deleteCustomer = async (id) => {
    if (!confirm("Are you sure?")) return;
    await db.customer_records.delete(id);
    fetchCustomers();
  };

  const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", marginTop: "5px", boxSizing: "border-box" };
  const labelStyle = { fontSize: "13px", fontWeight: "bold", display: "block", marginTop: "15px" };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Customers</h1>
        <button onClick={() => setShowForm(true)} style={{ backgroundColor: "#000", color: "#fff", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500" }}>
          + Add Customer
        </button>
        <h1>bbb</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>TOTAL DEBIT (RECEIVABLES)</span>
          <h2 style={{ color: "#0ca678", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(totalDebitAll, "USD")}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>TOTAL CREDIT (PAYMENTS)</span>
          <h2 style={{ color: "#e03131", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(totalCreditAll, "USD")}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "2px solid #000" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>TOTAL NET BALANCE</span>
          <h2 style={{ color: "#000", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(netBalanceAll, "USD")}</h2>
        </div>
      </div>

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
                <td
                  onClick={() => handleCustomerClick(row.reference, row.account_name)}
                  style={{ padding: "15px", fontWeight: "bold", color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
                >
                  {row.account_name || "—"}
                </td>
                <td style={{ padding: "15px" }}>{row.description || "—"}</td>
                <td style={{ padding: "15px" }}>{row.qty || 0}</td>
                <td style={{ padding: "15px" }}>{row.reference || "—"}</td>
                <td style={{ padding: "15px", color: "#0ca678", fontWeight: "bold" }}>{formatValue(row.debit, row.currency)}</td>
                <td style={{ padding: "15px", color: "#e03131", fontWeight: "bold" }}>{formatValue(row.credit, row.currency)}</td>
                <td style={{ padding: "15px", fontWeight: "bold" }}>{formatValue(row.balance, row.currency)}</td>
                <td style={{ padding: "15px" }}>
                  <button onClick={() => deleteCustomer(row.id)} style={{ color: "#ff4d4f", border: "none", background: "none", cursor: "pointer" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedGroupData && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
          <div style={{ backgroundColor: "#fff", width: "700px", maxHeight: "90vh", borderRadius: "16px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }}>
            <div style={{ backgroundColor: "#1a5f7a", color: "#fff", padding: "25px", position: "relative" }}>
              <h2 style={{ margin: 0, fontSize: "22px" }}>REFERENCE REPORT: {selectedGroupData.reference}</h2>
              <p style={{ margin: "5px 0 0", opacity: 0.8 }}>Showing all entries linked to this Reference No.</p>
              <button onClick={() => setSelectedGroupData(null)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer" }}>&times;</button>
            </div>
            <div style={{ padding: "30px", overflowY: "auto" }}>
              <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
                <div style={{ flex: 1, background: "#f0fdf4", padding: "15px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <small style={{ color: "#166534", fontWeight: "bold" }}>TOTAL DEBIT</small>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>{formatValue(selectedGroupData.totalDebit)}</div>
                </div>
                <div style={{ flex: 1, background: "#fef2f2", padding: "15px", borderRadius: "10px", border: "1px solid #fecaca" }}>
                  <small style={{ color: "#991b1b", fontWeight: "bold" }}>TOTAL CREDIT</small>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>{formatValue(selectedGroupData.totalCredit)}</div>
                </div>
              </div>
              <h4 style={{ borderBottom: "2px solid #1a5f7a", paddingBottom: "8px", color: "#1a5f7a", marginBottom: "15px" }}>Ref Group Breakdown</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "25px" }}>
                <thead>
                  <tr style={{ textAlign: "left", background: "#f8f9fa" }}>
                    <th style={{ padding: "10px" }}>Date</th>
                    <th style={{ padding: "10px" }}>Account</th>
                    <th style={{ padding: "10px" }}>Debit</th>
                    <th style={{ padding: "10px" }}>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroupData.history.map(item => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "10px" }}>{item.date}</td>
                      <td style={{ padding: "10px" }}>{item.account_name}</td>
                      <td style={{ padding: "10px" }}>{formatValue(item.debit, item.currency)}</td>
                      <td style={{ padding: "10px" }}>{formatValue(item.credit, item.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>Gross Total:</span><span style={{ fontWeight: "bold", color: selectedGroupData.grossProfit >= 0 ? "green" : "red" }}>{formatValue(selectedGroupData.grossProfit)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>Trial Balance:</span><span style={{ fontWeight: "bold" }}>{selectedGroupData.trialBalance}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Net Balance:</span><span style={{ fontWeight: "bold" }}>{formatValue(selectedGroupData.netBalance)}</span></div>
              </div>
              <button onClick={() => setSelectedGroupData(null)} style={{ width: "100%", padding: "14px", backgroundColor: "#1a5f7a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginTop: "20px" }}>Close Report</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.2)", zIndex: 998 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: "400px", height: "100%", backgroundColor: "#fff", zIndex: 999, padding: "30px", overflowY: "auto", boxShadow: "-5px 0 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginBottom: "20px" }}>Add Entry</h2>
            <form onSubmit={saveCustomer}>
              <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #eee", marginBottom: "15px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Currency & Rates</label>
                <select value={formCurrency} onChange={(e) => handleCurrencyChange(e.target.value)} style={inputStyle}>
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="AED">AED (Dh)</option>
                </select>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: "10px" }}>PKR Rate</label><input type="number" value={exchangeRates.PKR} onChange={(e) => handleManualRateChange("PKR", e.target.value)} style={{ width: "100%", padding: "5px" }} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: "10px" }}>AED Rate</label><input type="number" value={exchangeRates.AED} onChange={(e) => handleManualRateChange("AED", e.target.value)} style={{ width: "100%", padding: "5px" }} /></div>
                </div>
              </div>
              <label style={labelStyle}>Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} style={inputStyle} />
              <label style={labelStyle}>Customer Name</label>
              <input name="account_name" value={form.account_name} onChange={handleChange} style={inputStyle} required />
              <label style={labelStyle}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} style={{ ...inputStyle, height: "60px" }} />
              <label style={labelStyle}>Reference No.</label>
              <input name="reference" value={form.reference} onChange={handleChange} style={inputStyle} placeholder="Invoice #" />
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Debit</label><input name="debit" type="number" value={form.debit || ""} onChange={handleChange} style={inputStyle} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Credit</label><input name="credit" type="number" value={form.credit || ""} onChange={handleChange} style={inputStyle} /></div>
              </div>
              <button type="submit" style={{ width: "100%", backgroundColor: "#000", color: "#fff", padding: "15px", borderRadius: "8px", marginTop: "25px", border: "none", cursor: "pointer", fontWeight: "bold" }}>Save Record</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}