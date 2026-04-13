"use client";

import { BarChart3, Users, Megaphone, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { DataTable } from "@/components/shared/data-table";
export default function DashboardPage() {
  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      label: "Total Leads",
      value: "1,234",
      change: { percentage: 12, isPositive: true },
    },
    {
      icon: <Megaphone className="w-6 h-6" />,
      label: "Active Campaigns",
      value: "8",
      change: { percentage: 3, isPositive: true },
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: "Conversion Rate",
      value: "25.3%",
      change: { percentage: 5, isPositive: true },
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      label: "Revenue",
      value: "$12,500",
      change: { percentage: 8, isPositive: true },
    },
  ];

  const recentLeads = [
    { id: 1, name: "Jean Dupont", email: "jean@example.com", status: "Qualified", sector: "Pisciniste" },
    { id: 2, name: "Marie Martin", email: "marie@example.com", status: "In Progress", sector: "Solaire" },
    { id: 3, name: "Pierre Bernard", email: "pierre@example.com", status: "Contacted", sector: "Paysagiste" },
    { id: 4, name: "Sophie Laurent", email: "sophie@example.com", status: "Qualified", sector: "General" },
    { id: 5, name: "Luc Moreau", email: "luc@example.com", status: "New", sector: "Pisciniste" },
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "sector", label: "Sector" },
    {
      key: "status",
      label: "Status",
      render: (status: string) => {
        const colors = {
          Qualified: "bg-green-900/20 text-green-400",
          "In Progress": "bg-blue-900/20 text-blue-400",
          Contacted: "bg-yellow-900/20 text-yellow-400",
          New: "bg-slate-800 text-slate-300",
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors]}`}>
            {status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatsCard key={idx} {...stat} />
        ))}
      </div>

      {/* Recent Leads Table */}
      <DataTable columns={columns} data={recentLeads} emptyMessage="No leads yet" />
    </div>
  );
}
