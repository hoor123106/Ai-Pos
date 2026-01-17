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

  // --- PDF DOWNLOAD LOGIC ---
  const downloadPDF = async () => {
    if (typeof window !== "undefined") {
      const element = document.getElementById("report-content");
      const html2pdf = (await import("html2pdf.js")).default;
      
      const options = {
        margin: 0.3,
        filename: `${selectedInvoice.invoice_no}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
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

  if (!selectedInvoice) return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading Reports...</div>;

  return (
    <div style={{ padding: "30px", backgroundColor: "#f1f5f9", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Bar for Selection & Action */}
      <div style={{ maxWidth: "850px", margin: "0 auto 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", backgroundColor: "#fff", padding: "15px 20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Search Invoice Report</label>
          <select 
            onChange={(e) => handleInvoiceSelect(e.target.value)} 
            value={selectedInvoice.id}
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", width: "320px", display: "block", marginTop: "5px", outline: "none", backgroundColor: "#f8fafc" }}
          >
            {allInvoices.map(inv => (
              <option key={inv.id} value={inv.id}>
                {inv.invoice_no} — {inv.customer_name}
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={downloadPDF} 
          style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "12px 25px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download PDF
        </button>
      </div>

      {/* Professional Bill/Report Layout */}
      <div id="report-content" style={{ 
        maxWidth: "850px", 
        margin: "0 auto", 
        backgroundColor: "#ffffff", 
        padding: "50px", 
        borderRadius: "4px", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)", 
        minHeight: "1050px",
        color: "#1e293b"
      }}>
        
        {/* Invoice Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "50px" }}>
          <div>
            <div style={{ color: "#2563eb", fontWeight: "900", fontSize: "24px", marginBottom: "5px" }}>WIGA POS</div>
            <h1 style={{ margin: 0, fontSize: "36px", fontWeight: "800", letterSpacing: "-1px", color: "#0f172a" }}>INVOICE</h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "5px 0" }}>Transaction Summary Report</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#64748b" }}>INVOICE NO</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#2563eb" }}>{selectedInvoice.invoice_no}</div>
            <div style={{ marginTop: "15px", fontSize: "14px", fontWeight: "700", color: "#64748b" }}>DATE</div>
            <div style={{ fontSize: "16px", fontWeight: "700" }}>{selectedInvoice.date}</div>
          </div>
        </div>

        {/* Client Section */}
        <div style={{ marginBottom: "40px", padding: "20px", backgroundColor: "#f8fafc", borderRadius: "10px", borderLeft: "5px solid #2563eb" }}>
          <div style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", marginBottom: "5px", textTransform: "uppercase" }}>Billed To:</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>{selectedInvoice.customer_name}</div>
          <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>Status: <span style={{ color: "#059669", fontWeight: "700" }}>PAID</span></div>
        </div>

        {/* Table Header */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1e293b" }}>
              <th style={{ padding: "15px", textAlign: "left", color: "#fff", borderRadius: "8px 0 0 0", fontSize: "13px" }}>ITEM DESCRIPTION</th>
              <th style={{ padding: "15px", textAlign: "center", color: "#fff", fontSize: "13px", width: "80px" }}>QTY</th>
              <th style={{ padding: "15px", textAlign: "right", color: "#fff", fontSize: "13px", width: "120px" }}>UNIT PRICE</th>
              <th style={{ padding: "15px", textAlign: "right", color: "#fff", borderRadius: "0 8px 0 0", fontSize: "13px", width: "120px" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {selectedInvoice.items.map((item, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "20px 15px" }}>
                  <div style={{ fontWeight: "700", fontSize: "15px", color: "#0f172a" }}>{item.itemCode}</div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginTop: "3px" }}>{item.description || "No description provided"}</div>
                </td>
                <td style={{ padding: "20px 15px", textAlign: "center", fontWeight: "600" }}>{item.qty}</td>
                <td style={{ padding: "20px 15px", textAlign: "right", color: "#64748b" }}>${Number(item.price).toLocaleString()}</td>
                <td style={{ padding: "20px 15px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>${Number(item.amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "30px" }}>
          <div style={{ width: "300px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 15px" }}>
              <span style={{ color: "#64748b", fontWeight: "600" }}>Subtotal</span>
              <span style={{ fontWeight: "700" }}>${calculateTotal(selectedInvoice.items).toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "15px", backgroundColor: "#f1f5f9", borderRadius: "8px", marginTop: "10px" }}>
              <span style={{ fontWeight: "800", fontSize: "18px" }}>Grand Total</span>
              <span style={{ fontWeight: "800", fontSize: "18px", color: "#2563eb" }}>
                ${calculateTotal(selectedInvoice.items).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: "100px", textAlign: "center", borderTop: "2px solid #f1f5f9", paddingTop: "30px" }}>
          <p style={{ fontWeight: "700", margin: "0", color: "#0f172a" }}>Thank you for your business!</p>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "5px" }}>If you have any questions about this invoice, please contact support.</p>
          <div style={{ fontSize: "10px", color: "#cbd5e1", marginTop: "40px", textTransform: "uppercase", letterSpacing: "2px" }}>Generated via WIGA POS Cloud Accounting</div>
        </div>
      </div>
    </div>
  );
}