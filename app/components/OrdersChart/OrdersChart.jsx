"use client";

import React from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function OrdersChart() {
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Orders",
        data: [220, 180, 270, 170, 330, 420, 360],
        backgroundColor: "#ff8a3d",
        borderRadius: 6,
      },
    ],
  };

  const options = {

    responsive: true,
    layout: {
      padding: { left: 20, right: 20, top: 10, bottom: 30 },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { maxTicksLimit: 4, font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      x: {
        ticks: { font: { size: 12 }, maxRotation: 0, minRotation: 0 },
        grid: { display: false },
      },
    },
  };

  return <Bar key={Math.random()} data={data} options={options} />;

}
