"use client";

import { useState, useEffect, useMemo } from "react";
import Dexie from "dexie";

export default function Bills() {
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") || "Guest" : "Guest";

  // --- DATABASES ---
  const billDb = useMemo(() => {
    const db = new Dexie(`BillsDB_${userEmail}`);
    db.version(1).stores({ bill_records: "++id, invoice_no, date, customer_name, items" });
    return db;
  }, [userEmail]);

  const vendorDb = useMemo(() => {
    const db = new Dexie(`VendorDB_${userEmail}`);
    db.version(2).stores({ vendor_records: "++id, item_code, description, debit, qty, vendor_name" });
    return db;
  }, [userEmail]);

  const customerDb = useMemo(() => {
    const db = new Dexie(`CustomerDB_${userEmail}`);
    db.version(1).stores({ customer_records: "++id, item_code, customer_name" });
    return db;
  }, [userEmail]);

  // --- STATES ---
  // Invoice No background mein generate hoti rahegi tracking ke liye, magar UI se hta di hai
  const [invoiceNo] = useState(`INV-${Date.now().toString().slice(-5)}`);
  const [customerName, setCustomerName] = useState("");
  const [combinedNameList, setCombinedNameList] = useState([]); 
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [lineItems, setLineItems] = useState([{ id: 1, itemCode: "", description: "", qty: 1, price: 0, amount: 0 }]);

  // --- FETCH NAMES ---
  useEffect(() => {
    const fetchAllNames = async () => {
      try {
        const [customers, vendors] = await Promise.all([
          customerDb.customer_records.toArray(),
          vendorDb.vendor_records.toArray()
        ]);
        const cNames = customers.map(c => c.customer_name);
        const vNames = vendors.map(v => v.vendor_name);
        const uniqueNames = [...new Set([...cNames, ...vNames])].filter(name => name); 
        setCombinedNameList(uniqueNames.sort());
      } catch (error) {
        console.error("Error fetching names:", error);
      }
    };
    fetchAllNames();
  }, [customerDb, vendorDb]);

  // --- LOOKUP LOGIC ---
  const handleItemLookup = async (index, code) => {
    const updatedItems = [...lineItems];
    updatedItems[index].itemCode = code;

    if (code.length >= 1) {
      let match = await vendorDb.vendor_records.where("item_code").equals(code).first();
      if (!match) {
        match = await customerDb.customer_records.where("item_code").equals(code).first();
      }

      if (match) {
        updatedItems[index].description = match.description || "";
        const entryQty = Number(match.qty) || 1;
        updatedItems[index].qty = entryQty;
        updatedItems[index].amount = 0;
        updatedItems[index].price = 0;
      }
    }
    setLineItems(updatedItems);
  };

  const updateLineItem = (index, field, value) => {
    const updatedItems = [...lineItems];
    const numVal = value === "" ? 0 : parseFloat(value);
    updatedItems[index][field] = (field === "description" || field === "itemCode") ? value : numVal;
    
    if (field === "amount" || field === "qty") {
      const currentAmt = field === "amount" ? numVal : updatedItems[index].amount;
      const currentQty = field === "qty" ? numVal : updatedItems[index].qty;
      if (currentQty > 0) {
        updatedItems[index].price = Number((currentAmt / currentQty).toFixed(2));
      } else {
        updatedItems[index].price = 0;
      }
    }
    setLineItems(updatedItems);
  };

  const addRow = () => {
    setLineItems([...lineItems, { id: Date.now(), itemCode: "", description: "", qty: 1, price: 0, amount: 0 }]);
  };

  const removeRow = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const saveInvoice = async () => {
    if (!customerName) return alert("Please select a name");
    await billDb.bill_records.add({
      invoice_no: invoiceNo,
      customer_name: customerName,
      date,
      items: lineItems,
    });
    alert("Invoice Saved Successfully!");
    window.location.reload();
  };

  // --- STYLES ---
  const headerLabelStyle = { fontSize: "11px", fontWeight: "700", color: "#6b7280", marginBottom: "6px", display: "block", textTransform: "uppercase" };
  const inputBaseStyle = { padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", width: "100%", outline: "none", fontSize: "14px", backgroundColor: "#fff" };
  const tableHeadStyle = { padding: "14px", fontSize: "11px", fontWeight: "700", color: "#4b5563", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" };

  return (
    <div style={{ padding: "40px", backgroundColor: "#f9fafb", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Header Card - Cleaned (No Invoice #) */}
      <div style={{ backgroundColor: "#ffffff", padding: "30px", borderRadius: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "30px", border: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h2 style={{ margin: 0, fontSize: "24px", color: "#111827", fontWeight: "800" }}>Invoice Entry</h2>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={saveInvoice} style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "12px 28px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)" }}>Save Invoice</button>
            <button style={{ backgroundColor: "#fff", color: "#374151", border: "1px solid #e5e7eb", padding: "12px 28px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>Print</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "30px" }}>
          <div>
            <label style={headerLabelStyle}>Choose Customer / Vendor</label>
            <select value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ ...inputBaseStyle, border: "2px solid #f3f4f6" }}>
              <option value="">Search Vendors And Customers...</option>
              {combinedNameList.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={headerLabelStyle}>Transaction Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputBaseStyle} />
          </div>
        </div>
      </div>

      {/* Main Grid Card */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden", border: "1px solid #f3f4f6" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th style={{ ...tableHeadStyle, textAlign: "left", width: "200px" }}>Item Code</th>
              <th style={{ ...tableHeadStyle, textAlign: "left" }}>Description</th>
              <th style={{ ...tableHeadStyle, textAlign: "center", width: "100px" }}>Qty</th>
              <th style={{ ...tableHeadStyle, textAlign: "right", width: "180px" }}>Amount ($)</th>
              <th style={{ ...tableHeadStyle, textAlign: "right", width: "150px" }}>Price Each</th>
              <th style={{ ...tableHeadStyle, textAlign: "center", width: "60px" }}></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                <td style={{ padding: "16px" }}>
                  <input 
                    value={item.itemCode} 
                    onChange={(e) => handleItemLookup(index, e.target.value)} 
                    style={{ ...inputBaseStyle, borderColor: "#3b82f6", fontWeight: "600", color: "#2563eb", backgroundColor: "#eff6ff" }} 
                    placeholder="Scan Code..."
                  />
                </td>
                <td style={{ padding: "16px" }}>
                  <input 
                    value={item.description} 
                    onChange={(e) => updateLineItem(index, "description", e.target.value)} 
                    style={{ ...inputBaseStyle, border: "none", backgroundColor: "transparent" }} 
                    placeholder="Item details"
                  />
                </td>
                <td style={{ padding: "16px" }}>
                  <input 
                    type="number" 
                    value={item.qty} 
                    onChange={(e) => updateLineItem(index, "qty", e.target.value)} 
                    style={{ ...inputBaseStyle, textAlign: "center", border: "none" }} 
                  />
                </td>
                <td style={{ padding: "16px" }}>
                    <input 
                      type="number" 
                      value={item.amount || ""} 
                      onChange={(e) => updateLineItem(index, "amount", e.target.value)} 
                      style={{ ...inputBaseStyle, border: "1px solid #10b981", fontWeight: "700", color: "#059669", textAlign: "right" }} 
                      placeholder="0.00"
                    />
                </td>
                <td style={{ padding: "16px", textAlign: "right", fontWeight: "600", color: "#4b5563", fontSize: "15px" }}>
                  {item.price > 0 ? `$${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                </td>
                <td style={{ padding: "16px", textAlign: "center" }}>
                  <button onClick={() => removeRow(index)} style={{ color: "#f87171", border: "none", background: "none", cursor: "pointer", fontSize: "20px" }}>&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ padding: "24px", backgroundColor: "#fff" }}>
          <button 
            onClick={addRow} 
            style={{ 
              color: "#2563eb", 
              backgroundColor: "#f0f7ff", 
              border: "1px dashed #3b82f6", 
              padding: "10px 20px", 
              borderRadius: "8px", 
              cursor: "pointer", 
              fontWeight: "600", 
              fontSize: "13px" 
            }}
          >
            + Add New Row
          </button>
        </div>
      </div>
    </div>
  );
}