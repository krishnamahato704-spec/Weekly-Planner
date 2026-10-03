import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items, className = '' }) => {
  if (!items || items.length <= 1) return null;

  const currentItem = items[items.length - 1];
  const parentItem = items[items.length - 2];

  return (
    <nav aria-label="Breadcrumb context" className={`min-w-0 ${className}`}>
      {/* Mobile Breadcrumb: Compact Back Action (P2.3) */}
      <div className="flex md:hidden items-center justify-between gap-2 py-1 min-w-0">
        {parentItem?.onClick ? (
          <button
            type="button"
            onClick={parentItem.onClick}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-300 py-1 px-1.5 -ml-1.5 rounded-lg transition-colors min-h-[44px]"
            aria-label={`Back to ${parentItem.label}`}
          >
            <ArrowLeft aria-hidden="true" className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="truncate max-w-[180px]">{parentItem.label}</span>
          </button>
        ) : (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
            {parentItem?.label}
          </span>
        )}

        <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
          {currentItem.label}
        </span>
      </div>

      {/* Desktop / Tablet Breadcrumbs: Full Clickable Trail */}
      <ol className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5 min-w-0">
              {idx > 0 && (
                <ChevronRight aria-hidden="true" className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
              )}
              {isLast || !item.onClick ? (
                <span
                  className={`truncate max-w-[200px] ${
                    isLast
                      ? 'font-bold text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors truncate max-w-[180px] py-0.5 px-1 rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
