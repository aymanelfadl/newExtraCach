import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { transactionService } from '../../services';
import { colors, typography, shadows, spacing, borderRadius } from '../../styles/theme';
import { useUser } from '../../context/UserContext';
import { LineChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';

const Dashboard = () => {
    const { isOnline } = useUser();
    const [refreshing, setRefreshing] = useState(false);
    const [showStartDate, setShowStartDate] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);
    const [dateFilterModalVisible, setDateFilterModalVisible] = useState(false);
    
    // Calculate default date ranges
    const getCurrentMonthDates = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { startDate: firstDay, endDate: lastDay };
    };

    const getLastMonthDates = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        return { startDate: firstDay, endDate: lastDay };
    };

    // Initialize with current month's date range
    const [dateRange, setDateRange] = useState(getCurrentMonthDates());

    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        categories: {
            income: [],
            expenses: []
        },
        trend: {
            labels: [],
            income: [],
            expenses: []
        },
        cashFlow: {
            positive: 0,
            negative: 0
        }
    });

    const onStartDateChange = (event, selectedDate) => {
        setShowStartDate(false);
        if (selectedDate) {
            setDateRange(prev => ({
                ...prev,
                startDate: selectedDate
            }));
            
            setTimeout(() => loadDashboardData(), 100);
        }
    };

    const onEndDateChange = (event, selectedDate) => {
        setShowEndDate(false);
        if (selectedDate) {
            setDateRange(prev => ({
                ...prev,
                endDate: selectedDate
            }));
            // Reload data with new date range
            setTimeout(() => loadDashboardData(), 100);
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };


    const parseDate = (dateString) => {
        if (!dateString) return null;
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        // Create date (month is 0-indexed in JS Date)
        return new Date(parts[2], parts[1] - 1, parts[0]);
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric'
        });
    };

    const handleDateRangeReset = () => {
        setDateRange(getCurrentMonthDates());
        setTimeout(() => loadDashboardData(), 100);
        setDateFilterModalVisible(false);
    };

    const handleLastMonth = () => {
        setDateRange(getLastMonthDates());
        setTimeout(() => loadDashboardData(), 100);
        setDateFilterModalVisible(false);
    };

    const loadDashboardData = async () => {
        try {
            setRefreshing(true);

            const transactionResult = await transactionService.getTransactions();

            if (transactionResult.success) {
                const transactions = transactionResult.transactions || [];

                // Filter transactions by date range
                const filteredTransactions = transactions.filter(transaction => {
                    const transactionDate = new Date(transaction.createdAt || transaction.date);
                    return transactionDate >= dateRange.startDate &&
                        transactionDate <= dateRange.endDate;
                });

                let totalIncome = 0;
                let totalExpenses = 0;
                let positiveFlow = 0;
                let negativeFlow = 0;

                const incomeCategories = {};
                const expenseCategories = {};

                const trendLabels = [];
                const trendIncome = [];
                const trendExpenses = [];

                // Generate trend intervals based on the date range
                const dateRangeDays = Math.ceil((dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24)) + 1;
                let intervalCount = Math.min(6, dateRangeDays); // Use fewer intervals for shorter periods
                let intervalDays = Math.max(1, Math.ceil(dateRangeDays / intervalCount));
                
                // Reset trendIncome and trendExpenses arrays with zeros
                for (let i = 0; i < intervalCount; i++) {
                    trendIncome.push(0);
                    trendExpenses.push(0);
                }

                for (let i = 0; i < intervalCount; i++) {
                    const intervalDate = new Date(dateRange.startDate);
                    intervalDate.setDate(dateRange.startDate.getDate() + (i * intervalDays));

                    if (dateRangeDays > 180) { // More than 6 months
                        trendLabels.push(intervalDate.toLocaleDateString('fr-FR', { month: 'short' }));
                    } else if (dateRangeDays > 30) { // More than a month
                        trendLabels.push(intervalDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
                    } else {
                        trendLabels.push(intervalDate.toLocaleDateString('fr-FR', { day: '2-digit' }));
                    }
                }

                filteredTransactions.forEach(transaction => {
                    // Ensure amount is a number
                    const amount = Number(transaction.amount || transaction.spends || 0);
                    if (isNaN(amount) || amount <= 0) return; // Skip invalid amounts
                    
                    const category = transaction.category || 'Other';
                    const transactionDate = new Date(transaction.createdAt || transaction.date);

                    // Calculate which interval this transaction belongs to
                    const daysSinceStart = Math.floor((transactionDate - dateRange.startDate) / (1000 * 60 * 60 * 24));
                    const intervalIndex = Math.min(Math.floor(daysSinceStart / intervalDays), intervalCount - 1);

                    // Check if the transaction is a revenue or expense
                    const isRevenue = transaction.type === 'revenue' || transaction.isExpense === false;
                    
                    if (isRevenue) {
                        totalIncome += amount;
                        positiveFlow += amount;
                        incomeCategories[category] = (incomeCategories[category] || 0) + amount;
                        if (intervalIndex >= 0 && intervalIndex < trendIncome.length) {
                            trendIncome[intervalIndex] += amount;
                        }
                    } else {
                        totalExpenses += amount;
                        negativeFlow += amount;
                        expenseCategories[category] = (expenseCategories[category] || 0) + amount;
                        if (intervalIndex >= 0 && intervalIndex < trendExpenses.length) {
                            trendExpenses[intervalIndex] += amount;
                        }
                    }
                });

                const incomeCategList = Object.entries(incomeCategories).map(([name, value]) => ({
                    name,
                    value,
                    percentage: Math.round((value / (totalIncome || 1)) * 100)
                })).sort((a, b) => b.value - a.value);

                const expenseCategList = Object.entries(expenseCategories).map(([name, value]) => ({
                    name,
                    value,
                    percentage: Math.round((value / (totalExpenses || 1)) * 100)
                })).sort((a, b) => b.value - a.value);

                setSummary({
                    totalIncome,
                    totalExpenses,
                    balance: totalIncome - totalExpenses,
                    categories: {
                        income: incomeCategList.slice(0, 3),
                        expenses: expenseCategList.slice(0, 3)
                    },
                    trend: {
                        labels: trendLabels,
                        income: trendIncome,
                        expenses: trendExpenses
                    },
                    cashFlow: {
                        positive: positiveFlow,
                        negative: negativeFlow
                    }
                });
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const getCurrentPeriodLabel = () => {
        return formatMonthYear(dateRange.startDate) === formatMonthYear(dateRange.endDate)
            ? formatMonthYear(dateRange.startDate)
            : `${formatMonthYear(dateRange.startDate)} - ${formatMonthYear(dateRange.endDate)}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tableau de bord</Text>
                <TouchableOpacity 
                    style={styles.periodBadge}
                    onPress={() => setDateFilterModalVisible(true)}
                >
                    <Icon name="calendar-month" size={18} color={colors.primary} />
                    <Text style={styles.periodBadgeText}>{getCurrentPeriodLabel()}</Text>
                </TouchableOpacity>
            </View>

            {!isOnline && (
                <View style={styles.offlineBar}>
                    <Icon name="cloud-off-outline" size={16} color={colors.white} />
                    <Text style={styles.offlineText}>Mode hors ligne</Text>
                </View>
            )}

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={loadDashboardData}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Updated Financial Overview Cards */}
                <View style={styles.financialCardsContainer}>
                    <View style={[
                        styles.financialCard, 
                        summary.balance >= 0 ? styles.balancePositiveCard : styles.balanceNegativeCard
                    ]}>
                        <View style={styles.financialCardIconContainer}>
                            <Icon name="bank" size={32} color={colors.white} />
                        </View>
                        <Text style={styles.financialCardLabel}>Solde</Text>
                        <Text style={styles.financialCardValue}>
                            {summary.balance >= 0 ? '+' : ''}{summary.balance.toFixed(2)} MAD
                        </Text>
                    </View>
                    
                    <View style={styles.cardSeparator} />
                    
                    <View style={[styles.financialCard, styles.incomeCard]}>
                        <View style={styles.financialCardIconContainer}>
                            <Icon name="cash-plus" size={32} color={colors.white} />
                        </View>
                        <Text style={styles.financialCardLabel}>Total Revenus</Text>
                        <Text style={styles.financialCardValue}>
                            +{summary.totalIncome.toFixed(2)} MAD
                        </Text>
                    </View>
                    
                    <View style={[styles.financialCard, styles.expenseCard]}>
                        <View style={styles.financialCardIconContainer}>
                            <Icon name="cash-minus" size={32} color={colors.white} />
                        </View>
                        <Text style={styles.financialCardLabel}>Total Dépenses</Text>
                        <Text style={styles.financialCardValue}>
                            -{summary.totalExpenses.toFixed(2)} MAD
                        </Text>
                    </View>
                </View>

                {/* Cash Flow Visualization */}
                <View style={styles.cashFlowCard}>
                    <Text style={styles.sectionTitle}>Flux de trésorerie</Text>
                    <View style={styles.cashFlowMeter}>
                        <View style={styles.cashFlowBar}>
                            {(summary.cashFlow.positive > 0 || summary.cashFlow.negative > 0) ? (
                                <>
                                    <View
                                        style={[
                                            styles.cashFlowBarFill,
                                            styles.cashFlowBarPositive,
                                            {
                                                flex: summary.cashFlow.positive /
                                                    (summary.cashFlow.positive + summary.cashFlow.negative || 1)
                                            }
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.cashFlowBarFill,
                                            styles.cashFlowBarNegative,
                                            {
                                                flex: summary.cashFlow.negative /
                                                    (summary.cashFlow.positive + summary.cashFlow.negative || 1)
                                            }
                                        ]}
                                    />
                                </>
                            ) : (
                                <View style={[styles.cashFlowBarFill, styles.cashFlowBarEmpty]} />
                            )}
                        </View>
                        <View style={styles.cashFlowLabels}>
                            <View style={styles.cashFlowLabel}>
                                <Text style={styles.cashFlowLabelText}>Entrées</Text>
                                <Text style={[styles.cashFlowValue, styles.income]}>
                                    +{summary.cashFlow.positive.toFixed(2)} MAD
                                </Text>
                            </View>
                            <View style={styles.cashFlowLabel}>
                                <Text style={styles.cashFlowLabelText}>Sorties</Text>
                                <Text style={[styles.cashFlowValue, styles.expense]}>
                                    -{summary.cashFlow.negative.toFixed(2)} MAD
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
            
            {/* Date Filter Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={dateFilterModalVisible}
                onRequestClose={() => setDateFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filtrer par date</Text>
                            <TouchableOpacity onPress={() => setDateFilterModalVisible(false)}>
                                <Icon name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.modalBody}>
                            <View style={styles.dateFilterOptions}>
                                <TouchableOpacity 
                                    style={styles.dateFilterButton}
                                    onPress={handleDateRangeReset}
                                >
                                    <Icon name="calendar-month" size={24} color={colors.primary} />
                                    <Text style={styles.dateFilterButtonText}>Mois actuel</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={styles.dateFilterButton}
                                    onPress={handleLastMonth}
                                >
                                    <Icon name="calendar-arrow-left" size={24} color={colors.primary} />
                                    <Text style={styles.dateFilterButtonText}>Mois dernier</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <Text style={styles.dateFilterLabel}>Période personnalisée</Text>
                            <View style={styles.customDateContainer}>
                                <TouchableOpacity
                                    style={styles.dateSelector}
                                    onPress={() => setShowStartDate(true)}
                                >
                                    <Text style={styles.dateSelectorLabel}>Du:</Text>
                                    <Text style={styles.dateSelectorValue}>
                                        {formatDate(dateRange.startDate)}
                                    </Text>
                                    <Icon name="calendar" size={20} color={colors.primary} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.dateSelector}
                                    onPress={() => setShowEndDate(true)}
                                >
                                    <Text style={styles.dateSelectorLabel}>Au:</Text>
                                    <Text style={styles.dateSelectorValue}>
                                        {formatDate(dateRange.endDate)}
                                    </Text>
                                    <Icon name="calendar" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                            
                            {showStartDate && (
                                <DateTimePicker
                                    value={dateRange.startDate}
                                    mode="date"
                                    display="default"
                                    onChange={onStartDateChange}
                                    maximumDate={dateRange.endDate}
                                />
                            )}
                            {showEndDate && (
                                <DateTimePicker
                                    value={dateRange.endDate}
                                    mode="date"
                                    display="default"
                                    onChange={onEndDateChange}
                                    minimumDate={dateRange.startDate}
                                    maximumDate={new Date()}
                                />
                            )}
                            
                            <TouchableOpacity 
                                style={styles.applyButton}
                                onPress={() => setDateFilterModalVisible(false)}
                            >
                                <Text style={styles.applyButtonText}>Appliquer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        paddingBottom: spacing.extraLarge * 2,
    },
    offlineBar: {
        backgroundColor: colors.warning,
        padding: spacing.small,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    offlineText: {
        color: colors.white,
        marginLeft: spacing.small,
        fontWeight: '200',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop:spacing.large,
        paddingHorizontal: spacing.medium,
        paddingVertical: spacing.medium,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    headerTitle: {
        fontSize: typography.sizeXLarge,
        fontWeight: typography.weightBold,
        color: colors.primary,
    },
    periodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.primary}15`,
        paddingHorizontal: spacing.small,
        paddingVertical: spacing.tiny,
        borderRadius: borderRadius.medium,
    },
    periodBadgeText: {
        fontSize: typography.sizeSmall,
        color: colors.primary,
        marginLeft: spacing.tiny,
        fontWeight: typography.weightMedium,
    },
    content: {
        flex: 1,
        padding: spacing.medium,
    },
    financialCardsContainer: {
        marginBottom: spacing.medium,
    },
    financialCard: {
        borderRadius: borderRadius.large,
        padding: spacing.medium,
        marginBottom: spacing.small,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.medium,
    },
    financialCardIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.medium,
    },
    incomeCard: {
        backgroundColor: colors.income,
    },
    expenseCard: {
        backgroundColor: colors.expense,
    },
    balancePositiveCard: {
        backgroundColor: colors.primary,
    },
    balanceNegativeCard: {
        backgroundColor: colors.expense,
    },
    financialCardLabel: {
        fontSize: typography.sizeMedium,
        color: colors.white,
        fontWeight: typography.weightMedium,
        opacity: 0.9,
        flex: 1,
    },
    financialCardValue: {
        fontSize: typography.sizeXLarge,
        fontWeight: typography.weightBold,
        color: colors.white,
    },
    chartCard: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.large,
        padding: spacing.medium,
        marginBottom: spacing.medium,
        ...shadows.small,
    },
    chart: {
        marginTop: spacing.medium,
        borderRadius: borderRadius.medium,
    },
    cashFlowCard: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.large,
        padding: spacing.medium,
        marginBottom: spacing.medium,
        ...shadows.small,
    },
    cashFlowMeter: {
        marginTop: spacing.medium,
    },
    cashFlowBar: {
        height: 20,
        backgroundColor: colors.backgroundLight,
        borderRadius: 10,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    cashFlowBarFill: {
        height: '100%',
    },
    cashFlowBarPositive: {
        backgroundColor: colors.income,
    },
    cashFlowBarNegative: {
        backgroundColor: colors.expense,
    },
    cashFlowBarEmpty: {
        flex: 1,
        backgroundColor: colors.divider,
    },
    cashFlowLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.small,
    },
    cashFlowLabel: {
        alignItems: 'center',
    },
    cashFlowLabelText: {
        fontSize: typography.sizeSmall,
        color: colors.textSecondary,
    },
    cashFlowValue: {
        fontSize: typography.sizeRegular,
        fontWeight: typography.weightSemiBold,
    },
    sectionTitle: {
        fontSize: typography.sizeLarge,
        fontWeight: typography.weightBold,
        marginBottom: spacing.medium,
        color: colors.textPrimary,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        padding: spacing.medium,
    },
    expense: {
        color: colors.expense,
    },
    income: {
        color: colors.income,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: colors.card,
        borderRadius: borderRadius.large,
        padding: 0,
        ...shadows.medium,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        padding: spacing.medium,
    },
    modalTitle: {
        fontSize: typography.sizeLarge,
        fontWeight: typography.weightBold,
        color: colors.textPrimary,
    },
    modalBody: {
        padding: spacing.medium,
    },
    dateFilterOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.medium,
    },
    dateFilterButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.medium,
        padding: spacing.medium,
        marginHorizontal: spacing.xsmall,
    },
    dateFilterButtonText: {
        fontSize: typography.sizeRegular,
        color: colors.primary,
        marginLeft: spacing.small,
        fontWeight: typography.weightMedium,
    },
    dateFilterLabel: {
        fontSize: typography.sizeMedium,
        fontWeight: typography.weightSemiBold,
        color: colors.textPrimary,
        marginBottom: spacing.small,
        marginTop: spacing.small,
    },
    customDateContainer: {
        marginBottom: spacing.medium,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.small,
        padding: spacing.small,
        marginBottom: spacing.small,
    },
    dateSelectorLabel: {
        fontSize: typography.sizeSmall,
        color: colors.textSecondary,
        marginRight: spacing.small,
        width: 30,
    },
    dateSelectorValue: {
        flex: 1,
        fontSize: typography.sizeRegular,
        color: colors.textPrimary,
        fontWeight: typography.weightMedium,
    },
    applyButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.medium,
        padding: spacing.medium,
        alignItems: 'center',
        marginTop: spacing.small,
    },
    applyButtonText: {
        color: colors.white,
        fontWeight: typography.weightBold,
        fontSize: typography.sizeMedium,
    },
    cardSeparator: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: spacing.small,
    },
});

export default Dashboard;
