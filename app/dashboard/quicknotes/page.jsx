"use client";

import { useState, useEffect } from "react";
import styles from "./QuickNotes.module.css";

export default function QuickNotes() {
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // --- Currency States (Vendors ki tarah) ---
  const [exchangeRates, setExchangeRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });
  const [formCurrency, setFormCurrency] = useState("USD");
  const currencySymbols = { USD: "$", PKR: "Rs", AED: "Dh" };

  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    name: "",
    item_name: "",
    ref_no: "",
    debit: "", 
    credit: "",
    currency: "USD", // default currency
  });

  // --- IndexedDB Logic ---
  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("LedgerDB", 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("transactions")) {
          db.createObjectStore("transactions", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject("IndexedDB error");
    });
  };

  const loadData = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction("transactions", "readonly");
      const store = tx.objectStore("transactions");
      const request = store.getAll();
      request.onsuccess = () => {
        const sortedData = request.result.sort((a, b) => a.id - b.id);
        let runningBal = 0;
        const entriesWithBalance = sortedData.map((item) => {
          runningBal += (Number(item.credit) || 0) - (Number(item.debit) || 0);
          return { ...item, running_balance: runningBal };
        });
        setEntries(entriesWithBalance.reverse());
      };
    } catch (err) { console.error(err); }
  };

  const saveDataToDB = async (newEntry) => {
    try {
      const db = await openDB();
      const tx = db.transaction("transactions", "readwrite");
      const store = tx.objectStore("transactions");
      store.put(newEntry);
      return tx.complete;
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, []);

  // Formatting helper
  const formatValue = (val, rowCurrency) => {
    const symbol = currencySymbols[rowCurrency || "USD"] || "";
    return `${symbol} ${(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const totalDebit = entries.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
  const totalCredit = entries.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0);
  const netBalance = totalCredit - totalDebit;

  // Currency Change Logic
  const handleCurrencyChange = (newCurr) => {
    const factor = exchangeRates[newCurr] / exchangeRates[formCurrency];
    setForm((prev) => ({
      ...prev,
      debit: prev.debit !== "" ? parseFloat((Number(prev.debit) * factor).toFixed(2)) : "",
      credit: prev.credit !== "" ? parseFloat((Number(prev.credit) * factor).toFixed(2)) : "",
      currency: newCurr
    }));
    setFormCurrency(newCurr);
  };

  const handleManualRateChange = (currency, newRate) => {
    setExchangeRates(prev => ({ ...prev, [currency]: parseFloat(newRate) || 0 }));
  };

  const handleNumberChange = (field, value) => {
    if (value === "") {
      setForm({ ...form, [field]: "" });
    } else {
      setForm({ ...form, [field]: value }); // string rakhein taake decimals handling asan ho
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const entryData = {
      ...form,
      id: isEditing ? currentId : Date.now(),
      debit: Number(form.debit) || 0,
      credit: Number(form.credit) || 0,
      currency: formCurrency,
    };

    await saveDataToDB(entryData);
    loadData();
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      entry_date: new Date().toISOString().split("T")[0],
      name: "",
      item_name: "",
      ref_no: "",
      debit: "",
      credit: "",
      currency: "USD",
    });
    setFormCurrency("USD");
    setIsEditing(false);
    setCurrentId(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerBg}></div>
      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800" }}>Financial Ledger</h1>
            <p style={{ opacity: 0.7 }}>Transaction Management System</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className={styles.addBtn}>
            + New Entry
          </button>
        </header>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>TOTAL DEBIT (-)</span>
            <h2 style={{ color: "#ef4444", margin: "10px 0 0" }}>{formatValue(totalDebit, "USD")}</h2>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>TOTAL CREDIT (+)</span>
            <h2 style={{ color: "#10b981", margin: "10px 0 0" }}>{formatValue(totalCredit, "USD")}</h2>
          </div>
          <div className={`${styles.statCard} ${styles.balanceCard} ${netBalance < 0 ? styles.negativeBalance : ""}`}>
            <span className={styles.statLabel}>NET BALANCE</span>
            <h2 style={{ color: "#1f2937", margin: "10px 0 0" }}>{formatValue(netBalance, "USD")}</h2>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "16px", textAlign: "left" }}>Date</th>
                <th style={{ padding: "16px", textAlign: "left" }}>Name</th>
                <th style={{ padding: "16px", textAlign: "left" }}>Item Name</th>
                <th style={{ padding: "16px", textAlign: "right" }}>Debit</th>
                <th style={{ padding: "16px", textAlign: "right" }}>Credit</th>
                <th style={{ padding: "16px", textAlign: "right", color: "#6366f1" }}>Balance</th>
                <th style={{ padding: "16px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((item) => (
                <tr key={item.id} className={styles.tableRow}>
                  <td style={{ padding: "16px" }}>{item.entry_date}</td>
                  <td style={{ padding: "16px", fontWeight: "bold" }}>{item.name}</td>
                  <td style={{ padding: "16px" }}>{item.item_name || "-"}</td>
                  <td style={{ padding: "16px", textAlign: "right", color: "#ef4444" }}>
                    {item.debit > 0 ? formatValue(item.debit, item.currency) : ""}
                  </td>
                  <td style={{ padding: "16px", textAlign: "right", color: "#10b981" }}>
                    {item.credit > 0 ? formatValue(item.credit, item.currency) : ""}
                  </td>
                  <td style={{ padding: "16px", textAlign: "right", fontWeight: "700" }}>
                    {formatValue(item.running_balance, item.currency)}
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setCurrentId(item.id);
                        setForm(item);
                        setFormCurrency(item.currency || "USD");
                        setShowModal(true);
                      }}
                      className={styles.editBtn}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>{isEditing ? "Edit" : "New"} Entry</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSave}>
              {/* Currency Selector (Vendors Style) */}
              <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #eee", marginBottom: "15px" }}>
                <label className={styles.fieldLabel}>Currency & Rates</label>
                <select 
                  className={styles.inputField} 
                  value={formCurrency} 
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="AED">AED (Dh)</option>
                </select>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px" }}>PKR Rate</label>
                    <input type="number" value={exchangeRates.PKR} onChange={(e) => handleManualRateChange("PKR", e.target.value)} style={{ width: "100%", padding: "5px" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px" }}>AED Rate</label>
                    <input type="number" value={exchangeRates.AED} onChange={(e) => handleManualRateChange("AED", e.target.value)} style={{ width: "100%", padding: "5px" }} />
                  </div>
                </div>
              </div>

              <label className={styles.fieldLabel}>Date</label>
              <input type="date" className={styles.inputField} value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} required />

              <label className={styles.fieldLabel}>Name</label>
              <input type="text" className={styles.inputField} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

              <label className={styles.fieldLabel}>Item Name</label>
              <input type="text" className={styles.inputField} value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.fieldLabel}>Debit (Out)</label>
                  <input
                    type="number"
                    step="any"
                    className={styles.inputField}
                    value={form.debit}
                    onChange={(e) => handleNumberChange("debit", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.fieldLabel}>Credit (In)</label>
                  <input
                    type="number"
                    step="any"
                    className={styles.inputField}
                    value={form.credit}
                    onChange={(e) => handleNumberChange("credit", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className={styles.previewBox} style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f0f7ff", borderRadius: "8px" }}>
                Current Entry Balance:{" "}
                <span style={{ fontWeight: "bold", color: (Number(form.credit) - Number(form.debit)) >= 0 ? "#10b981" : "#ef4444" }}>
                  {formatValue(Number(form.credit) - Number(form.debit), formCurrency)}
                </span>
              </div>

              <button type="submit" className={styles.saveBtn} style={{ marginTop: "20px" }}>Save Transaction</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}