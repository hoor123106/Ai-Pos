"use client";

import React, { useState, useEffect } from "react";
import styles from "./dashboardCards.module.css";
import Dexie from "dexie";

// Dono Databases ko yahan access karenge
const customerDB = new Dexie("CustomerDB");
customerDB.version(1).stores({ customer_records: "++id" });

const vendorDB = new Dexie("VendorDB");
vendorDB.version(2).stores({ vendor_records: "++id" });

const Card = ({ title, value, percent, icon, trend }) => {
  return (
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
  );
};

export default function DashboardCards() {
  const [counts, setCounts] = useState({ customers: 0, vendors: 0 });

  const fetchLocalCounts = async () => {
    try {
      // Local Dexie DB se counts nikalna
      const customerCount = await customerDB.customer_records.count();
      const vendorCount = await vendorDB.vendor_records.count();

      setCounts({
        customers: customerCount || 0,
        vendors: vendorCount || 0
      });
    } catch (error) {
      console.error("Error fetching local counts:", error);
    }
  };

  useEffect(() => {
    // Pehli baar load hone par count uthao
    fetchLocalCounts();

    // Har 2 second baad check karega agar koi naya data add hua ho (Auto-refresh)
    const interval = setInterval(fetchLocalCounts, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.dashboardCardsGrid}>
      <Card
        title="Total Customers"
        value={counts.customers}
        percent="Local"
        trend="up"
        icon="/images/community.png"
      />

      <Card
        title="Total Vendors"
        value={counts.vendors}
        percent="Local"
        trend="up"
        icon="/images/productsBlue.png"
      />

      <Card
        title="Total Stocks"
        value="0"
        percent="0%"
        trend="down"
        icon="/images/order.png"
      />

      <Card
        title="Total Inventories"
        value="0"
        percent="0%"
        trend="up"
        icon="/images/money.png"
      />
    </div>
  );
}