import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  Linking,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatters';
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../../styles/theme';
import { transactionService } from '../../services/index';
import Header from '../../components/Header';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const ArchivedTransactions = () => {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadArchivedTransactions();
  }, []);

  const loadArchivedTransactions = async () => {
    try {
      setLoading(true);
      const result = await transactionService.getArchivedTransactions();
      
      if (result.success) {
        setTransactions(result.transactions);
      } else if (result.requiresIndex && result.indexUrl) {
        // Handle Firebase index error
        Alert.alert(
          "Configuration requise",
          "Une configuration Firebase supplémentaire est nécessaire pour consulter les archives. Veuillez cliquer sur 'Créer Index' et attendre quelques minutes que l'index soit créé avant de réessayer.",
          [
            {
              text: "Créer Index",
              onPress: async () => {
                const supported = await Linking.canOpenURL(result.indexUrl);
                if (supported) {
                  await Linking.openURL(result.indexUrl);
                } else {
                  Alert.alert("Erreur", "Impossible d'ouvrir le lien. Veuillez contacter le support technique.");
                }
              }
            },
            {
              text: "Retour",
              style: "cancel",
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert("Erreur", result.error || "Une erreur s'est produite lors de la récupération des archives.");
      }
    } catch (error) {
      console.error("Error loading archived transactions:", error);
      Alert.alert("Erreur", "Une erreur s'est produite lors de la récupération des archives.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadArchivedTransactions();
  };

  const handleManualArchive = async () => {
    try {
      // Ask user if they want to archive transactions older than 3 months or select a custom date
      Alert.alert(
        "Archiver des transactions",
        "Voulez-vous archiver les transactions datant de plus de 3 mois, vérifier les transactions disponibles, ou créer une transaction de test?",
        [
          {
            text: "Plus de 3 mois",
            onPress: async () => {
              setLoading(true);
              // Calculate date 3 months ago
              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
              await archiveOlderThan(threeMonthsAgo);
              setLoading(false);
            }
          },
          {
            text: "Plus de 1 mois",
            onPress: async () => {
              setLoading(true);
              // Calculate date 1 month ago
              const oneMonthAgo = new Date();
              oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
              await archiveOlderThan(oneMonthAgo);
              setLoading(false);
            }
          },
          {
            text: "Toutes les transactions",
            onPress: async () => {
              setLoading(true);
              // Archive all transactions (using a date in the future)
              const currentDate = new Date();
              await archiveOlderThan(currentDate);
              setLoading(false);
            }
          },
          {
            text: "Vérifier transactions",
            onPress: async () => {
              setLoading(true);
              await debugTransactions();
              setLoading(false);
            }
          },
          {
            text: "Créer transaction test",
            onPress: async () => {
              setLoading(true);
              await createTestTransaction();
              setLoading(false);
            }
          },
          {
            text: "Annuler",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      console.error("Error manually archiving transactions:", error);
      Alert.alert("Erreur", "Une erreur inattendue s'est produite lors de l'archivage manuel.");
      setLoading(false);
    }
  };

  const archiveOlderThan = async (date) => {
    try {      
      // Call archive service
      const result = await transactionService.archiveTransactions(date);
      
      if (result.success) {
        Alert.alert(
          "Archivage réussi", 
          result.message || `${result.archivedCount} transactions ont été archivées.`,
          [
            { 
              text: "OK", 
              onPress: () => loadArchivedTransactions() 
            }
          ]
        );
      } else if (result.requiresIndex && result.indexUrl) {
        // Handle Firebase index error
        Alert.alert(
          "Configuration requise",
          "Une configuration Firebase supplémentaire est nécessaire pour l'archivage. Veuillez cliquer sur 'Créer Index' et attendre quelques minutes que l'index soit créé avant de réessayer.",
          [
            {
              text: "Créer Index",
              onPress: async () => {
                const supported = await Linking.canOpenURL(result.indexUrl);
                if (supported) {
                  await Linking.openURL(result.indexUrl);
                } else {
                  Alert.alert("Erreur", "Impossible d'ouvrir le lien. Veuillez contacter le support technique.");
                }
              }
            },
            { text: "Annuler", style: "cancel" }
          ]
        );
      } else {
        Alert.alert("Erreur", result.error || "Une erreur s'est produite lors de l'archivage des transactions.");
      }
    } catch (error) {
      console.error("Error archiving transactions:", error);
      Alert.alert("Erreur", "Une erreur inattendue s'est produite lors de l'archivage.");
    }
  };

  const debugTransactions = async () => {
    try {
      // Get all transactions
      const result = await transactionService.getTransactions();
      
      if (result.success) {
        const transactions = result.transactions;
        const transactionCount = transactions.length;
        
        if (transactionCount === 0) {
          Alert.alert("Information", "Aucune transaction n'a été trouvée dans votre compte. Veuillez d'abord ajouter des transactions avant de pouvoir les archiver.");
          return;
        }
        
        // Get oldest and newest dates
        let oldest = new Date();
        let newest = new Date(0); // Start with earliest possible date
        
        transactions.forEach(transaction => {
          const transactionDate = new Date(transaction.createdAt);
          if (transactionDate < oldest) {
            oldest = transactionDate;
          }
          if (transactionDate > newest) {
            newest = transactionDate;
          }
        });
        
        // Format for display
        const oldestStr = formatDate(oldest);
        const newestStr = formatDate(newest);
        
        // Count transactions by type
        const expenses = transactions.filter(t => t.type === 'expense').length;
        const revenues = transactions.filter(t => t.type === 'revenue').length;
        
        Alert.alert(
          "Informations sur les transactions",
          `Nombre total de transactions: ${transactionCount}\n\n` +
          `Dépenses: ${expenses}\n` +
          `Revenus: ${revenues}\n\n` +
          `Transaction la plus ancienne: ${oldestStr}\n` +
          `Transaction la plus récente: ${newestStr}\n\n` +
          `Note: Pour archiver des transactions, elles doivent avoir une date de création (createdAt) antérieure à la date d'archivage.`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Erreur", "Impossible de récupérer les transactions: " + (result.error || "Erreur inconnue"));
      }
    } catch (error) {
      console.error("Error debugging transactions:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la récupération des informations: " + error.message);
    }
  };

  const createTestTransaction = async () => {
    try {
      // Create a transaction with a date 4 months ago
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      
      const testTransaction = {
        type: 'expense',
        amount: '100',
        description: 'Transaction test pour archivage',
        category: 'Test',
        date: format(fourMonthsAgo, 'dd/MM/yyyy', { locale: fr }),
        createdAt: fourMonthsAgo.toISOString(), // Important: set an old date for createdAt
      };
      
      const result = await transactionService.addTransaction(testTransaction);
      
      if (result.success) {
        Alert.alert(
          "Transaction créée", 
          "Une transaction de test avec une date d'il y a 4 mois a été créée. Vous pouvez maintenant essayer de l'archiver.",
          [
            { 
              text: "Archiver maintenant", 
              onPress: async () => {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                await archiveOlderThan(threeMonthsAgo);
              } 
            },
            { text: "Plus tard" }
          ]
        );
      } else {
        Alert.alert("Erreur", "Impossible de créer la transaction de test: " + (result.error || "Erreur inconnue"));
      }
    } catch (error) {
      console.error("Error creating test transaction:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la création de la transaction de test: " + error.message);
    }
  };

  const handleExportArchived = async () => {
    try {
      if (transactions.length === 0) {
        Alert.alert("Aucune donnée", "Il n'y a pas de transactions archivées à exporter.");
        return;
      }

      setExporting(true);
      
      // Prepare workbook
      const wb = XLSX.utils.book_new();
      
      // Split transactions by type
      const expenses = transactions.filter(t => t.type === 'expense');
      const revenues = transactions.filter(t => t.type === 'revenue');
      
      // Create expenses worksheet
      const expensesData = expenses.map(transaction => ({
        ID: transaction.id,
        Date: transaction.date || new Date(transaction.createdAt).toLocaleDateString(),
        Montant: transaction.amount,
        Description: transaction.description || '',
        DateArchivage: new Date(transaction.archivedAt).toLocaleDateString(),
      }));
      const expensesWS = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, expensesWS, "Dépenses Archivées");
      
      // Create revenues worksheet
      const revenuesData = revenues.map(transaction => ({
        ID: transaction.id,
        Date: transaction.date || new Date(transaction.createdAt).toLocaleDateString(),
        Montant: transaction.amount,
        Description: transaction.description || '',
        DateArchivage: new Date(transaction.archivedAt).toLocaleDateString(),
      }));
      const revenuesWS = XLSX.utils.json_to_sheet(revenuesData);
      XLSX.utils.book_append_sheet(wb, revenuesWS, "Revenus Archivés");
      
      // Add summary worksheet
      const summary = [
        { Catégorie: 'Dépenses Archivées', 'Nombre': expenses.length, 'Total': expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) },
        { Catégorie: 'Revenus Archivés', 'Nombre': revenues.length, 'Total': revenues.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) },
      ];
      const summaryWS = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, summaryWS, "Résumé");
      
      // Convert to binary excel format
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      // Generate file name with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `ExtraCash_Archives_${dateStr}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Write to file system
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Partage non disponible", "Le partage de fichiers n'est pas disponible sur cet appareil.");
      }
    } catch (error) {
      console.error('Error exporting archived data:', error);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'exportation des données: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  const renderItem = ({ item }) => {
    const isExpense = item.type === 'expense';
    const amount = parseFloat(item.amount) || 0;
    
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Date de transaction:</Text>
            <Text style={styles.transactionDate}>{formatDate(item.date || item.createdAt)}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Date d'archivage:</Text>
            <Text style={styles.archivedDate}>{formatDate(item.archivedAt)}</Text>
          </View>
        </View>
        
        <View style={styles.transactionContent}>
          <View style={[styles.typeIndicator, { backgroundColor: isExpense ? colors.expense : colors.income }]}>
            <Icon 
              name={isExpense ? 'arrow-down' : 'arrow-up'} 
              size={16} 
              color={colors.white} 
            />
          </View>
          
          <View style={styles.transactionDetails}>
            <Text style={styles.description}>
              {item.description || (isExpense ? 'Dépense' : 'Revenu')}
            </Text>
            {item.category && (
              <Text style={styles.category}>{item.category}</Text>
            )}
          </View>
          
          <Text style={[styles.amount, { color: isExpense ? colors.expense : colors.income }]}>
            {isExpense ? '-' : '+'}{formatCurrency(amount)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Icon name="archive-off" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Aucune transaction archivée</Text>
        <Text style={styles.emptySubtext}>
          Les transactions datant de plus de 3 mois apparaîtront ici une fois archivées automatiquement par le système.
        </Text>
        <View style={styles.emptyButtonContainer}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Icon name="refresh" size={18} color={colors.white} />
            <Text style={styles.refreshButtonText}>Actualiser</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.refreshButton, styles.archiveButton]}
            onPress={handleManualArchive}
          >
            <Icon name="archive" size={18} color={colors.white} />
            <Text style={styles.refreshButtonText}>Archiver manuellement</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header screenName="Transactions Archivées" backButton />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des archives...</Text>
        </View>
      ) : (
        <>
          {transactions.length > 0 && (
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={handleExportArchived}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.exportButtonText}>Exportation en cours...</Text>
                </>
              ) : (
                <>
                  <Icon name="file-excel" size={20} color={colors.white} />
                  <Text style={styles.exportButtonText}>Exporter les archives</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  listContent: {
    padding: spacing.medium,
    paddingBottom: spacing.extraLarge * 2,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.medium,
    fontSize: typography.sizeRegular,
    color: colors.textSecondary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.income,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    margin: spacing.medium,
    ...shadows.small,
  },
  exportButtonText: {
    color: colors.white,
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightBold,
    marginLeft: spacing.small,
  },
  transactionItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    marginBottom: spacing.medium,
    padding: spacing.medium,
    ...shadows.small,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.medium,
  },
  dateContainer: {
    flexDirection: 'column',
  },
  dateLabel: {
    fontSize: typography.sizeSmall,
    color: colors.textTertiary,
    fontWeight: typography.weightRegular,
  },
  transactionDate: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
    fontWeight: typography.weightMedium,
  },
  archivedDate: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
    fontWeight: typography.weightMedium,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  transactionDetails: {
    flex: 1,
  },
  description: {
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
  },
  category: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.extraLarge,
  },
  emptyText: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginTop: spacing.large,
    marginBottom: spacing.small,
  },
  emptySubtext: {
    fontSize: typography.sizeRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  emptyButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.medium,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    padding: spacing.small,
    paddingHorizontal: spacing.medium,
    ...shadows.small,
  },
  archiveButton: {
    backgroundColor: colors.income,
  },
  refreshButtonText: {
    color: colors.white,
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightBold,
    marginLeft: spacing.small,
  },
});

export default ArchivedTransactions;
