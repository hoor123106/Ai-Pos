import React from "react";
import styles from "./orderPanel.module.css";

export default function OrdersPanel() {
  const orders = [
    { id: "#ORD-001", customer: "John Doe", amount: "$234.00", status: "completed", time: "2 min ago" },
    { id: "#ORD-002", customer: "Jane Smith", amount: "$567.00", status: "pending", time: "5 min ago" },
    { id: "#ORD-003", customer: "Bob Johnson", amount: "$123.00", status: "completed", time: "10 min ago" },
    { id: "#ORD-004", customer: "Alice Brown", amount: "$890.00", status: "processing", time: "15 min ago" },
    { id: "#ORD-005", customer: "Charlie Wilson", amount: "$456.00", status: "completed", time: "20 min ago" },
  ];

  const products = [
    { name: "Wireless Headphones", sold: 245, price: "$12,250" },
    { name: "Smart Watch", sold: 189, price: "$18,900" },
    { name: "Laptop Stand", sold: 156, price: "$4,680" },
    { name: "USB-C Cable", sold: 432, price: "$8,640" },
  ];

  return (
    <div className={styles.wrapper}>
      {/* Recent Orders */}
      <div className={styles.card}>
        <h3 className={styles.heading}>Recent Orders</h3>

        <div className={styles.table}>
          <div className={styles.rowHeader}>
            <span>Order ID</span>
            <span>Customer</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Time</span>
          </div>

          {orders.map((order) => (
            <div className={styles.row} key={order.id}>
              <span>{order.id}</span>
              <span>{order.customer}</span>
              <span>{order.amount}</span>
              <span className={`${styles.status} ${styles[order.status]}`}>
                {order.status}
              </span>
              <span className={styles.time}>{order.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className={styles.card}>
        <h3 className={styles.heading}>Top Products</h3>

        <div className={styles.products}>
          {products.map((product) => (
            <div className={styles.productRow} key={product.name}>
              <div>
                <p className={styles.productName}>{product.name}</p>
                <span className={styles.sold}>{product.sold} sold</span>
              </div>
              <span className={styles.price}>{product.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
