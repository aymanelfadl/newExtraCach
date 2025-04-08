import AddExpense from '../../components/AddExpense';

const Expense = ({ visible, onClose }) => {
  return (
    <AddExpense visible={visible} onClose={onClose} />
  );
}

export default Expense;