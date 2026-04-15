import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useThemeTokens } from '../../theme/ThemeProvider';
import { ThemeTokens } from '../../theme/tokens';
import ScreenWrapper from '../../components/ScreenWrapper';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  FileText,
  Share2,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../supabase/reportsService';
import { reportsExportService } from '../../services/reportsExportService';
import { useOrganization } from '../../contexts/OrganizationContext';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/EmptyState';

const createBarStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    barContainer: {
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: '100%',
      width: 20,
      gap: 8,
    },
    bar: {
      width: 8,
      borderRadius: 4,
    },
    barLabel: {
      fontSize: 10,
      color: tokens.mutedForeground,
      fontWeight: '600',
    },
  });

const BarItem = ({ height, index, tokens }: { height: number; index: number; tokens: ThemeTokens }) => {
  const animatedHeight = useSharedValue(0);
  const barStyles = React.useMemo(() => createBarStyles(tokens), [tokens]);

  React.useEffect(() => {
    animatedHeight.value = withDelay(index * 100, withTiming(height, { duration: 1000 }));
  }, [height, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: `${animatedHeight.value}%`,
  }));

  return (
    <View style={barStyles.barContainer}>
      <Animated.View
        style={[
          barStyles.bar,
          { backgroundColor: tokens.primary },
          animatedStyle,
        ]}
      />
      <Text style={barStyles.barLabel}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
      </Text>
    </View>
  );
};

const ReportsScreen: React.FC = () => {
  const { tokens } = useThemeTokens();
  const styles = createStyles(tokens);
  const { organizationId } = useOrganization();

  const [dateRange, setDateRange] = useState<'Week' | 'Month' | 'Year'>('Week');

  // Fetch real KPIs data
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['reports', 'kpis', dateRange],
    queryFn: () => reportsService.getKpis(organizationId || '', dateRange),
    enabled: !!organizationId,
  });

  // Fetch weekly trend data
  const { data: trendData = [0, 0, 0, 0, 0, 0, 0], isLoading: trendLoading } =
    useQuery({
      queryKey: ['reports', 'trend', 'week'],
      queryFn: () => reportsService.getWeeklyTrend(organizationId || ''),
      enabled: !!organizationId,
    });

  const hasKpiData = !!kpis;
  const displayKpis = kpis ?? { sales: 0, profit: 0, expenses: 0 };

  const handleExportPDF = useCallback(async () => {
    if (!kpis || !trendData) {
      Alert.alert(
        'Error',
        'Report data not available. Please wait for it to load.',
      );
      return;
    }

    try {
      await reportsExportService.shareReportAsPDF(
        displayKpis,
        trendData,
        dateRange,
      );
    } catch (error: unknown) {
      const { logger } = await import('../../utils/logger');
      logger.error('Failed to export PDF report:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to export report. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  }, [kpis, trendData, displayKpis, dateRange]);

  const handleExportCSV = useCallback(async () => {
    if (!kpis || !trendData) {
      Alert.alert(
        'Error',
        'Report data not available. Please wait for it to load.',
      );
      return;
    }

    try {
      await reportsExportService.shareReportAsCSV(
        displayKpis,
        trendData,
        dateRange,
      );
    } catch (error: unknown) {
      const { logger } = await import('../../utils/logger');
      logger.error('Failed to export CSV report:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to export report. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  }, [kpis, trendData, displayKpis, dateRange]);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Date Filter Header */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Reports</Text>
          <View style={styles.headerActions}>
            <View style={styles.filterContainer}>
              {(['Week', 'Month', 'Year'] as const).map(range => (
                <Pressable
                  key={range}
                  style={[
                    styles.filterPill,
                    dateRange === range && styles.activeFilterPill,
                  ]}
                  onPress={() => setDateRange(range)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      dateRange === range && styles.activeFilterText,
                    ]}
                  >
                    {range}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.exportButton} onPress={handleExportPDF}>
              <Share2 size={18} color={tokens.primary} />
            </Pressable>
          </View>
        </View>

        {/* Export Buttons */}
        <View style={styles.exportContainer}>
          <Button
            label="Export as PDF"
            variant="secondary"
            onPress={handleExportPDF}
            icon={<FileText size={18} color={tokens.foreground} />}
            style={styles.exportButtonItem}
          />
          <Button
            label="Export as CSV"
            variant="secondary"
            onPress={handleExportCSV}
            icon={<Download size={18} color={tokens.foreground} />}
            style={styles.exportButtonItem}
          />
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          {kpisLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tokens.primary} />
            </View>
          ) : !hasKpiData ? (
            <EmptyState
              icon={<TrendingUp size={28} color={tokens.mutedForeground} />}
              title="No report data"
              description="Data will appear once you have recorded sales."
            />
          ) : (
            <>
              <View
                style={[
                  styles.kpiCard,
                  { backgroundColor: tokens.primaryAlpha20 },
                ]}
              >
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>Total Sales</Text>
                  <DollarSign size={16} color={tokens.success} />
                </View>
                <Text style={[styles.kpiValue, { color: tokens.success }]}>
                  ₹{displayKpis.sales.toLocaleString('en-IN')}
                </Text>
              </View>

              <View
                style={[
                  styles.kpiCard,
                  { backgroundColor: tokens.infoAlpha15 },
                ]}
              >
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>Profit</Text>
                  <TrendingUp size={16} color={tokens.info} />
                </View>
                <Text style={[styles.kpiValue, { color: tokens.info }]}>
                  ₹{displayKpis.profit.toLocaleString('en-IN')}
                </Text>
              </View>

              <View
                style={[
                  styles.kpiCard,
                  { backgroundColor: tokens.destructiveAlpha20 },
                ]}
              >
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>Expense</Text>
                  <TrendingDown size={16} color={tokens.destructive} />
                </View>
                <Text style={[styles.kpiValue, { color: tokens.destructive }]}>
                  ₹{displayKpis.expenses.toLocaleString('en-IN')}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Weekly Trend Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weekly Trend</Text>
            <Calendar size={18} color={tokens.mutedForeground} />
          </View>

          <View style={styles.chartArea}>
            {trendLoading ? (
              <ActivityIndicator size="small" color={tokens.primary} />
            ) : (
              trendData.map((height, index) => (
                <BarItem key={index} height={height} index={index} tokens={tokens} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const createStyles = (tokens: ThemeTokens) =>
  StyleSheet.create({
    content: {
      padding: 20,
      paddingBottom: 100,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    exportButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: tokens.card,
      borderWidth: 1,
      borderColor: tokens.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    exportContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    exportButtonItem: {
      flex: 1,
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: tokens.foreground,
    },
    filterContainer: {
      flexDirection: 'row',
      backgroundColor: tokens.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 4,
    },
    filterPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    activeFilterPill: {
      backgroundColor: tokens.primary,
    },
    filterText: {
      fontSize: 12,
      fontWeight: '600',
      color: tokens.mutedForeground,
    },
    activeFilterText: {
      color: tokens.primaryForeground,
    },
    kpiContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 24,
    },
    kpiCard: {
      flex: 1,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'transparent', // Can change to tokens.border if needed
    },
    kpiHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    kpiLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: tokens.mutedForeground,
    },
    kpiValue: {
      fontSize: 16,
      fontWeight: '800',
    },
    chartCard: {
      backgroundColor: tokens.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: 20,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: tokens.foreground,
    },
    chartArea: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 150,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      paddingBottom: 8,
    },
    barContainer: {
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: '100%',
      width: 20,
      gap: 8,
    },
    bar: {
      width: 8,
      borderRadius: 4,
    },
    barLabel: {
      fontSize: 10,
      color: tokens.mutedForeground,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
  });

export default ReportsScreen;
