
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MC_BUDGET_DATA, RECENT_EXPENDITURES } from '../mockData';

const FinanceCharts: React.FC = () => {
  const formatCurrency = (val: number) => `$${(val / 1000000).toFixed(1)}M`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-700">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fiscal Year 2024 Budget Overview</h1>
        <p className="mt-2 text-slate-600">Explore how your tax dollars are being allocated across Montgomery County.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Budget Distribution Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-slate-800 text-lg">Departmental Allocation</h2>
            <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-1 rounded">DATA SOURCE: MOCKDATA.TS</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MC_BUDGET_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatCurrency} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Budget']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {MC_BUDGET_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h2 className="font-bold text-slate-800 text-lg mb-4">Budget Breakdown</h2>
          <div className="flex-grow space-y-4">
            {MC_BUDGET_DATA.map((cat) => (
              <div key={cat.name} className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(cat.value / 108000000) * 100}%`, backgroundColor: cat.color }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center text-slate-900">
              <span className="font-bold">Total Annual Budget</span>
              <span className="text-xl font-black text-blue-600">$108.0M</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Feed */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Large Expenditures</h2>
            <p className="text-sm text-slate-500">Live feed of transactions exceeding $1,000.</p>
          </div>
          <button className="text-blue-600 text-sm font-semibold hover:underline">View All Transactions &rarr;</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RECENT_EXPENDITURES.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-600">{tx.date}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{tx.vendor}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 uppercase">
                      {tx.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">{tx.purpose}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                    ${tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default FinanceCharts;
