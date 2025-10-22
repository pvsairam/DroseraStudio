import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { motion } from "framer-motion";

interface DonutChartProps {
  title: string;
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

export default function DonutChart({ title, data }: DonutChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  // Initialize isDark based on current theme
  const [isDark, setIsDark] = useState(() => 
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  // Helper function to resolve CSS variables to actual colors
  const getCSSVariable = (varName: string) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (value.includes(' ')) {
      // Convert HSL format from "0 0% 100%" to "hsl(0, 0%, 100%)"
      const [h, s, l] = value.split(' ');
      return `hsl(${h}, ${s}, ${l})`;
    }
    return value;
  };

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Initialize chart instance once
  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  // Update chart when data or theme changes
  useEffect(() => {
    if (!chartInstance.current) return;

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
        backgroundColor: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.9)",
        borderColor: isDark ? "#333" : "#ddd",
        textStyle: {
          color: isDark ? "#fff" : "#000",
        },
      },
      legend: {
        orient: "vertical",
        left: "70%",
        top: "center",
        textStyle: {
          color: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
          fontSize: 11,
        },
        itemGap: 8,
        itemWidth: 10,
        itemHeight: 10,
        padding: [0, 10, 0, 0],
      },
      series: [
        {
          type: "pie",
          radius: ["38%", "62%"],
          center: ["32%", "50%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'outside',
          },
          labelLine: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: "bold",
              color: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
            },
          },
          data: data.map((item, index) => ({
            ...item,
            itemStyle: {
              color: item.color,
            },
            animationDelay: index * 100,
          })),
        },
      ],
    };

    chartInstance.current.setOption(option);
  }, [data, isDark]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
      className="bg-card border border-card-border rounded-lg p-6"
      data-testid="donut-chart"
    >
      <h3 className="text-base font-semibold text-foreground mb-4">{title}</h3>
      <div ref={chartRef} className="w-full h-72" />
    </motion.div>
  );
}
