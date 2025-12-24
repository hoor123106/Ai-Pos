"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "/images/dashboardIconDark.png",
      activeIcon: "/images/dashboard.png",
      cls: styles.dashboard,
    },
    {
      name: "vendors",
      href: "/dashboard/vendors",
      icon: "/images/point-of-sale-icon.png",
      activeIcon: "/images/point-of-saleWhite.png",
      cls: styles.pointOfSale,
    },
 

    {
      name: "Customers",
      href: "/dashboard/customers",
      icon: "/images/customers-icon.png",
      activeIcon: "/images/communityWhite.png",
      cls: styles.customers,
    },
      {
      name: "Settings",
      href: "/dashboard/setting-pos",
      icon: "/images/setting-icon.png",
      activeIcon: "/images/settingswhite.png",
      cls: styles.customers,
    },
 
    // {
    //   name: "Inventory",
    //   href: "/dashboard/inventory",
    //   icon: "/images/customers-icon.png",
    //   activeIcon: "/images/communityWhite.png",
    //   cls: styles.customers,
    // },
    // {
    //   name: "Setting",
    //   href: "/dashboard/setting-pos",
    //   // icon: "/images/setting-icon.png",
    //   // activeIcon: "/images/analyticsWhite.png",
    //   cls: styles.setting,
    // },
  ];

  return (
    <aside className={styles.sidebar}>
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
            <Link href={link.href} className={isActive ? styles.activeText : ""}>
              {link.name}
            </Link>
          </div>
        );
      })}
    </aside>
  );
}
