import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: {
    percentage: number;
    isPositive: boolean;
  };
}

export function StatsCard({ icon, label, value, change }: StatsCardProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800 hover:border-blue-600/50 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {label}
        </CardTitle>
        <div className="text-blue-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold">{value}</div>
          {change && (
            <div
              className={`text-xs font-semibold flex items-center ${
                change.isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {change.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(change.percentage)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
