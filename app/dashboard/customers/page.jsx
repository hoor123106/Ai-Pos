"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase/client"; 

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [exchangeRates, setExchangeRates] = useState({ USD: 1, PKR: 280, AED: 3.67 });
  const [formCurrency, setFormCurrency] = useState("USD");

  const [form, setForm] = useState({
    date: "", account_name: "", description: "", qty: 0,
    reference: "", debit: 0, credit: 0, balance: 0,
  });

  const currencySymbols = { USD: "$", PKR: "Rs", AED: "Dh" };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customer_records")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from("customer_records").delete().eq("id", id);
      if (error) throw error;
      fetchCustomers();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const formatValue = (val, rowCurrency) => {
    const amount = val !== undefined && val !== null ? val : 0;
    const activeCurrency = rowCurrency || "USD"; 
    const symbol = currencySymbols[activeCurrency] || "";
    return `${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const numValue = type === "number" ? (value === "" ? 0 : parseFloat(value)) : value;
    
    setForm((prev) => {
        const updated = { ...prev, [name]: numValue };
        if (name === "debit" || name === "credit") {
            const d = name === "debit" ? numValue : (prev.debit || 0);
            const c = name === "credit" ? numValue : (prev.credit || 0);
            updated.balance = parseFloat((d - c).toFixed(2));
        }
        return updated;
    });
  };

  const handleManualRateChange = (newRate) => {
    const rateVal = parseFloat(newRate) || 0;
    if (formCurrency === "PKR" && rateVal > 0) {
      const oldRate = exchangeRates.PKR;
      const factor = rateVal / oldRate;
      setForm((prev) => ({
        ...prev,
        debit: parseFloat((prev.debit * factor).toFixed(2)),
        credit: parseFloat((prev.credit * factor).toFixed(2)),
        balance: parseFloat((prev.balance * factor).toFixed(2)),
      }));
    }
    setExchangeRates(prev => ({ ...prev, PKR: rateVal }));
  };

  const handleCurrencyChange = (newCurr) => {
    const oldCurr = formCurrency;
    if (oldCurr === newCurr) return;
    const factor = exchangeRates[newCurr] / exchangeRates[oldCurr];
    setForm((prev) => ({
      ...prev,
      debit: parseFloat((prev.debit * factor).toFixed(2)),
      credit: parseFloat((prev.credit * factor).toFixed(2)),
      balance: parseFloat((prev.balance * factor).toFixed(2)),
    }));
    setFormCurrency(newCurr);
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    // Saari validations hata di hain, ab khali form bhi save ho jayega
    try {
      const { error } = await supabase
        .from("customer_records")
        .insert([{
            ...form,
            currency: formCurrency 
        }]);
      if (error) throw error;
      setShowForm(false);
      fetchCustomers();
      setForm({ date: "", account_name: "", description: "", qty: 0, reference: "", debit: 0, credit: 0, balance: 0 });
      setFormCurrency("USD");
    } catch (error) {
      alert("Error saving: " + error.message);
    }
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: "25px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#000", margin: "0" }}>Customers</h1>
          <p style={{ color: "#666", fontSize: "14px", marginTop: "4px" }}>Manage customer accounts.</p>
      </div>

      <button onClick={() => setShowForm(true)} style={{ backgroundColor: "#000", color: "#fff", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500", fontSize: "14px", marginBottom: "20px" }}>
        + Add Customer
      </button>

      {/* Table Section */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflowX: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
          <thead style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
            <tr style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase" }}>
              <th style={{ padding: "15px", textAlign: "center" }}>Date</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Account Name</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Description</th>
              <th style={{ padding: "15px", textAlign: "center" }}>QTY</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Ref No.</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Debit</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Credit</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Balance</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: "14px", color: "#374151" }}>
            {loading ? (
              <tr><td colSpan="9" style={{ padding: "40px", textAlign: "center" }}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="9" style={{ padding: "40px", textAlign: "center" }}>No records found.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "15px", textAlign: "center" }}>{row.date || "—"}</td>
                <td style={{ padding: "15px", textAlign: "center", fontWeight: "500" }}>{row.account_name || "—"}</td>
                <td style={{ padding: "15px", textAlign: "center" }}>{row.description || "—"}</td>
                <td style={{ padding: "15px", textAlign: "center" }}>{row.qty || "0"}</td>
                <td style={{ padding: "15px", textAlign: "center" }}>{row.reference || "—"}</td>
                <td style={{ padding: "15px", textAlign: "center", color: "#0ca678" }}>{formatValue(row.debit, row.currency)}</td>
                <td style={{ padding: "15px", textAlign: "center", color: "#e03131" }}>{formatValue(row.credit, row.currency)}</td>
                <td style={{ padding: "15px", textAlign: "center", fontWeight: "bold" }}>{formatValue(row.balance, row.currency)}</td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <button onClick={() => deleteCustomer(row.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ff4d4f" }}>
                    {/* Delete Icon SVG */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.15)", zIndex: 998 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: "400px", height: "100%", backgroundColor: "#fff", zIndex: 999, padding: "30px", boxShadow: "-5px 0 25px rgba(0,0,0,0.1)", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Add New Customer</h2>
              <button onClick={() => setShowForm(false)} style={{ border: "none", background: "none", fontSize: "22px", cursor: "pointer", color: "#bbb" }}>✕</button>
            </div>

            <form onSubmit={saveCustomer} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              
              <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #eee" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Select Currency</label>
                <select value={formCurrency} onChange={(e) => handleCurrencyChange(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="AED">AED (Dh)</option>
                </select>

                <div style={{ marginTop: "12px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "600", color: "#555" }}>USD Rate (for PKR conversion)</label>
                  <input 
                    type="number" 
                    value={exchangeRates.PKR} 
                    onChange={(e) => handleManualRateChange(e.target.value)}
                    style={{ width: "100%", padding: "8px", marginTop: "5px", borderRadius: "6px", border: "1px solid #ddd" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Date</label>
                <input name="date" type="date" value={form.date} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Customer Name</label>
                <input name="account_name" value={form.account_name} onChange={handleChange} placeholder="Customer Name" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Description</label>
                <input name="description" value={form.description} onChange={handleChange} placeholder="Description" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Quantity</label>
                <input name="qty" type="number" value={form.qty === 0 ? "" : form.qty} onChange={handleChange} placeholder="Quantity" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Reference No.</label>
                <input name="reference" value={form.reference} onChange={handleChange} placeholder="Reference No." style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
              </div>
              
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Debit Amount ({currencySymbols[formCurrency]})</label>
                <input name="debit" type="number" step="any" value={form.debit === 0 ? "" : form.debit} onChange={handleChange} placeholder="0.00" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Credit Amount ({currencySymbols[formCurrency]})</label>
                <input name="credit" type="number" step="any" value={form.credit === 0 ? "" : form.credit} onChange={handleChange} placeholder="0.00" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Balance ({currencySymbols[formCurrency]})</label>
                <input 
                  name="balance" 
                  type="number" 
                  value={form.balance} 
                  readOnly 
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: "#f3f4f6" }} 
                />
              </div>

              <button type="submit" style={{ backgroundColor: "#000", color: "#fff", padding: "14px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", marginTop: "10px" }}>Save</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}