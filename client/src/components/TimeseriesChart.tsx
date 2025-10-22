import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { motion } from "framer-motion";

interface TimeseriesChartProps {
  title: string;
  data: {
    time: string[];
    series: {
      name: string;
      data: number[];
      color: string;
    }[];
  };
}

export default function TimeseriesChart({ title, data }: TimeseriesChartProps) {
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
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "15%",
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
        },
        backgroundColor: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.9)",
        borderColor: isDark ? "#333" : "#ddd",
        textStyle: {
          color: isDark ? "#fff" : "#000",
        },
      },
      legend: {
        data: data.series.map((s) => s.name),
        textStyle: {
          color: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
        },
        top: 0,
      },
      xAxis: {
        type: "category",
        data: data.time,
        axisLine: {
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          },
        },
        axisLabel: {
          color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
        },
      },
      yAxis: {
        type: "value",
        axisLine: {
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          },
        },
        axisLabel: {
          color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
        },
        splitLine: {
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          },
        },
      },
      series: data.series.map((s, index) => ({
        name: s.name,
        type: "line",
        smooth: true,
        data: s.data,
        itemStyle: {
          color: s.color,
        },
        lineStyle: {
          width: 2,
        },
        areaStyle: {
          opacity: 0.1,
        },
        animationDelay: index * 100,
      })),
    };

    chartInstance.current.setOption(option);
  }, [data, isDark]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="bg-card border border-card-border rounded-lg p-6"
      data-testid="timeseries-chart"
    >
      <h3 className="text-base font-semibold text-foreground mb-4">{title}</h3>
      <div ref={chartRef} className="w-full h-80" />
    </motion.div>
  );
}
