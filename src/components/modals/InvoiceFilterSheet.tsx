import React from 'react';
import FilterSheet, { FilterSection, FilterValues } from './FilterSheet';

export type InvoiceFilters = {
  status?: string;
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  clientId?: string;
};

type InvoiceFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: InvoiceFilters) => void;
  initialFilters?: InvoiceFilters;
};

const SECTIONS: FilterSection[] = [
  {
    key: 'status',
    title: 'Status',
    mode: 'single',
    options: [
      { id: 'all', label: 'All Statuses' },
      { id: 'draft', label: 'Draft' },
      { id: 'sent', label: 'Sent' },
      { id: 'paid', label: 'Paid' },
      { id: 'overdue', label: 'Overdue' },
      { id: 'cancelled', label: 'Cancelled' },
    ],
  },
  {
    key: 'dateRange',
    title: 'Date Range',
    mode: 'single',
    options: [
      { id: 'all', label: 'All Time' },
      { id: 'today', label: 'Today' },
      { id: 'week', label: 'This Week' },
      { id: 'month', label: 'This Month' },
      { id: 'year', label: 'This Year' },
    ],
  },
];

const toFilterValues = (filters?: InvoiceFilters): FilterValues => ({
  status: filters?.status ?? 'all',
  dateRange: filters?.dateRange ?? 'all',
});

const InvoiceFilterSheet: React.FC<InvoiceFilterSheetProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const handleApply = (values: FilterValues) => {
    onApply({
      status: values.status === 'all' ? undefined : (values.status as string),
      dateRange:
        values.dateRange === 'all'
          ? undefined
          : (values.dateRange as InvoiceFilters['dateRange']),
    });
  };

  return (
    <FilterSheet
      visible={visible}
      onClose={onClose}
      title="Filter Invoices"
      sections={SECTIONS}
      initialValues={toFilterValues(initialFilters)}
      onApply={handleApply}
    />
  );
};

export default InvoiceFilterSheet;
