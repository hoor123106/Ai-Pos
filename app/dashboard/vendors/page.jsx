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
      // Base data ko date wise sort karein
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

  // Unique Account Names for datalist
  const uniqueAccountNames = Array.from(new Set(rows.map(r => r.account_name).filter(Boolean)));

  // Auto Balance Calculation for Main Table (Newest on Top)
  let runningBalanceMain = 0;
  const rowsWithAutoBalance = [...rows].map((row) => {
    runningBalanceMain += (Number(row.debit) || 0) - (Number(row.credit) || 0);
    return { ...row, autoBalance: runningBalanceMain };
  }).reverse();

  // Updated Ledger Click Logic (Reference vs Name)
  const handleVendorClick = (refNo, vendorName) => {
    let history = [];
    
    if (refNo && refNo !== "—" && refNo !== "" && refNo !== "N/A") {
        // Agar Reference No hai
        history = rows.filter(r => r.reference === refNo);
    } else {
        // Agar Reference No nahi hai, to vendor ke naam par filter karein
        history = rows.filter(r => r.vendor_name === vendorName && (!r.reference || r.reference === "—" || r.reference === "" || r.reference === "N/A"));
    }

    history = history.sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalDebit = history.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const totalCredit = history.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    const netBalance = totalDebit - totalCredit;

    setSelectedGroupData({
      reference: (refNo && refNo !== "—" && refNo !== "N/A") ? refNo : "No Reference No.",
      name: vendorName || "N/A",
      history,
      netBalance: netBalance,
      currency: history[0]?.currency || "USD"
    });
  };

  const formatValue = (val, rowCurrency) => {
    const symbol = currencySymbols[rowCurrency || "USD"] || "";
    return `${symbol} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
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
      debit: Number(((prev.debit || 0) * factor).toFixed(2)),
      credit: Number(((prev.credit || 0) * factor).toFixed(2)),
      balance: Number(((prev.balance || 0) * factor).toFixed(2)),
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
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>TOTAL DEBIT (BUY)</span>
          <h2 style={{ color: "#e03131", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(totalDebitAll, "USD")}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>TOTAL CREDIT (RET)</span>
          <h2 style={{ color: "#0ca678", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(totalCreditAll, "USD")}</h2>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "2px solid #000" }}>
          <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>NET BALANCE</span>
          <h2 style={{ color: "#000", margin: "10px 0 0", fontSize: "24px" }}>{formatValue(netBalanceAll, "USD")}</h2>
        </div>
      </div>

      {/* Table */}
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
              <th style={{ padding: "15px" }}>DEBIT</th>
              <th style={{ padding: "15px" }}>CREDIT</th>
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
                <td style={{ padding: "15px", fontWeight: "bold" }}>{formatValue(row.autoBalance, row.currency)}</td>
                <td style={{ padding: "15px", display: "flex", gap: "10px", justifyContent: "center", alignItems: "center" }}>
                  <button onClick={() => handleEdit(row)} style={{ color: "#2563eb", border: "none", background: "none", cursor: "pointer" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button onClick={() => deleteVendor(row.id)} style={{ color: "#ff4d4f", border: "none", background: "none", cursor: "pointer" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Sidebar */}
      {showForm && (
        <>
          <div onClick={closeForm} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.2)", zIndex: 998 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: "400px", height: "100%", backgroundColor: "#fff", zIndex: 999, padding: "30px", overflowY: "auto", boxShadow: "-5px 0 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginBottom: "20px" }}>{isEditing ? "Edit Vendor Record" : "New Vendor Record"}</h2>
            <form onSubmit={saveVendor}>
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

              <label style={labelStyle}>Account Name</label>
              <input name="account_name" value={form.account_name} onChange={handleChange} style={inputStyle} list="vendor-acc-list" />
              <datalist id="vendor-acc-list">
                  <option value="Accounts Payable" />
                  {uniqueAccountNames.map((n, i) => <option key={i} value={n} />)}
              </datalist>

              <label style={labelStyle}>Vendor Name</label>
              <input name="vendor_name" value={form.vendor_name} onChange={handleChange} style={inputStyle} required />

              <label style={labelStyle}>Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} style={inputStyle} />
              
              <label style={labelStyle}>Item Name</label>
              <input name="item_name" value={form.item_name} onChange={handleChange} style={inputStyle} />
              
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Ref No.</label><input name="reference" value={form.reference} onChange={handleChange} style={inputStyle} placeholder="Optional" /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Qty</label><input name="qty" type="number" value={form.qty || ""} onChange={handleChange} style={inputStyle} /></div>
              </div>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Debit (Buy)</label><input name="debit" type="number" value={form.debit || ""} onChange={handleChange} style={inputStyle} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Credit (Ret)</label><input name="credit" type="number" value={form.credit || ""} onChange={handleChange} style={inputStyle} /></div>
              </div>

              <label style={{ ...labelStyle, color: "#2563eb" }}>Net Balance (This Entry)</label>
              <input value={formatValue(form.balance, formCurrency)} style={{ ...inputStyle, backgroundColor: "#f0f7ff", fontWeight: "bold" }} disabled />

              <button type="submit" style={{ width: "100%", backgroundColor: isEditing ? "#2563eb" : "#000", color: "#fff", padding: "15px", borderRadius: "8px", marginTop: "25px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                {isEditing ? "Update Entry" : "Save Entry"}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Ledger Report Modal */}
      {selectedGroupData && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
          <div style={{ backgroundColor: "#fff", width: "950px", maxHeight: "90vh", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ backgroundColor: "#1a5f7a", color: "#fff", padding: "25px" }}>
              <h2 style={{ margin: 0 }}>Vendor Ledger: {selectedGroupData.reference}</h2>
              <p style={{ margin: "5px 0 0" }}>Vendor: {selectedGroupData.name}</p>
            </div>
            <div style={{ padding: "30px", overflowY: "auto" }}>
                <div style={{ display: 'none' }}>{modalRunningBal = 0}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ textAlign: "left", background: "#f8f9fa" }}>
                      <th style={{ padding: "10px" }}>Date</th>
                      <th style={{ padding: "10px" }}>Account</th>
                      <th style={{ padding: "10px" }}>Item Name</th>
                      <th style={{ padding: "10px" }}>Qty</th>
                      <th style={{ padding: "10px" }}>Debit</th>
                      <th style={{ padding: "10px" }}>Credit</th>
                      <th style={{ padding: "10px" }}>Running Bal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroupData.history.map(item => {
                      modalRunningBal += (Number(item.debit) || 0) - (Number(item.credit) || 0);
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "10px" }}>{item.date}</td>
                          <td style={{ padding: "10px" }}>{item.account_name}</td>
                          <td style={{ padding: "10px" }}>{item.item_name}</td>
                          <td style={{ padding: "10px" }}>{item.qty || "0"}</td>
                          <td style={{ padding: "10px", color: "#e03131" }}>{formatValue(item.debit, item.currency)}</td>
                          <td style={{ padding: "10px", color: "#0ca678" }}>{formatValue(item.credit, item.currency)}</td>
                          <td style={{ padding: "10px", fontWeight: "bold" }}>{formatValue(modalRunningBal, item.currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Total Net Balance Card */}
                <div style={{ background: "#f8f9fa", padding: "15px", marginTop: "20px", borderRadius: "8px", border: "1px solid #eee", textAlign: 'right' }}>
                    <span style={{ fontSize: "14px", color: "#6b7280", marginRight: "8px" }}>total net balance:</span>
                    <span style={{ fontSize: "16px", color: "#1a5f7a", fontWeight: "bold" }}>
                        {formatValue(selectedGroupData.netBalance, selectedGroupData.currency)}
                    </span>
                </div>

                <button onClick={() => setSelectedGroupData(null)} style={{ width: "100%", padding: "12px", backgroundColor: "#1a5f7a", color: "#fff", border: "none", borderRadius: "8px", marginTop: "20px", cursor: "pointer", fontWeight: 'bold' }}>Close Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}