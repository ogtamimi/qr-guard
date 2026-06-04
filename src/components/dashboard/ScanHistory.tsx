/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, History, Trash2, ArrowRight, Shield, ShieldAlert, ShieldX, Globe } from 'lucide-react';
import { ScanResult, ScanStatus } from '../../types';

interface ScanHistoryProps {
  scans: ScanResult[];
  onSelectScan: (scan: ScanResult) => void;
  onClearScan: (id: string) => void;
}

export default function ScanHistory({ scans, onSelectScan, onClearScan }: ScanHistoryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ScanStatus | 'ALL'>('ALL');

  // Search and filter scanning results
  const filteredScans = scans.filter((scan) => {
    const matchesSearch = scan.url.toLowerCase().includes(search.toLowerCase()) ||
                          scan.finalDomain.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' ? true : scan.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: ScanStatus) => {
    switch (status) {
      case 'SAFE':
        return <Shield className="h-4 w-4 text-emerald-500" />;
      case 'SUSPICIOUS':
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case 'DANGEROUS':
        return <ShieldX className="h-4 w-4 text-red-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBadgeClass = (status: ScanStatus) => {
    switch (status) {
      case 'SAFE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'SUSPICIOUS':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'DANGEROUS':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-150';
    }
  };

  const decodeStatusEn = (status: ScanStatus) => {
    switch (status) {
      case 'SAFE': return 'Safe';
      case 'SUSPICIOUS': return 'Suspicious';
      case 'DANGEROUS': return 'Dangerous';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-slate-500" />
          <h3 id="history-hdr" className="text-sm font-black text-slate-800">Recent Scan History</h3>
        </div>
        <span className="text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
          {filteredScans.length} records found
        </span>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search by domain or link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1">
          <button
            id="filter-all"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-[10.5px] font-bold rounded-xl border transition-colors shrink-0 ${
              filter === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            id="filter-safe"
            onClick={() => setFilter('SAFE')}
            className={`px-3 py-1.5 text-[10.5px] font-bold rounded-xl border transition-colors shrink-0 ${
              filter === 'SAFE'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-600 border-slate-200 hover:bg-emerald-50'
            }`}
          >
            Safe
          </button>
          <button
            id="filter-suspicious"
            onClick={() => setFilter('SUSPICIOUS')}
            className={`px-3 py-1.5 text-[10.5px] font-bold rounded-xl border transition-colors shrink-0 ${
              filter === 'SUSPICIOUS'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-600 border-slate-200 hover:bg-amber-50'
            }`}
          >
            Suspicious
          </button>
          <button
            id="filter-dangerous"
            onClick={() => setFilter('DANGEROUS')}
            className={`px-3 py-1.5 text-[10.5px] font-bold rounded-xl border transition-colors shrink-0 ${
              filter === 'DANGEROUS'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-red-600 border-slate-200 hover:bg-red-50'
            }`}
          >
            Dangerous
          </button>
        </div>
      </div>

      {/* List content */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 pr-1">
        {filteredScans.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Globe className="h-10 w-10 mx-auto mb-2 opacity-25" />
            <p className="text-xs">No scans match your query.</p>
          </div>
        ) : (
          filteredScans.map((scan) => (
            <div
              key={scan.id}
              className="group flex items-center justify-between py-3 hover:bg-slate-50/50 rounded-xl px-2 transition-colors cursor-pointer"
              onClick={() => onSelectScan(scan)}
            >
              <div className="flex items-center gap-3 min-w-0 pl-1 mr-2">
                {/* Visual Circle Status Indicator */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-bold text-xs shrink-0 ${getBadgeClass(scan.status)}`}>
                  {getStatusIcon(scan.status)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 font-mono truncate max-w-[140px] sm:max-w-xs">{scan.finalDomain}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${getBadgeClass(scan.status)}`}>
                      {decodeStatusEn(scan.status)} ({scan.riskScore}%)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px] sm:max-w-md mt-0.5">
                    {scan.url}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-slate-400 font-mono group-hover:hidden hidden sm:inline mr-1">
                  {new Date(scan.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                
                <button
                  id={`del-history-${scan.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearScan(scan.id);
                  }}
                  className="p-1.5 text-slate-450 hover:text-red-500 rounded-lg hover:bg-red-50/80 transition-colors"
                  title="Remove from history"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <button
                  id={`inspect-${scan.id}`}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded animate-none"
                  title="Inspect"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
