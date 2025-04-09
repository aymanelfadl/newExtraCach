import { useState } from 'react';
import { HomeButton } from "../../components/HomeButton";
import Expense from './Expense';
import AddExpense from '../../components/AddExpense';

const Home = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const DataBtns = [
    { 
      title: "Nouvelle Dépense",
      description: "Enregistrer une nouvelle dépense", 
      onPress: () => setModalVisible(true),
      backgroundColor: "rgb(244 63 94)",
      icon: "cash-minus" 
    },
    { 
      title: "Nouveau Revenu", 
      description: "Enregistrer un nouveau revenu",
      onPress: () => alert("Nouveau Revenu"),
      backgroundColor: "rgb(14 165 233)",
      icon: "cash-plus" 
    },
    {
      title: "Dépense pour Employé", 
      description: "Enregistrer une dépense pour un employé",
      onPress: () => alert("Dépense pour Employé"),
      backgroundColor: "rgb(55 65 81)",
      icon: "account-cash" 
    },
  ];

  return (
    <>
      {
        DataBtns.map((btn, index) => (
          <HomeButton key={index} btnData={btn} /> 
        ))
      }
      <AddExpense visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
};

export default Home;
