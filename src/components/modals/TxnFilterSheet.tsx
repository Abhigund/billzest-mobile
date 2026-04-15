import React from 'react';
import FilterSheet, { FilterSection, FilterValues } from './FilterSheet';

export interface TxnFilters {
  status: 'all' | 'paid' | 'overdue' | 'draft' | 'sent' | 'pending';
  type: 'all' | 'sale' | 'purchase';
}

interface TxnFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TxnFilters) => void;
  initialFilters?: TxnFilters;
}

const SECTIONS: FilterSection[] = [
  {
    key: 'status',
    title: 'Status',
    mode: 'single',
    options: [
      { id: 'all', label: 'All' },
      { id: 'paid', label: 'Paid' },
      { id: 'pending', label: 'Pending' },
      { id: 'overdue', label: 'Overdue' },
      { id: 'draft', label: 'Draft' },
      { id: 'sent', label: 'Sent' },
    ],
  },
  {
    key: 'type',
    title: 'Type',
    mode: 'single',
    options: [
      { id: 'all', label: 'All' },
      { id: 'sale', label: 'Sale' },
      { id: 'purchase', label: 'Purchase' },
    ],
  },
];

const TxnFilterSheet: React.FC<TxnFilterSheetProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const handleApply = (values: FilterValues) => {
    onApply({
      status: (values.status as TxnFilters['status']) ?? 'all',
      type: (values.type as TxnFilters['type']) ?? 'all',
    });
  };

  return (
    <FilterSheet
      visible={visible}
      onClose={onClose}
      title="Filter Transactions"
      sections={SECTIONS}
      initialValues={{
        status: initialFilters?.status ?? 'all',
        type: initialFilters?.type ?? 'all',
      }}
      onApply={handleApply}
    />
  );
};

export default TxnFilterSheet;
