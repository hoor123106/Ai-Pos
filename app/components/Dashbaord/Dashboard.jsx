"use client";

import DashboardCards from "@/app/components/DashboardCards/DashbaordCards";
import styles from "./dashboard.module.css";


export default function Dashboard() {

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardHeading}>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your store today.</p>
      </div>

      <DashboardCards />


      {/* <div className={styles.chartGrid}>
        
        <div className={styles.chartCard}>
          <div className={styles.chartWrapper}>
            <h3 className={styles.chartHeading}>Sales Overview</h3>
            <SalesChart />
          </div>
        </div>


        <div className={styles.chartCard}>
          <div className={styles.chartWrapper}>
            <h3 className={styles.chartHeading}>Orders Overview</h3>
            <OrdersChart />
          </div>
        </div>
      </div> */}

      {/* Orders Panel */}
      {/* <OrdersPanel /> */}
    </div>
  );
}
