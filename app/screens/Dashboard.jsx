import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const Dashboard = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <TouchableOpacity style={styles.profileButton}>
                    <Ionicons name="person-circle-outline" size={28} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceAmount}>$1,250.00</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="arrow-down" size={20} color="#fff" />
                            <Text style={styles.actionText}>Add Money</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="arrow-up" size={20} color="#fff" />
                            <Text style={styles.actionText}>Withdraw</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsContainer}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.quickActionItem}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons name="swap-horizontal" size={24} color="#5e72e4" />
                            </View>
                            <Text style={styles.quickActionText}>Transfer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionItem}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons name="card-outline" size={24} color="#5e72e4" />
                            </View>
                            <Text style={styles.quickActionText}>Pay Bills</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionItem}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons name="stats-chart" size={24} color="#5e72e4" />
                            </View>
                            <Text style={styles.quickActionText}>Investments</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.recentTransactions}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    
                    <View style={styles.transactionItem}>
                        <View style={styles.transactionIcon}>
                            <Ionicons name="cart-outline" size={24} color="#5e72e4" />
                        </View>
                        <View style={styles.transactionDetails}>
                            <Text style={styles.transactionName}>Shopping</Text>
                            <Text style={styles.transactionDate}>Today, 2:30 PM</Text>
                        </View>
                        <Text style={[styles.transactionAmount, styles.expense]}>-$45.00</Text>
                    </View>
                    
                    <View style={styles.transactionItem}>
                        <View style={styles.transactionIcon}>
                            <Ionicons name="wallet-outline" size={24} color="#5e72e4" />
                        </View>
                        <View style={styles.transactionDetails}>
                            <Text style={styles.transactionName}>Salary</Text>
                            <Text style={styles.transactionDate}>Jul 28, 2023</Text>
                        </View>
                        <Text style={[styles.transactionAmount, styles.income]}>+$1,200.00</Text>
                    </View>
                    
                    <View style={styles.transactionItem}>
                        <View style={styles.transactionIcon}>
                            <Ionicons name="fast-food-outline" size={24} color="#5e72e4" />
                        </View>
                        <View style={styles.transactionDetails}>
                            <Text style={styles.transactionName}>Restaurant</Text>
                            <Text style={styles.transactionDate}>Jul 27, 2023</Text>
                        </View>
                        <Text style={[styles.transactionAmount, styles.expense]}>-$32.50</Text>
                    </View>
                    
                    <TouchableOpacity style={styles.viewAllButton}>
                        <Text style={styles.viewAllText}>View All Transactions</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f9fc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    profileButton: {
        padding: 5,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    balanceCard: {
        backgroundColor: '#5e72e4',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    balanceLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    actionButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        marginLeft: 8,
    },
    quickActionsContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    quickActionItem: {
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f3ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionText: {
        color: '#333',
        fontSize: 12,
    },
    recentTransactions: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f3ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    transactionDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
    },
    expense: {
        color: '#ff5e5e',
    },
    income: {
        color: '#2ecc71',
    },
    viewAllButton: {
        alignItems: 'center',
        marginTop: 15,
        paddingVertical: 10,
    },
    viewAllText: {
        color: '#5e72e4',
        fontWeight: '600',
    },
});

export default Dashboard;