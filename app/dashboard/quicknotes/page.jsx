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
    description: "",
    ref_no: "", // New Field
    debit: 0,
    credit: 0,
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
        setEntries(request.result.sort((a, b) => b.id - a.id));
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

  const totalDebit = entries.reduce((acc, curr) => acc + curr.debit, 0);
  const totalCredit = entries.reduce((acc, curr) => acc + curr.credit, 0);
  const netBalance = totalCredit - totalDebit;

  const handleSave = async (e) => {
    e.preventDefault();
    const entryData = {
      ...form,
      id: isEditing ? currentId : Date.now(),
      total: Number(form.credit) - Number(form.debit),
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
      description: "",
      ref_no: "",
      debit: 0,
      credit: 0
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
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            style={{ backgroundColor: "#10b981", color: "white", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}
          >
            + New Entry
          </button>
        </header>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>DEBIT</span>
            <h2 style={{ color: "#ef4444", margin: "10px 0 0" }}>{totalDebit.toLocaleString()}</h2>
          </div>
          <div className={styles.statCard}>
            <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>CREDIT</span>
            <h2 style={{ color: "#10b981", margin: "10px 0 0" }}>{totalCredit.toLocaleString()}</h2>
          </div>
          <div className={`${styles.statCard} ${styles.balanceCard}`}>
            <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "bold" }}>NET BALANCE</span>
            <h2 style={{ color: "#1f2937", margin: "10px 0 0" }}>{netBalance.toLocaleString()}</h2>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "16px", textAlign: "left" }}>Date</th>
                <th style={{ padding: "16px", textAlign: "left" }}>Name</th>
                <th style={{ padding: "16px", textAlign: "left" }}>Ref No.</th>
                <th style={{ padding: "16px", textAlign: "left" }}>Description</th>
                <th style={{ padding: "16px", textAlign: "right" }}>Debit</th>
                <th style={{ padding: "16px", textAlign: "right" }}>Credit</th>
                <th style={{ padding: "16px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "16px" }}>{item.entry_date}</td>
                  <td style={{ padding: "16px", fontWeight: "bold" }}>{item.name}</td>
                  <td style={{ padding: "16px" }}>{item.ref_no || "-"}</td>
                  <td style={{ padding: "16px" }}>{item.description || "-"}</td>
                  <td style={{ padding: "16px", textAlign: "right", color: "#ef4444" }}>{item.debit.toLocaleString()}</td>
                  <td style={{ padding: "16px", textAlign: "right", color: "#10b981" }}>{item.credit.toLocaleString()}</td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <button onClick={() => { setIsEditing(true); setCurrentId(item.id); setForm(item); setShowModal(true); }} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
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
              <label>Date</label>
              <input type="date" className={styles.inputField} value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} required />

              <label>Name</label>
              <input type="text" className={styles.inputField} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />

              <label>Reference No.</label>
              <input type="text" className={styles.inputField} value={form.ref_no} onChange={e => setForm({ ...form, ref_no: e.target.value })} />

              <label>Description</label>
              <textarea className={styles.inputField} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="2" />

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label>Debit</label>
                  <input type="number" className={styles.inputField} value={form.debit} onChange={e => setForm({ ...form, debit: Number(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Credit</label>
                  <input type="number" className={styles.inputField} value={form.credit} onChange={e => setForm({ ...form, credit: Number(e.target.value) })} />
                </div>
              </div>

              <button type="submit" style={{ width: "100%", padding: "14px", background: "#1f2937", color: "white", borderRadius: "8px", marginTop: "20px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                Save Transaction
              </button>
              <button type="button" onClick={() => setShowModal(false)} style={{ width: "100%", background: "none", border: "none", marginTop: "10px", cursor: "pointer", color: "#6b7280" }}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}