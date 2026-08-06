'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface EnterpriseTableProps<T> {
  title?: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  actions?: React.ReactNode;
  pageSize?: number;
  mobileCardRender?: (item: T) => React.ReactNode;
}

export function EnterpriseTable<T extends { id?: string }>({
  title,
  subtitle,
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchFilter,
  actions,
  pageSize = 8,
  mobileCardRender,
}: EnterpriseTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Data
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    if (searchFilter) return data.filter((item) => searchFilter(item, searchQuery));

    return data.filter((item) =>
      Object.values(item as Record<string, unknown>).some(
        (val) => val && String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery, searchFilter]);

  // Paginate Data
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-5">
      {/* Top Header & Search Bar */}
      {(title || actions || searchFilter) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {title && (
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-poppins">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 dark:text-emerald-300/70">{subtitle}</p>}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-emerald-400/70" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            {actions}
          </div>
        </div>
      )}

      {/* Desktop Responsive Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-500/20">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-100 dark:bg-[#021810] z-10">
            <tr className="border-b border-slate-200 dark:border-emerald-500/20 text-slate-500 dark:text-emerald-300 font-extrabold uppercase tracking-wider text-[10px]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400 dark:text-emerald-300/60 font-medium space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-emerald-500/40" />
                  <p>No records found matching criteria.</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIdx) => (
                <motion.tr
                  key={item.id || rowIdx}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="hover:bg-slate-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                    >
                      {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey] ?? '') : null}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {paginatedData.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-emerald-300/60 font-medium">
            No records found.
          </div>
        ) : (
          paginatedData.map((item, rowIdx) =>
            mobileCardRender ? (
              <div key={item.id || rowIdx}>{mobileCardRender(item)}</div>
            ) : (
              <div
                key={item.id || rowIdx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-2 text-xs"
              >
                {columns.map((col, colIdx) => (
                  <div key={colIdx} className="flex justify-between items-center py-1">
                    <span className="font-extrabold text-slate-500 dark:text-emerald-400/80 uppercase text-[10px]">
                      {col.header}:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey] ?? '') : null}
                    </span>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-emerald-500/20 text-xs font-bold text-slate-600 dark:text-emerald-300">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 disabled:opacity-40 hover:bg-emerald-600 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 disabled:opacity-40 hover:bg-emerald-600 hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
