import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import AddExpenseModal from '../../components/billbuddy/AddExpenseModal';
import { getGroupDetails, addExpense, addSettlement, deleteExpense, deleteSettlement, updateExpense, updateSettlement } from '../../utils/billBuddyApi';
import SideMenu from '../../components/layouts/SideMenu';
import Navbar from '../../components/layouts/Navbar';

const BillBuddyGroup = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddExpenseOpen, setAddExpenseOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [settleModal, setSettleModal] = useState({ open: false, from: '', to: '', amount: '' });
  const [editSettlement, setEditSettlement] = useState(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [deletingSettlementId, setDeletingSettlementId] = useState(null);

  useEffect(() => {
    setLoading(true);
    getGroupDetails(groupId)
      .then(res => {
        setGroup(res.data.group);
        setExpenses(res.data.expenses);
        setSettlements(res.data.settlements);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load group details');
        setLoading(false);
      });
  }, [groupId]);

  // Add expense via backend
  const handleAddExpense = async (expense) => {
    setError('');
    try {
      const res = await addExpense({ ...expense, groupId });
      setExpenses(prev => [...prev, res.data]);
      setAddExpenseOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense');
    }
  };

  // Add settlement via backend
  const confirmSettle = async () => {
    setError('');
    try {
      const res = await addSettlement({ ...settleModal, groupId });
      setSettlements(prev => [...prev, res.data]);
      setSettleModal({ open: false, from: '', to: '', amount: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add settlement');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    setDeletingExpenseId(expenseId);
    try {
      await deleteExpense(expenseId);
      setExpenses(prev => prev.filter(e => e._id !== expenseId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete expense');
    }
    setDeletingExpenseId(null);
  };

  const handleDeleteSettlement = async (settlementId) => {
    if (!window.confirm('Are you sure you want to delete this settlement?')) return;
    setDeletingSettlementId(settlementId);
    try {
      await deleteSettlement(settlementId);
      setSettlements(prev => prev.filter(s => s._id !== settlementId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete settlement');
    }
    setDeletingSettlementId(null);
  };

  const handleEditExpense = (expense) => {
    setEditExpense(expense);
    setAddExpenseOpen(false);
  };

  const handleUpdateExpense = async (expenseData) => {
    setError('');
    try {
      const res = await updateExpense(editExpense._id, expenseData);
      setExpenses(prev => prev.map(e => (e._id === editExpense._id ? res.data : e)));
      setEditExpense(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update expense');
    }
  };

  const handleEditSettlement = (settlement) => {
    setEditSettlement(settlement);
    setSettleModal({ open: false, from: '', to: '', amount: '' });
  };

  const handleUpdateSettlement = async (settlementData) => {
    setError('');
    try {
      const res = await updateSettlement(editSettlement._id, settlementData);
      setSettlements(prev => prev.map(s => (s._id === editSettlement._id ? res.data : s)));
      setEditSettlement(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settlement');
    }
  };

  // Calculate balances from expenses
  const rawBalances = useMemo(() => {
    const bal = {};
    expenses.forEach(exp => {
      const splitCount = exp.splitBetween.length;
      const share = exp.amount / splitCount;
      exp.splitBetween.forEach(person => {
        if (!bal[person]) bal[person] = 0;
        bal[person] -= share;
      });
      if (!bal[exp.paidBy]) bal[exp.paidBy] = 0;
      bal[exp.paidBy] += exp.amount;
    });
    return bal;
  }, [expenses]);

  // Apply settlements to balances
  const balances = useMemo(() => {
    const bal = { ...rawBalances };
    settlements.forEach(({ from, to, amount }) => {
      if (!bal[from]) bal[from] = 0;
      if (!bal[to]) bal[to] = 0;
      bal[from] += Number(amount);
      bal[to] -= Number(amount);
    });
    return bal;
  }, [rawBalances, settlements]);

  // Get all members
  const members = useMemo(() => {
    const set = new Set();
    expenses.forEach(exp => {
      exp.splitBetween.forEach(m => set.add(m));
      set.add(exp.paidBy);
    });
    return Array.from(set);
  }, [expenses]);

  // Debt simplification: who owes whom
  const whoOwesWhom = useMemo(() => {
    // Clone balances
    const bal = { ...balances };
    const creditors = [];
    const debtors = [];
    Object.entries(bal).forEach(([person, amount]) => {
      if (amount > 0.01) creditors.push({ person, amount });
      else if (amount < -0.01) debtors.push({ person, amount: -amount });
    });
    const transactions = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settleAmount = Math.min(debtor.amount, creditor.amount);
      transactions.push({ from: debtor.person, to: creditor.person, amount: settleAmount });
      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;
      if (Math.abs(debtor.amount) < 0.01) i++;
      if (Math.abs(creditor.amount) < 0.01) j++;
    }
    return transactions;
  }, [balances]);

  // Open settle modal with prefilled from/to/amount
  const handleSettle = (from, to, amount) => {
    setSettleModal({ open: true, from, to, amount: Math.abs(amount).toFixed(2) });
  };

  const isSettled = (from, to, amount) => {
    return settlements.some(s => s.from === from && s.to === to && Math.abs(s.amount - amount) < 0.01);
  };

  if (loading) return <div className="p-6"><p>Loading group...</p></div>;
  if (error) return <div className="p-6"><p className="text-red-500">{error}</p></div>;
  if (!group) return <div className="p-6"><p>Group not found.</p></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        <SideMenu activeMenu="BillBuddy" />
        <main className="flex-1 p-6 max-w-2xl mx-auto">
          <div className="mb-6 bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold mb-1 text-primary">BillBuddy Group: {group.name}</h2>
            <div className="text-gray-500 mb-4">Members: {group.members.join(', ')}</div>
            <button className="bg-primary text-white rounded-lg px-4 py-2 font-medium hover:bg-primary-dark transition mb-4" onClick={() => { setAddExpenseOpen(true); setEditExpense(null); }}>
              + Add Expense
            </button>
            <h3 className="text-lg font-semibold mt-4 mb-2">Expenses</h3>
            <ul className="space-y-2 mb-6">
              {expenses.map(exp => (
                <li className="bg-gray-50 rounded-lg px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between" key={exp._id}>
                  <span className="font-medium">{exp.description}</span>
                  <span className="text-gray-700">₹{exp.amount} <span className="text-xs text-gray-400">({exp.paidBy} paid, split: {exp.splitBetween.join(', ')})</span></span>
                  <div className="flex gap-2">
                    <button
                      className="bg-blue-500 text-white rounded-lg px-3 py-1 text-sm font-medium hover:bg-blue-600 transition"
                      onClick={() => handleEditExpense(exp)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white rounded-lg px-3 py-1 text-sm font-medium hover:bg-red-600 transition"
                      onClick={() => handleDeleteExpense(exp._id)}
                      disabled={deletingExpenseId === exp._id}
                    >
                      {deletingExpenseId === exp._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <h3 className="text-lg font-semibold mb-2">Who Owes Whom</h3>
            <ul className="space-y-2 mb-6">
              {whoOwesWhom.length === 0 && <li className="bg-green-50 rounded-lg px-4 py-2">All settled up! 🎉</li>}
              {whoOwesWhom.map((t, i) => (
                <li className="bg-gray-50 rounded-lg px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between" key={i}>
                  <span><span className="text-red-500 font-semibold">{t.from}</span> owes <span className="text-green-600 font-semibold">{t.to}</span> <b>₹{t.amount.toFixed(2)}</b></span>
                  {isSettled(t.from, t.to, t.amount) ? (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 rounded-full px-3 py-1">Settled</span>
                  ) : (
                    <button className="ml-2 bg-primary text-white rounded-lg px-3 py-1 text-sm hover:bg-primary-dark transition" onClick={() => setSettleModal({ open: true, from: t.from, to: t.to, amount: t.amount.toFixed(2) })}>Settle Up</button>
                  )}
                </li>
              ))}
            </ul>
            {settleModal.open && (
              <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-lg min-w-[320px] w-full max-w-sm">
                  <h4 className="text-lg font-semibold mb-4">Settle Up</h4>
                  <form onSubmit={e => { e.preventDefault(); confirmSettle(); }}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Payer:</label>
                      <select className="w-full border rounded px-2 py-1" value={settleModal.from} onChange={e => setSettleModal(m => ({ ...m, from: e.target.value }))}>
                        <option value="">Select</option>
                        {members.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Payee:</label>
                      <select className="w-full border rounded px-2 py-1" value={settleModal.to} onChange={e => setSettleModal(m => ({ ...m, to: e.target.value }))}>
                        <option value="">Select</option>
                        {members.filter(m => m !== settleModal.from).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Amount (₹):</label>
                      <input className="w-full border rounded px-2 py-1" type="number" min="1" value={settleModal.amount} onChange={e => setSettleModal(m => ({ ...m, amount: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-primary text-white rounded-lg px-4 py-1 font-medium hover:bg-primary-dark transition" type="submit">Confirm Settle</button>
                      <button className="bg-gray-200 text-gray-700 rounded-lg px-4 py-1 font-medium hover:bg-gray-300 transition" type="button" onClick={() => setSettleModal({ open: false, from: '', to: '', amount: '' })}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <h3 className="text-lg font-semibold mb-2 mt-6">Balances</h3>
            <ul className="space-y-2 mb-6">
              {Object.entries(balances).map(([person, amount]) => (
                <li className={`rounded-lg px-4 py-2 flex items-center ${amount < 0 ? 'text-red-500 bg-red-50' : amount > 0 ? 'text-green-600 bg-green-50' : 'text-gray-700 bg-gray-50'}`} key={person}>
                  {person}: {amount > 0 ? '+' : ''}₹{amount.toFixed(2)}
                </li>
              ))}
            </ul>
            <h3 className="text-lg font-semibold mb-2">Settlements</h3>
            <ul className="space-y-2">
              {settlements.map((s, i) => (
                <li className="bg-gray-50 rounded-lg px-4 py-2 flex items-center justify-between" key={s._id || i}>
                  <span>{s.from} paid {s.to} ₹{s.amount.toFixed(2)}</span>
                  <div className="flex gap-2">
                    <button
                      className="bg-blue-500 text-white rounded-lg px-3 py-1 text-sm font-medium hover:bg-blue-600 transition"
                      onClick={() => handleEditSettlement(s)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white rounded-lg px-3 py-1 text-sm font-medium hover:bg-red-600 transition"
                      onClick={() => handleDeleteSettlement(s._id)}
                      disabled={deletingSettlementId === s._id}
                    >
                      {deletingSettlementId === s._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {(settleModal.open || !!editSettlement) && (
              <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-lg min-w-[320px] w-full max-w-sm">
                  <h4 className="text-lg font-semibold mb-4">{editSettlement ? 'Edit Settlement' : 'Settle Up'}</h4>
                  <form onSubmit={e => { e.preventDefault(); editSettlement ? handleUpdateSettlement(settleModal) : confirmSettle(); }}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Payer:</label>
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={editSettlement ? editSettlement.from : settleModal.from}
                        onChange={e => editSettlement ? setEditSettlement(m => ({ ...m, from: e.target.value })) : setSettleModal(m => ({ ...m, from: e.target.value }))}
                      >
                        <option value="">Select</option>
                        {members.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Payee:</label>
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={editSettlement ? editSettlement.to : settleModal.to}
                        onChange={e => editSettlement ? setEditSettlement(m => ({ ...m, to: e.target.value })) : setSettleModal(m => ({ ...m, to: e.target.value }))}
                      >
                        <option value="">Select</option>
                        {members.filter(m => m !== (editSettlement ? editSettlement.from : settleModal.from)).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Amount (₹):</label>
                      <input
                        className="w-full border rounded px-2 py-1"
                        type="number"
                        min="1"
                        value={editSettlement ? editSettlement.amount : settleModal.amount}
                        onChange={e => editSettlement ? setEditSettlement(m => ({ ...m, amount: e.target.value })) : setSettleModal(m => ({ ...m, amount: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-primary text-white rounded-lg px-4 py-1 font-medium hover:bg-primary-dark transition"
                        type="submit"
                      >
                        {editSettlement ? 'Update Settlement' : 'Confirm Settle'}
                      </button>
                      <button
                        className="bg-gray-200 text-gray-700 rounded-lg px-4 py-1 font-medium hover:bg-gray-300 transition"
                        type="button"
                        onClick={() => { setSettleModal({ open: false, from: '', to: '', amount: '' }); setEditSettlement(null); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          <AddExpenseModal
            isOpen={isAddExpenseOpen || !!editExpense}
            onClose={() => { setAddExpenseOpen(false); setEditExpense(null); }}
            onAddExpense={isAddExpenseOpen ? handleAddExpense : undefined}
            initialValues={editExpense || undefined}
            onSubmit={editExpense ? handleUpdateExpense : undefined}
          />
        </main>
      </div>
    </div>
  );
};

export default BillBuddyGroup; 