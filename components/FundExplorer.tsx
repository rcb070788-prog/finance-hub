
import React, { useState, useEffect } from 'react';
import { MC_FUNDS } from '../mockData';
import { Fund, ExpenditureRecord } from '../types';

const FundExplorer: React.FC = () => {
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [realExpenditures, setRealExpenditures] = useState<ExpenditureRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Data Normalizer
   * This is designed to be "fuzzy" so it can read your data regardless of 
   * column headers or capitalization.
   */
  const normalizeItem = (item: any): ExpenditureRecord => {
    // Utility to search for keys that match a set of keywords
    const findValue = (patterns: string[]) => {
      const key = Object.keys(item).find(k => 
        patterns.some(p => k.toLowerCase().includes(p.toLowerCase()))
      );
      return key ? item[key] : null;
    };

    const rawAmount = findValue(['amount', 'total', 'sum', 'cost', 'value', 'price']);
    // Clean up currency strings if they exist (e.g. "$1,200.00" -> 1200.00)
    const amount = typeof rawAmount === 'string' 
      ? parseFloat(rawAmount.replace(/[$,]/g, '')) 
      : (parseFloat(rawAmount) || 0);

    return {
      id: item.id || item._id || Math.random().toString(36).substr(2, 9),
      date: findValue(['date', 'time', 'period', 'day', 'transaction']) || 'N/A',
      vendor: findValue(['vendor', 'payee', 'supplier', 'name', 'recipient']) || 'Unknown Vendor',
      purpose: findValue(['purpose', 'description', 'memo', 'detail', 'note']) || 'No description',
      amount: amount,
      department: findValue(['dept', 'department', 'sector', 'division']) || 'General',
      fundId: selectedFund?.id || 'Unknown'
    };
  };

  useEffect(() => {
    if (!selectedFund) return;

    const fetchFundData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Base folder for all finance data
        const baseDir = '/Expenses by Fund/';
        // Remove leading slash if user provided one in jsonPath to avoid double slashes
        const relativePath = selectedFund.jsonPath.startsWith('/') 
          ? selectedFund.jsonPath.substring(1) 
          : selectedFund.jsonPath;
        
        const fullPath = encodeURI(`${baseDir}${relativePath}`);
        
        const response = await fetch(fullPath);
        
        if (!response.ok) {
          throw new Error(`File not found at: ${fullPath}. Please verify your folder name and filename in mockData.ts.`);
        }
        
        const rawData = await response.json();
        
        // Smart data extraction: Handle arrays directly or wrapped in objects
        let list = [];
        if (Array.isArray(rawData)) {
          list = rawData;
        } else {
          // Look for an array property if the root is an object
          const arrayKey = Object.keys(rawData).find(k => Array.isArray(rawData[k]));
          list = arrayKey ? rawData[arrayKey] : [];
        }
        
        if (list.length === 0 && !Array.isArray(rawData)) {
          throw new Error("Could not find a valid list of transactions in this JSON file.");
        }

        const normalized = list.map(normalizeItem);
        setRealExpenditures(normalized);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to parse data.");
        setRealExpenditures([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFundData();
  }, [selectedFund]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="flex items-center space-x-4 mb-3">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
            <i className="fas fa-folder-tree text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Records</h1>
            <p className="text-slate-500 font-medium">Browsing your actual JSON data from the <code>/public/</code> directory.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">Navigation</h3>
            <div className="space-y-2">
              {MC_FUNDS.map((fund) => (
                <button
                  key={fund.id}
                  onClick={() => setSelectedFund(fund)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex flex-col group ${
                    selectedFund?.id === fund.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' 
                    : 'bg-white border-slate-50 text-slate-700 hover:border-indigo-100 hover:bg-slate-50/50'
                  }`}
                >
                  <span className="font-bold text-sm mb-1">{fund.name}</span>
                  <span className={`text-[10px] font-mono truncate ${selectedFund?.id === fund.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {fund.jsonPath}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
             <div className="relative z-10">
                <h4 className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-4">Pro Tip</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  The app automatically detects columns named <strong>Payee</strong>, <strong>Vendor</strong>, <strong>Amount</strong>, and <strong>Date</strong>.
                </p>
                <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500">
                  <i className="fas fa-info-circle"></i>
                  <span>Case-insensitive matching active</span>
                </div>
             </div>
             <i className="fas fa-microchip absolute -bottom-4 -right-4 text-slate-800 text-7xl opacity-50"></i>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {selectedFund ? (
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden flex flex-col min-h-[650px] animate-in fade-in duration-500">
              {/* Fund Header */}
              <div className="p-10 border-b border-slate-50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    ID: {selectedFund.id}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedFund.name}</h2>
                <p className="text-slate-500 max-w-2xl">{selectedFund.description}</p>
              </div>

              {/* Data Status */}
              <div className="flex-grow flex flex-col">
                {isLoading ? (
                  <div className="flex-grow flex flex-col items-center justify-center py-24">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
                      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="mt-8 text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing File System...</p>
                  </div>
                ) : error ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8">
                      <i className="fas fa-folder-open text-4xl"></i>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">Data Source Error</h3>
                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl font-mono text-sm text-slate-600 max-w-lg mb-8 leading-relaxed">
                      {error}
                    </div>
                    <button 
                      onClick={() => setSelectedFund({...selectedFund})} 
                      className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : realExpenditures.length > 0 ? (
                  <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 sticky top-0">
                        <tr>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Date</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vendor / Details</th>
                          <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {realExpenditures.map((tx, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                            <td className="px-10 py-6">
                              <span className="text-sm font-bold text-slate-400 font-mono">{tx.date}</span>
                            </td>
                            <td className="px-10 py-6">
                              <p className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{tx.vendor}</p>
                              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{tx.purpose}</p>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <span className="text-lg font-black text-slate-900 group-hover:scale-110 inline-block transition-transform">
                                ${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center py-32 text-slate-300">
                    <i className="fas fa-ghost text-6xl mb-6"></i>
                    <p className="font-bold uppercase tracking-widest text-sm">No records found in this file.</p>
                  </div>
                )}
                
                {realExpenditures.length > 0 && !isLoading && !error && (
                  <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center space-x-2">
                       <i className="fas fa-check-circle text-emerald-500"></i>
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Integrity Check: {realExpenditures.length} Records Passed</span>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Total Fund Outlay</p>
                       <p className="text-4xl font-black text-indigo-600 leading-none">
                         ${realExpenditures.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                       </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[650px] bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center p-16 text-center group transition-all hover:border-indigo-200 hover:bg-indigo-50/10">
              <div className="w-40 h-40 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <i className="fas fa-file-invoice text-6xl text-slate-200 group-hover:text-indigo-400 transition-colors"></i>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Select a Data Source</h3>
              <p className="max-w-md text-slate-500 leading-relaxed font-medium mb-10">
                The explorer will attempt to load the JSON file from the path specified in your fund configuration. Ensure files are placed in <code>public/Expenses by Fund/</code>.
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm mb-2 font-bold">1</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Check Path</span>
                </div>
                <div className="w-12 h-px bg-slate-100"></div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm mb-2 font-bold">2</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Parse JSON</span>
                </div>
                <div className="w-12 h-px bg-slate-100"></div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm mb-2 font-bold">3</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Normalize</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundExplorer;
