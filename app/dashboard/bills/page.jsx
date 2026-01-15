"use client";

import { useState, useEffect, useMemo } from "react";
import Dexie from "dexie";

export default function BillsInvoices() {
  const db = useMemo(() => {
    let userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") || "Guest" : "Guest";
    const dexieDb = new Dexie(`VendorDB_${userEmail}`);
    dexieDb.version(2).stores({
      vendor_records: "++id, date, vendor_name, account_name, currency, description, memo",
      bill_records: "++id, date, vendor_name, account_name, currency, description, memo, ref_no, due_date"
    });
    return dexieDb;
  }, []);

  const [bills, setBills] = useState([]);

  useEffect(() => {
    const fetchBills = async () => {
      const data = await db.bill_records.toArray();
      setBills(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    };
    fetchBills();
  }, [db]);

  return (
    <div style={{ padding: "40px", backgroundColor: "#f9fafb", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>Bills & Invoices</h1>
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#fafafa" }}>
            <tr style={{ fontSize: "12px", color: "#6b7280", textAlign: "left" }}>
              <th style={{ padding: "15px" }}>DATE</th>
              <th style={{ padding: "15px" }}>VENDOR</th>
              <th style={{ padding: "15px" }}>REF NO</th>
              <th style={{ padding: "15px" }}>DUE DATE</th>
              <th style={{ padding: "15px", textAlign: "right" }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "15px" }}>{bill.date}</td>
                <td style={{ padding: "15px", fontWeight: "bold" }}>{bill.vendor_name}</td>
                <td style={{ padding: "15px" }}>{bill.ref_no || "—"}</td>
                <td style={{ padding: "15px" }}>{bill.due_date || "—"}</td>
                <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold" }}>
                  {bill.currency === "PKR" ? "Rs" : "$"} {bill.credit}
                </td>
              </tr>
            ))}
            {bills.length === 0 && (
              <tr><td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#999" }}>No bills found. Create a bill from the Vendors page.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}