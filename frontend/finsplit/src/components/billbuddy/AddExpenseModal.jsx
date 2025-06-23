import React, { useState, useEffect } from 'react';

const AddExpenseModal = ({ isOpen, onClose, onAddExpense, initialValues, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitBetween, setSplitBetween] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialValues) {
      setDescription(initialValues.description || '');
      setAmount(initialValues.amount ? String(initialValues.amount) : '');
      setPaidBy(initialValues.paidBy || '');
      setSplitBetween(initialValues.splitBetween ? initialValues.splitBetween.join(', ') : '');
    } else {
      setDescription('');
      setAmount('');
      setPaidBy('');
      setSplitBetween('');
    }
    setError('');
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount.trim() || !paidBy.trim() || !splitBetween.trim()) {
      setError('Please fill all fields.');
      return;
    }
    const splitList = splitBetween.split(',').map(m => m.trim()).filter(Boolean);
    if (splitList.length === 0) {
      setError('Please enter at least one person to split between.');
      return;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    const expenseData = { description, amount: Number(amount), paidBy, splitBetween: splitList };
    if (onSubmit) {
      onSubmit(expenseData);
    } else if (onAddExpense) {
      onAddExpense(expenseData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg min-w-[320px] w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4">{initialValues ? 'Edit Expense' : 'Add New Expense'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Description:</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Amount (₹):</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              min="1"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Paid By:</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={paidBy}
              onChange={e => setPaidBy(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Split Between (comma separated):</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={splitBetween}
              onChange={e => setSplitBetween(e.target.value)}
            />
          </div>
          {error && <div className="text-red-500 mb-3 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button className="bg-primary text-white rounded-lg px-4 py-1 font-medium hover:bg-primary-dark transition" type="submit">{initialValues ? 'Update Expense' : 'Add Expense'}</button>
            <button className="bg-gray-200 text-gray-700 rounded-lg px-4 py-1 font-medium hover:bg-gray-300 transition" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal; 