"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: { date: string; value: number }[];
}

export default function Sparkline({ data }: SparklineProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <Area
          type="monotone"
          dataKey="value"
          stroke="currentColor"
          fill="currentColor"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
