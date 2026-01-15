"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; // Link import kiya
import styles from "./dashboardCards.module.css";
import Dexie from "dexie";

// Card component mein 'href' prop add kiya
const Card = ({ title, value, percent, icon, trend, href }) => {
  return (
    <Link href={href} className={styles.cardLink}>
      <div className={styles.dashboardCard}>
        <div className={styles.dashboardcardTop}>
          <div className={styles.iconBox}>
            <img src={icon} alt={title} className={styles.iconImage} />
          </div>
          <span className={`${styles.percent} ${trend === "up" ? styles.up : styles.down}`}>
            <img
              src={trend === "up" ? "/images/highVolume.png" : "/images/downVolume.png"}
              alt="trend"
            />
            {percent}
          </span>
        </div>
        <p className={styles.title}>{title}</p>
        <h2 className={styles.value}>{value}</h2>
      </div>
    </Link>
  );
};

export default function DashboardCards() {
  const [counts, setCounts] = useState({ customers: 0, vendors: 0 });

  const fetchLocalCounts = async () => {
    try {
      const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") || "Guest" : "Guest";

      const customerDB = new Dexie(`CustomerDB_${userEmail}`);
      customerDB.version(1).stores({ customer_records: "++id" });

      const vendorDB = new Dexie(`VendorDB_${userEmail}`);
      vendorDB.version(1).stores({ vendor_records: "++id" });

      const customerCount = await customerDB.customer_records.count();
      const vendorCount = await vendorDB.vendor_records.count();

      setCounts({
        customers: customerCount || 0,
        vendors: vendorCount || 0
      });

    } catch (error) {
      console.error("Dashboard count error:", error);
    }
  };

  useEffect(() => {
    fetchLocalCounts();
    const interval = setInterval(fetchLocalCounts, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.dashboardCardsGrid}>
      <Card
        title="Total Customers"
        value={counts.customers}
        percent="Live"
        trend="up"
        icon="/images/community.png"
        href="/dashboard/customers" // Link path
      />

      <Card
        title="Total Vendors"
        value={counts.vendors}
        percent="Live"
        trend="up"
        icon="/images/productsBlue.png"
        href="/dashboard/vendors" // Link path
      />

      <Card
        title="Total Stocks"
        value="0"
        percent="0%"
        trend="down"
        icon="/images/order.png"
        href="/dashboard/stock" // Link path
      />

      <Card
        title="Total Inventories"
        value="0"
        percent="0%"
        trend="up"
        icon="/images/money.png"
        href="/dashboard/inventories" // Link path
      />
    </div>
  );
}