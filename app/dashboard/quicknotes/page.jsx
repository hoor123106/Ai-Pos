"use client";

import { useState, useEffect } from "react";
import styles from "./QuickNotes.module.css";

export default function QuickNotes() {
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [selectedLedger, setSelectedLedger] = useState(null);

  // --- CURRENCY LOGIC ---
  const [exchangeRates, setExchangeRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });
  const [formCurrency, setFormCurrency] = useState("USD");
  const currencySymbols = { USD: "$", PKR: "Rs", AED: "Dh" };

  // --- DATABASE SETUP ---
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") || "Guest" : "Guest";

  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`QuickNotesDB_${userEmail}`, 1);
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
        const dataWithBalance = sortedData.map((item) => {
          runningBal += (Number(item.credit) || 0) - (Number(item.debit) || 0);
          return { ...item, running_balance: runningBal };
        });
        setEntries(dataWithBalance);
      };
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [userEmail]);

  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    name: "",
    account_name: "CASH IN HAND",
    item_name: "",
    debit: "", 
    credit: "",
    balance: 0
  });

  const formatValue = (val, rowCurrency) => {
    const symbol = currencySymbols[rowCurrency || "USD"] || "";
    const num = Number(val) || 0;
    const formatted = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${symbol} ${formatted}`;
  };

  const handleCurrencyChange = (newCurr) => {
    const factor = exchangeRates[newCurr] / exchangeRates[formCurrency];
    setForm((prev) => ({
      ...prev,
      debit: prev.debit !== "" ? (Number(prev.debit) * factor).toFixed(2) : "",
      credit: prev.credit !== "" ? (Number(prev.credit) * factor).toFixed(2) : "",
    }));
    setFormCurrency(newCurr);
  };

  const handleManualRateChange = (currency, newRate) => {
    setExchangeRates(prev => ({ ...prev, [currency]: parseFloat(newRate) || 0 }));
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
    const db = await openDB();
    const tx = db.transaction("transactions", "readwrite");
    tx.objectStore("transactions").put(entryData);
    loadData();
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      entry_date: new Date().toISOString().split("T")[0],
      name: "",
      account_name: "CASH IN HAND",
      item_name: "",
      debit: "", 
      credit: "",
      balance: 0
    });
    setFormCurrency("USD");
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleNameClick = (name) => {
    const history = entries
      .filter(e => e.name.toLowerCase().trim() === name.toLowerCase().trim())
      .sort((a, b) => a.id - b.id);

    let tempBal = 0;
    const historyWithRunningBal = history.map(item => {
      tempBal += (Number(item.credit) || 0) - (Number(item.debit) || 0);
      return { ...item, ledger_bal: tempBal };
    });

    const totalD = history.reduce((s, r) => s + (Number(r.debit) || 0), 0);
    const totalC = history.reduce((s, r) => s + (Number(r.credit) || 0), 0);

    setSelectedLedger({
      name,
      history: historyWithRunningBal.reverse(),
      totalDebit: totalD,
      totalCredit: totalC,
      totalBal: tempBal,
      currency: history[0]?.currency || "USD"
    });
  };

  const getLatestEntriesOnly = () => {
    const latestMap = new Map();
    entries.forEach(item => {
      latestMap.set(item.name.toLowerCase().trim(), item);
    });
    return Array.from(latestMap.values()).reverse();
  };

  const entryBalance = (Number(form.credit) || 0) - (Number(form.debit) || 0);
  const totalDebit = entries.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
  const totalCredit = entries.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.headerBg}></div>
      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800" }}>Financial Ledger</h1>
            <p style={{ opacity: 0.8 }}>Logged in as: {userEmail}</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className={styles.addBtn}>
            + New Entry
          </button>
        </header>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>TOTAL DEBIT (-)</span>
            <h2 className={styles.debitText}>{formatValue(totalDebit, "USD")}</h2>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>TOTAL CREDIT (+)</span>
            <h2 className={styles.creditText}>{formatValue(totalCredit, "USD")}</h2>
          </div>
          <div className={`${styles.statCard} ${styles.balanceCard}`}>
            <span className={styles.statLabel}>OVERALL NET BALANCE</span>
            <h2 style={{ color: "#1f2937", margin: "10px 0 0" }}>{formatValue(totalCredit - totalDebit, "USD")}</h2>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.ledgerTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Account</th>
                <th>Item</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {getLatestEntriesOnly().map((item) => (
                <tr key={item.id} className={styles.tableRow}>
                  <td>{item.entry_date}</td>
                  <td onClick={() => handleNameClick(item.name)} className={styles.clickableName}>{item.name}</td>
                  <td>{item.account_name}</td>
                  <td>{item.item_name || "-"}</td>
                  <td className={styles.debitText}>{item.debit > 0 ? formatValue(item.debit, item.currency) : "-"}</td>
                  <td className={styles.creditText}>{item.credit > 0 ? formatValue(item.credit, item.currency) : "-"}</td>
                  <td className={styles.boldText}>{formatValue(item.running_balance, item.currency)}</td>
                  <td>
                    <button onClick={() => { 
                        setIsEditing(true); 
                        setCurrentId(item.id); 
                        setForm(item); 
                        setFormCurrency(item.currency || "USD"); 
                        setShowModal(true); 
                    }} className={styles.editBtn}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- NEW DESIGN FULL LEDGER MODAL --- */}
      {selectedLedger && (
        <div className={styles.modalOverlay}>
          <div className={styles.ledgerModalContent}>
            <div className={styles.ledgerModalHeader}>
              <div>
                <h2 style={{ margin: 0 }}>Statement of Account</h2>
                <p style={{ margin: "5px 0 0", opacity: 0.8 }}>Party Name: <strong>{selectedLedger.name}</strong></p>
              </div>
              <button onClick={() => setSelectedLedger(null)} className={styles.closeBtn}>&times;</button>
            </div>

            <div className={styles.ledgerStatsRow}>
                <div className={styles.miniStat}>
                    <span>Total Debit</span>
                    <strong style={{color: '#ef4444'}}>{formatValue(selectedLedger.totalDebit, selectedLedger.currency)}</strong>
                </div>
                <div className={styles.miniStat}>
                    <span>Total Credit</span>
                    <strong style={{color: '#10b981'}}>{formatValue(selectedLedger.totalCredit, selectedLedger.currency)}</strong>
                </div>
                <div className={styles.miniStat}>
                    <span>Net Balance</span>
                    <strong style={{color: '#1e40af'}}>{formatValue(selectedLedger.totalBal, selectedLedger.currency)}</strong>
                </div>
            </div>

            <div className={styles.ledgerScrollArea}>
              <table className={styles.ledgerTable}>
                <thead className={styles.stickyHeader}>
                  <tr>
                    <th>Date</th>
                    <th>Account</th>
                    <th>Item</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLedger.history.map(item => (
                    <tr key={item.id} className={styles.tableRow}>
                      <td>{item.entry_date}</td>
                      <td style={{fontSize: '12px', fontWeight: 'bold'}}>{item.account_name}</td>
                      <td style={{color: '#6b7280'}}>{item.item_name || "No description"}</td>
                      <td className={styles.debitText}>{item.debit > 0 ? formatValue(item.debit, item.currency) : "—"}</td>
                      <td className={styles.creditText}>{item.credit > 0 ? formatValue(item.credit, item.currency) : "—"}</td>
                      <td className={styles.boldText}>{formatValue(item.ledger_bal, item.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className={styles.ledgerFooter}>
                <button onClick={() => setSelectedLedger(null)} className={styles.closeLedgerBtn}>Close Statement</button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
                <h2>{isEditing ? "Edit" : "New"} Entry</h2>
                <button onClick={() => setShowModal(false)} className={styles.closeBtn}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.currencyBox}>
                <label className={styles.fieldLabel} style={{marginTop: 0}}>Currency & Exchange</label>
                <select className={styles.inputField} value={formCurrency} onChange={(e) => handleCurrencyChange(e.target.value)}>
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="AED">AED (Dh)</option>
                </select>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px", fontWeight: "bold" }}>PKR Rate</label>
                    <input type="number" value={exchangeRates.PKR} onChange={(e) => handleManualRateChange("PKR", e.target.value)} className={styles.miniInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px", fontWeight: "bold" }}>AED Rate</label>
                    <input type="number" value={exchangeRates.AED} onChange={(e) => handleManualRateChange("AED", e.target.value)} className={styles.miniInput} />
                  </div>
                </div>
              </div>

              <label className={styles.fieldLabel}>Date</label>
              <input type="date" className={styles.inputField} value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} required />

              <label className={styles.fieldLabel}>Name</label>
              <input type="text" className={styles.inputField} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

              <label className={styles.fieldLabel}>Account Name</label>
              <select className={styles.inputField} value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })}>
                <option value="CASH IN HAND">CASH IN HAND</option>
                <option value="DASTI">DASTI</option>
                <option value="MEEZAN BANK">MEEZAN BANK</option>
                <option value="AL HABIB BANK">AL HABIB BANK</option>
                <option value="DEBIT">DEBIT</option>
                <option value="CREDIT">CREDIT</option>
              </select>

              <label className={styles.fieldLabel}>Item Name</label>
              <input type="text" className={styles.inputField} value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.fieldLabel}>Debit (Out)</label>
                  <input type="number" className={styles.inputField} value={form.debit} onChange={(e) => setForm({...form, debit: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.fieldLabel}>Credit (In)</label>
                  <input type="number" className={styles.inputField} value={form.credit} onChange={(e) => setForm({...form, credit: e.target.value})} />
                </div>
              </div>

              <div className={styles.impactBox}>
                <span className={styles.impactLabel}>ENTRY IMPACT: </span>
                <span style={{ fontWeight: "bold", color: entryBalance >= 0 ? "#10b981" : "#ef4444" }}>
                  {formatValue(entryBalance, formCurrency)}
                </span>
              </div>
              <button type="submit" className={styles.saveBtn}>{isEditing ? "Update Transaction" : "Save Transaction"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}