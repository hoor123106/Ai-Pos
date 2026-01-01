"use client";

import { useState, useEffect } from "react";
import styles from "./QuickNotes.module.css";

export default function QuickNotes() {
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    name: "",
    item_name: "",
    ref_no: "",
    debit: "", // 0 ki jagah empty string
    credit: "", // 0 ki jagah empty string
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

  const totalDebit = entries.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
  const totalCredit = entries.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0);
  const netBalance = totalCredit - totalDebit;

  // Glitch Fix: Input handling logic
  const handleNumberChange = (field, value) => {
    // Agar value khali hai to khali rakho, warna number mein convert karo
    // Isse leading zero wala masla hal ho jayega
    if (value === "") {
      setForm({ ...form, [field]: "" });
    } else {
      setForm({ ...form, [field]: Number(value) });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const entryData = {
      ...form,
      id: isEditing ? currentId : Date.now(),
      debit: Number(form.debit) || 0, // Save karte waqt wapis number bana do
      credit: Number(form.credit) || 0,
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
    });
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
            <h2 style={{ color: "#ef4444", margin: "10px 0 0" }}>{totalDebit.toLocaleString()}</h2>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>TOTAL CREDIT (+)</span>
            <h2 style={{ color: "#10b981", margin: "10px 0 0" }}>{totalCredit.toLocaleString()}</h2>
          </div>
          <div className={`${styles.statCard} ${styles.balanceCard} ${netBalance < 0 ? styles.negativeBalance : ""}`}>
            <span className={styles.statLabel}>NET BALANCE</span>
            <h2 style={{ color: "#1f2937", margin: "10px 0 0" }}>{netBalance.toLocaleString()}</h2>
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
                    {item.debit > 0 ? item.debit.toLocaleString() : ""}
                  </td>
                  <td style={{ padding: "16px", textAlign: "right", color: "#10b981" }}>
                    {item.credit > 0 ? item.credit.toLocaleString() : ""}
                  </td>
                  <td style={{ padding: "16px", textAlign: "right", fontWeight: "700" }}>
                    {(item.running_balance || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setCurrentId(item.id);
                        setForm(item);
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
            <h2 style={{ marginBottom: "20px" }}>{isEditing ? "Edit" : "New"} Entry</h2>
            <form onSubmit={handleSave}>
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
                    className={styles.inputField}
                    value={form.debit}
                    onChange={(e) => handleNumberChange("debit", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.fieldLabel}>Credit (In)</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={form.credit}
                    onChange={(e) => handleNumberChange("credit", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className={styles.previewBox}>
                Current Entry Balance:{" "}
                <span style={{ color: (Number(form.credit) - Number(form.debit)) >= 0 ? "#10b981" : "#ef4444" }}>
                  {(Number(form.credit) - Number(form.debit)).toLocaleString()}
                </span>
              </div>

              <button type="submit" className={styles.saveBtn}>Save Transaction</button>
              <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}