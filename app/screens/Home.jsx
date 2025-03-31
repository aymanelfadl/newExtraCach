import { HomeButoon } from "../../components/HomeButton";

const Home = () => {

const DataBtns = [
    { title: "Nouvelle Dépense", description: "Enregistrer une nouvelle dépense", onPress: () => alert("all g"), backgroundColor: "rgb(244 63 94)", icon: "../../assets/images/expense.png" },
    { title: "Nouveau Revenu", description: "Enregistrer un nouveau revenu", onPress: () => alert("all g"), backgroundColor: "rgb(14 165 233)", icon: "../../assets/images/income.png" },
    { title: "Dépense pour Employé", description: "Enregistrer une dépense pour un employé", onPress: () => alert("all g"), backgroundColor: "rgb(55 65 81)", icon: "../../assets/images/recruitment.png" },
];

return (
    <>
        {DataBtns.map((btn, index) => (
            <HomeButoon
                key={index}
                btnData={{
                    title: btn.title,
                    description: btn.description,
                    icon: btn.icon,
                    backgroundColor: btn.backgroundColor,
                    onPress: btn.onPress,
                }}
            />
        ))}
    </>
);
};

export default Home;
