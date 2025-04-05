import AddExpense from '../../components/AddExpense';
import { useState } from 'react';

const Expense = ({ visible, onClose }) => {
  return (
    <AddExpense visible={visible} onClose={onClose} />
  );
}

export default Expense;
