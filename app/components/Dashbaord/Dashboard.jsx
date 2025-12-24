"use client";

import DashboardCards from "@/app/components/DashboardCards/DashbaordCards";
import SalesChart from "@/app/components/SalesChart/SalesChart";
import OrdersChart from "@/app/components/OrdersChart/OrdersChart";
import OrdersPanel from "@/app/components/OrdersPanel/OrdersPanel";
import styles from "./dashboard.module.css";


export default function Dashboard() {

return (
    <div className={styles.dashboardContainer}>
      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardHeading}>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Dashboard Cards */}
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
