import { useState } from 'react';

import AddExpense from '../../components/AddExpense';

const Expense = () => {

  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
    { modalVisible && <AddExpense visible={visible} onClose={() => setModalVisible(false)} />}
    </> 
  );
}

export default Expense;