"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: "/images/dashboardIconDark.png", activeIcon: "/images/dashboard.png" },
    { name: "Vendors", href: "/dashboard/vendors", icon: "/images/point-of-sale-icon.png", activeIcon: "/images/point-of-saleWhite.png" },
    { name: "Customers", href: "/dashboard/customers", icon: "/images/customers-icon.png", activeIcon: "/images/communityWhite.png" },
    { name: "Quick Notes", href: "/dashboard/quicknotes", icon: "/images/customers-icon.png", activeIcon: "/images/communityWhite.png" },
    { name: "Inventories", href: "/dashboard/inventories", icon: "/images/customers-icon.png", activeIcon: "/images/communityWhite.png" },
    { name: "Stock", href: "/dashboard/stock", icon: "/images/point-of-sale-icon.png", activeIcon: "/images/point-of-saleWhite.png" },
    { name: "Settings", href: "/dashboard/setting-pos", icon: "/images/setting-icon.png", activeIcon: "/images/settingswhite.png" },
    { name: "Bills & Invoices", href: "/dashboard/bills", icon: "/images/setting-icon.png", activeIcon: "/images/settingswhite.png" },
        { name: "Reports", href: "/dashboard/reports", icon: "/images/setting-icon.png", activeIcon: "/images/settingswhite.png" },
  ];

  return (
    <aside className={styles.sidebar}>
      {links.map((link) => {
        const isActive = pathname === link.href;
        
        return (
          <Link 
            key={link.href} 
            href={link.href} 
            className={`${styles.navLink} ${isActive ? styles.active : ""}`}
          >
            <div className={styles.iconWrapper}>
              <Image
                src={isActive ? link.activeIcon : link.icon}
                alt={link.name}
                width={20}
                height={20}
                className={styles.sidebarIcon}
                priority
              />
            </div>
            <span className={isActive ? styles.activeText : ""}>
              {link.name}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}