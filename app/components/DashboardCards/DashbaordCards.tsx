import styles from "./dashboardCards.module.css";

type CardProps = {
  title: string;
  value: string;
  percent: string;
  icon: string;
  trend: "up" | "down";
};

const Card = ({ title, value, percent, icon, trend }: CardProps) => {
  return (
    <div className={styles.dashboardCard}>
      <div className={styles.dashboardcardTop}>
        <div className={styles.iconBox}>
          <img src={icon} alt={title} className={styles.iconImage} />
        </div>

        <span
          className={`${styles.percent} ${
            trend === "up" ? styles.up : styles.down
          }`}
        >
          {/* Replace arrow with image */}
          <img
            src={
              trend === "up"
                ? "/images/highVolume.png"
                : "/images/downVolume.png"
            }
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
  return (
    <div className={styles.dashboardCardsGrid}>
      <Card
        title="Total Revenue"
        value="$45,231.89"
        percent="20.1%"
        trend="up"
        icon="/images/money.png"
      />

      <Card
        title="Total Orders"
        value="2,345"
        percent="15.3%"
        trend="up"
        icon="/images/productsBlue.png"
      />

      <Card
        title="Total Customers"
        value="1,234"
        percent="8.2%"
        trend="up"
        icon="/images/community.png"
      />

      <Card
        title="Products Sold"
        value="5,678"
        percent="2.4%"
        trend="down"
        icon="/images/order.png"
      />
    </div>
  );
}
