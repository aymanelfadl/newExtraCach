import AddExpense from '../../components/AddExpense';
import { useState } from 'react';


const Expense = () => {
    
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <AddExpense visible={modalVisible} onClose={() => setModalVisible(false)} />
    )
}


export default Expense;