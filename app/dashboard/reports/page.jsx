"use client";

import { useState, useEffect, useMemo } from "react";
import Dexie from "dexie";

export default function Reports() {
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") || "Guest" : "Guest";

  // --- DATABASE ---
  const billDb = useMemo(() => {
    const db = new Dexie(`BillsDB_${userEmail}`);
    db.version(1).stores({ bill_records: "++id, invoice_no, date, customer_name, items" });
    return db;
  }, [userEmail]);

  const [allInvoices, setAllInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchReports = async () => {
    const data = await billDb.bill_records.toArray();
    const sortedData = data.reverse(); 
    setAllInvoices(sortedData);
    if (sortedData.length > 0) {
      setSelectedInvoice(sortedData[0]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [billDb]);

  // --- PDF DOWNLOAD LOGIC (FIXED) ---
  const downloadPDF = async () => {
    if (typeof window !== "undefined") {
      const element = document.getElementById("report-content");
      // Dynamic import to avoid build errors
      const html2pdf = (await import("html2pdf.js")).default;
      
      const options = {
        margin: 0.5,
        filename: `${selectedInvoice.invoice_no}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().set(options).from(element).save();
    }
  };

  const handleInvoiceSelect = (id) => {
    const inv = allInvoices.find(item => item.id === parseInt(id));
    setSelectedInvoice(inv);
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  if (!selectedInvoice) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Reports...</div>;

  return (
    <div style={{ padding: "40px", backgroundColor: "#f1f5f9", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Search Bar */}
      <div style={{ maxWidth: "800px", margin: "0 auto 20px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "15px", borderRadius: "10px" }}>
        <div>
          <label style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b" }}>SELECT INVOICE</label>
          <select 
            onChange={(e) => handleInvoiceSelect(e.target.value)} 
            value={selectedInvoice.id}
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "300px", display: "block", marginTop: "5px" }}
          >
            {allInvoices.map(inv => (
              <option key={inv.id} value={inv.id}>
                {inv.invoice_no} - {inv.customer_name}
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={downloadPDF} 
          style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "12px 25px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          PDF Download
        </button>
      </div>

      {/* Report Layout */}
      <div id="report-content" style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#fff", padding: "50px", borderRadius: "4px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", minHeight: "1000px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #f1f5f9", paddingBottom: "30px", marginBottom: "30px" }}>
          <div>
            <h1 style={{ margin: 0, color: "#1e293b", fontSize: "28px", fontWeight: "800" }}>INVOICE REPORT</h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>WIGA POS - Statement</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h3 style={{ margin: 0, color: "#2563eb" }}>{selectedInvoice.invoice_no}</h3>
            <p style={{ margin: "5px 0", fontSize: "14px", fontWeight: "bold" }}>Date: {selectedInvoice.date}</p>
          </div>
        </div>

        <div style={{ marginBottom: "40px" }}>
          <p style={{ color: "#64748b", fontSize: "12px", fontWeight: "bold" }}>BILLED TO:</p>
          <h2 style={{ margin: 0, fontSize: "20px" }}>{selectedInvoice.customer_name}</h2>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "40px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: "15px", textAlign: "left" }}>ITEM</th>
              <th style={{ padding: "15px", textAlign: "center" }}>QTY</th>
              <th style={{ padding: "15px", textAlign: "right" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {selectedInvoice.items.map((item, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "15px" }}><strong>{item.itemCode}</strong><br/>{item.description}</td>
                <td style={{ padding: "15px", textAlign: "center" }}>{item.qty}</td>
                <td style={{ padding: "15px", textAlign: "right" }}>${Number(item.amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "250px", borderTop: "2px solid #1e293b", paddingTop: "15px", textAlign: "right" }}>
            <span style={{ fontWeight: "800", fontSize: "18px" }}>NET TOTAL: </span>
            <span style={{ fontWeight: "800", fontSize: "18px", color: "#2563eb" }}>
              ${calculateTotal(selectedInvoice.items).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}