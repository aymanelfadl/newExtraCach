import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { HomeButton } from "../../components/HomeButton";
import AddExpense from '../../components/AddExpense';
import Header from '../../components/Header';
import { colors, spacing, commonStyles } from '../../styles/theme';

const Home = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const DataBtns = [
    { 
      title: "Nouvelle Dépense",
      description: "Enregistrer une nouvelle dépense", 
      onPress: () => setModalVisible(true),
      backgroundColor: colors.expense,
      icon: "cash-minus" 
    },
    { 
      title: "Nouveau Revenu", 
      description: "Enregistrer un nouveau revenu",
      onPress: () => alert("Nouveau Revenu"),
      backgroundColor: colors.income,
      icon: "cash-plus" 
    },
    {
      title: "Dépense pour Employé", 
      description: "Enregistrer une dépense pour un employé",
      onPress: () => alert("Dépense pour Employé"),
      backgroundColor: colors.primary,
      icon: "account-cash" 
    },
  ];

  return (
    <View style={styles.container}>
      <Header screenName={"Accueil"} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {DataBtns.map((btn, index) => (
          <HomeButton key={index} btnData={btn} /> 
        ))}
      </ScrollView>
      <AddExpense 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSave={(data) => {
          console.log("Expense data:", data);
          setModalVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.medium,
    paddingBottom: spacing.extraLarge,
  }
});

export default Home;