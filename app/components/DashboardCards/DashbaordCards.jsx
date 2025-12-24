"use client";

import React, { useState, useEffect } from "react";
import styles from "./dashboardCards.module.css";
// Sahi path check karlein apne folders ke mutabiq
import { supabase } from "../../utils/supabase/client"; 

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

  // --- Real-time Data Fetch from Supabase ---
  const fetchCounts = async () => {
    try {
      // Customers ka count database se
      const { count: customerCount, error: custErr } = await supabase
        .from("customer_records")
        .select("*", { count: 'exact', head: true });

      // Vendors ka count database se
      const { count: vendorCount, error: vendErr } = await supabase
        .from("vendor_records")
        .select("*", { count: 'exact', head: true });

      if (!custErr && !vendErr) {
        setCounts({
          customers: customerCount || 0,
          vendors: vendorCount || 0
        });
      }
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  useEffect(() => {
    fetchCounts();

    // (Optional) Agar aap chahte hain ke page refresh kiye baghair update ho:
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div className={styles.dashboardCardsGrid}>
      <Card
        title="Total Customers"
        value={counts.customers}
        percent="Live"
        trend="up"
        icon="/images/community.png"
      />

      <Card
        title="Total Vendors"
        value={counts.vendors}
        percent="Live"
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