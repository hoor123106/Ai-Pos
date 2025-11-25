"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname(); // current route

  const links = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "/images/dashboardIconDark.png",
      cls: styles.dashboard,
      activeIcon: "/images/dashboard.png",
    },
    {
      name: "Point of Sale",
      href: "/dashboard/point-of-sale",
      icon: "/images/point-of-sale-icon.png",
      cls: styles.pointOfSale,
      activeIcon: "/images/point-of-saleWhite.png",
    },
    {
      name: "Products",
      href: "/dashboard/products",
      icon: "/images/products-icon.png",
      cls: styles.products,
      activeIcon: "/images/ProductsWhite.png",
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: "/images/orders-icon.png",
      cls: styles.orders,
      activeIcon: "/images/OrderWhite.png",
    },
    {
      name: "Customers",
      href: "/dashboard/customers",
      icon: "/images/customers-icon.png",
      cls: styles.customers,
      activeIcon: "/images/communityWhite.png",
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: "/images/analytics-icon.png",
      cls: styles.analytics,
      activeIcon: "/images/analyticsWhite.png",
    },
    {
      name: "Setting",
      href: "/dashboard/setting-pos",
      icon: "/images/setting-icon.png",
      cls: styles.setting,
      activeIcon: "/images/dashboardIconWhite.png",
    },
  ];

  return (
    <div className={styles.sidebar}>
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <div
            key={link.href}
            className={`${link.cls} ${isActive ? styles.active : ""}`}
          >
            <Image
              src={isActive ? link.activeIcon : link.icon}
              alt={link.name}
              width={18}
              height={18}
            />
            <Link
              href={link.href}
              className={isActive ? styles.activeText : ""}
            >
              {link.name}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
