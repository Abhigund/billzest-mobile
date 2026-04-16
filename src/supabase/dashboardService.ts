import { supabase } from './supabaseClient';
import { expensesService } from './expensesService';
import { toAppError } from '../utils/appError';
import { logger } from '../utils/logger';

export type DashboardKpis = {
  todaySales: number;
  totalSales: number;
  totalPurchases: number;
  inventoryValue: number;
  totalExpenses: number;
};

const formatDateForQuery = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateRange = (
  range: 'Today' | 'Week' | 'Month' | 'Year',
): { start: string; end: string } => {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case 'Today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'Week':
      start.setDate(end.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'Month':
      start.setMonth(end.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'Year':
      start.setFullYear(end.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  end.setHours(23, 59, 59, 999);

  return {
    start: formatDateForQuery(start),
    end: formatDateForQuery(end),
  };
};

export const dashboardService = {
  async getKpis(
    orgId: string,
    dateRange: 'Today' | 'Week' | 'Month' | 'Year' = 'Today',
  ): Promise<DashboardKpis> {
    const { start: dateStart, end: dateEnd } = getDateRange(dateRange);
    const todayStart = formatDateForQuery(
      new Date(new Date().setHours(0, 0, 0, 0)),
    );
    const todayEnd = formatDateForQuery(
      new Date(new Date().setHours(23, 59, 59, 999)),
    );

    const [
      ordersAll,
      ordersToday,
      ordersInRange,
      purchasesInRange,
      products,
      totalExpenses,
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('total_amount')
        .eq('organization_id', orgId)
        .eq('is_cancelled', false),
      supabase
        .from('orders')
        .select('total_amount')
        .eq('organization_id', orgId)
        .eq('is_cancelled', false)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),
      supabase
        .from('orders')
        .select('total_amount')
        .eq('organization_id', orgId)
        .eq('is_cancelled', false)
        .gte('created_at', dateStart)
        .lte('created_at', dateEnd),
      supabase
        .from('purchase_orders')
        .select('total_amount')
        .eq('organization_id', orgId)
        .gte('order_date', dateStart)
        .lte('order_date', dateEnd),
      supabase
        .from('products')
        .select('purchase_price, stock_quantity')
        .eq('organization_id', orgId)
        .is('deleted_at', null),
      expensesService.getTotalExpenses(orgId, {
        startDate: dateStart,
        endDate: dateEnd,
      }),
    ] as const);

    const ordersAllError = (ordersAll as any).error;
    const ordersTodayError = (ordersToday as any).error;
    const ordersRangeError = (ordersInRange as any).error;
    const purchasesRangeError = (purchasesInRange as any).error;
    const productsError = (products as any).error;

    if (
      ordersAllError ||
      ordersTodayError ||
      ordersRangeError ||
      purchasesRangeError ||
      productsError
    ) {
      logger.error('[Dashboard] KPI query errors', {
        ordersAllError,
        ordersTodayError,
        ordersRangeError,
        purchasesRangeError,
        productsError,
      });
      throw toAppError(
        'dashboard.kpis',
        ordersAllError ||
          ordersTodayError ||
          ordersRangeError ||
          purchasesRangeError ||
          productsError,
        'Unable to load dashboard metrics.',
      );
    }

    const allOrders = ((ordersAll as any).data ?? []) as {
      total_amount: number;
    }[];
    const todayOrders = ((ordersToday as any).data ?? []) as {
      total_amount: number;
    }[];
    const rangeOrders = ((ordersInRange as any).data ?? []) as {
      total_amount: number;
    }[];
    const purchaseRows = ((purchasesInRange as any).data ?? []) as {
      total_amount: number;
    }[];
    const productRows = ((products as any).data ?? []) as {
      purchase_price: number;
      stock_quantity: number;
    }[];

    const totalSales = allOrders.reduce(
      (sum, r) => sum + (r.total_amount ?? 0),
      0,
    );
    const todaySales = todayOrders.reduce(
      (sum, r) => sum + (r.total_amount ?? 0),
      0,
    );
    const rangeSales = rangeOrders.reduce(
      (sum, r) => sum + (r.total_amount ?? 0),
      0,
    );
    const totalPurchases = purchaseRows.reduce(
      (sum, r) => sum + (r.total_amount ?? 0),
      0,
    );
    const inventoryValue = productRows.reduce(
      (sum, r) => sum + (r.purchase_price ?? 0) * (r.stock_quantity ?? 0),
      0,
    );

    return {
      todaySales: dateRange === 'Today' ? todaySales : rangeSales,
      totalSales,
      totalPurchases,
      inventoryValue,
      totalExpenses,
    };
  },
};
