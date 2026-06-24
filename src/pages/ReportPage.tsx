import { useMemo } from 'react';
import { FileBarChart2, TrendingUp, TrendingDown, Minus, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { ExcelData } from '@/types';

interface ReportPageProps {
  data: ExcelData;
  onExport: () => void;
  fileName: string;
}

export function ReportPage({ data, onExport, fileName }: ReportPageProps) {
  const stats = useMemo(() => {
    const statusColIndex = data.headers.findIndex(
      h => h.toLowerCase().includes('status') && !h.toLowerCase().includes('status_')
    );
    let completed = 0, inProgress = 0, failed = 0, other = 0;
    if (statusColIndex >= 0) {
      data.rows.forEach(row => {
        const val = String(row[statusColIndex] || '').toLowerCase().trim();
        if (val === 'compwork' || val === 'complete' || val === 'done' || val === 'finished') completed++;
        else if (val === 'canclwork' || val === 'cancel' || val === 'failed' || val === 'workfail') failed++;
        else if (val === 'booked' || val === 'pending' || val === 'in_progress' || val === '') inProgress++;
        else other++;
      });
    }
    const total = data.totalRows;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
    const failRate = total > 0 ? ((failed / total) * 100).toFixed(1) : '0';
    return { completed, inProgress, failed, other, total, completionRate, failRate };
  }, [data]);

  const statusBarData = [
    { name: 'Completed', value: stats.completed, fill: '#10B981' },
    { name: 'In Progress', value: stats.inProgress, fill: '#F59E0B' },
    { name: 'Failed', value: stats.failed, fill: '#EF4444' },
    { name: 'Other', value: stats.other, fill: '#8B5CF6' },
  ].filter(d => d.value > 0);

  // Simulate daily trend from data (group by index buckets)
  const trendData = useMemo(() => {
    const bucketCount = 7;
    const bucketSize = Math.ceil(data.rows.length / bucketCount);
    return Array.from({ length: bucketCount }, (_, i) => {
      const start = i * bucketSize;
      const end = Math.min(start + bucketSize, data.rows.length);
      const bucket = data.rows.slice(start, end);
      const statusColIndex = data.headers.findIndex(h => h.toLowerCase().includes('status') && !h.toLowerCase().includes('status_'));
      let done = 0, fail = 0;
      if (statusColIndex >= 0) {
        bucket.forEach(row => {
          const val = String(row[statusColIndex] || '').toLowerCase().trim();
          if (val === 'compwork' || val === 'complete' || val === 'done') done++;
          else if (val === 'canclwork' || val === 'cancel' || val === 'failed') fail++;
        });
      }
      return { label: `Batch ${i + 1}`, Completed: done, Failed: fail };
    });
  }, [data]);

  const metrics = [
    { label: 'Total Records', value: stats.total.toLocaleString(), icon: FileBarChart2, color: 'from-indigo-500 to-violet-600', trend: null },
    { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'from-emerald-400 to-teal-600', trend: 'up' },
    { label: 'Failure Rate', value: `${stats.failRate}%`, icon: TrendingDown, color: 'from-rose-400 to-red-600', trend: 'down' },
    { label: 'Pending', value: stats.inProgress.toLocaleString(), icon: Minus, color: 'from-amber-400 to-orange-500', trend: null },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-violet-500" />
            Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Laporan ringkasan data fulfillment</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-[12px] text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName}
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="glass premium-shadow rounded-2xl p-5 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground font-medium">{m.label}</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">{m.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass premium-shadow rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-1">Distribusi Status</h2>
          <p className="text-xs text-muted-foreground mb-4">Jumlah data per status</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusBarData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
              <Bar dataKey="value" name="Jumlah" radius={[6, 6, 0, 0]}>
                {statusBarData.map((entry, idx) => (
                  <rect key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass premium-shadow rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-1">Tren Penyelesaian</h2>
          <p className="text-xs text-muted-foreground mb-4">Completed vs Failed per batch data</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
              <Line type="monotone" dataKey="Completed" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Failed" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
