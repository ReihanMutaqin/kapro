import { useMemo, useState } from 'react';
import { FileBarChart2, TrendingUp, TrendingDown, Minus, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import type { ExcelData } from '@/types';
import { useTableData } from '@/hooks/useTableData';
import { DataTable } from '@/sections/DataTable';
import { FieldPanel } from '@/sections/FieldPanel';

interface ReportPageProps {
  data: ExcelData;
  onExport: () => void;
  fileName: string;
}

export function ReportPage({ data, onExport, fileName }: ReportPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFieldPanel, setShowFieldPanel] = useState(false);

  const stats = useMemo(() => {
    const statusColIndex = data.headers.findIndex(
      h => String(h).toLowerCase().includes('status') && !String(h).toLowerCase().includes('status_')
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
      const statusColIndex = data.headers.findIndex(h => String(h).toLowerCase().includes('status') && !String(h).toLowerCase().includes('status_'));
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

  const filteredData = useMemo(() => {
    if (!selectedCategory) return null;
    const statusColIndex = data.headers.findIndex(
      h => String(h).toLowerCase().includes('status') && !String(h).toLowerCase().includes('status_')
    );
    if (statusColIndex < 0) return null;

    const rows = data.rows.filter(row => {
      const val = String(row[statusColIndex] || '').toLowerCase().trim();
      let cat = 'Other';
      if (val === 'compwork' || val === 'complete' || val === 'done' || val === 'finished') cat = 'Completed';
      else if (val === 'canclwork' || val === 'cancel' || val === 'failed' || val === 'workfail') cat = 'Failed';
      else if (val === 'booked' || val === 'pending' || val === 'in_progress' || val === '') cat = 'In Progress';
      return cat === selectedCategory;
    });

    return {
      headers: data.headers,
      rows,
      fileName: `${data.fileName} - ${selectedCategory}`,
      totalRows: rows.length
    } as ExcelData;
  }, [data, selectedCategory]);

  const {
    searchQuery,
    setSearchQuery,
    sortConfig,
    toggleSort,
    expandedRow,
    expandRow,
    columnConfigs,
    visibleColumns,
    processedRows,
    toggleColumnVisibility,
    exportToCSV,
  } = useTableData(filteredData);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            <FileBarChart2 className="w-6 h-6 text-orange-500" />
            Report
          </h1>
          <p className="text-sm text-orange-400/80 mt-1">Laporan ringkasan data fulfillment</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-[12px] text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName}
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 shadow-md shadow-orange-200 transition-all duration-200"
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
          <p className="text-xs text-muted-foreground mb-4">Klik pada batang diagram untuk melihat data spesifik</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusBarData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
              <Bar 
                dataKey="value" 
                name="Jumlah" 
                radius={[6, 6, 0, 0]}
                onClick={(data) => setSelectedCategory(prev => prev === data.name ? null : data.name)}
              >
                {statusBarData.map((entry, idx) => (
                  <Cell 
                    key={idx} 
                    fill={entry.fill} 
                    className="cursor-pointer transition-all duration-300 hover:brightness-110" 
                    opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1}
                  />
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

      {/* Drill-down Table */}
      {selectedCategory && filteredData && (
        <div className="flex flex-col h-[500px] glass premium-shadow rounded-2xl overflow-hidden mt-2 animate-in slide-in-from-top-4 duration-300">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white/50">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusBarData.find(d => d.name === selectedCategory)?.fill }}></span>
                Detail Data: {selectedCategory}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Menampilkan {filteredData.rows.length.toLocaleString()} baris data terkait</p>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-medium px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Tutup Tabel
            </button>
          </div>
          <div className="flex flex-1 min-h-0 relative">
            <DataTable
              data={filteredData}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortConfig={sortConfig}
              onSort={toggleSort}
              expandedRow={expandedRow}
              onExpandRow={expandRow}
              visibleColumns={visibleColumns}
              processedRows={processedRows}
              onTogglePanel={() => setShowFieldPanel(prev => !prev)}
              onExport={exportToCSV}
              fileName={filteredData.fileName}
            />
            {showFieldPanel && (
              <div className="w-[280px] flex-shrink-0 h-full border-l border-border bg-white absolute right-0 top-0 bottom-0 shadow-xl z-20">
                <FieldPanel
                  columns={columnConfigs}
                  onToggleColumn={toggleColumnVisibility}
                  onClose={() => setShowFieldPanel(false)}
                  hiddenCount={columnConfigs.filter(c => !c.visible).length}
                  totalCount={columnConfigs.length}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
