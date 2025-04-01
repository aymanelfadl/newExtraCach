import { HomeButton } from "../../components/HomeButton";

const Home = () => {
  const DataBtns = [
    { 
      title: "Nouvelle Dépense",
      description: "Enregistrer une nouvelle dépense", 
      onPress: () => alert("Nouvelle Dépense"),
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
      {DataBtns.map((btn, index) => (
        <HomeButton key={index} btnData={btn} />
      ))}
    </>
  );
};

export default Home;
