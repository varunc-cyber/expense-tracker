import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import { CreditCard } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    fetchRates();
  }, [currency]);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API_URL}/expenses`);
      setExpenses(res.data);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
    }
  };

  const fetchRates = async () => {
    try {
      const res = await axios.get(`${API_URL}/rates?base=${currency}`);
      setExchangeRates(res.data.rates);
    } catch (err) {
      console.error('Failed to fetch rates', err);
    }
  };

  const calculateConvertedAmount = (amount, originalCurrency) => {
    if (originalCurrency === currency) return amount;
    
    // In Frankfurter API, if base is `currency` (e.g. INR),
    // exchangeRates[originalCurrency] (e.g. USD) will be how much 1 INR is in USD.
    // So if I have 100 USD padding, in INR that is 100 / exchangeRates['USD'].
    // E.g. base=INR, rates['USD'] = 0.012 -> 1 INR = 0.012 USD.
    // 100 USD = 100 / 0.012 = 8333 INR. Correct.
    
    if (exchangeRates && exchangeRates[originalCurrency]) {
      return amount / exchangeRates[originalCurrency];
    }
    return amount; // fallback
  };

  const handleAddExpense = async (expense) => {
    if (editingExpense) {
      try {
        await axios.put(`${API_URL}/expenses/${editingExpense.id}`, expense);
        setEditingExpense(null);
        fetchExpenses();
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        await axios.post(`${API_URL}/expenses`, expense);
        fetchExpenses();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
  };

  // Convert all expenses to selected currency
  const convertedExpenses = expenses.map(exp => ({
    ...exp,
    convertedAmount: calculateConvertedAmount(exp.amount, exp.currency)
  }));

  const totalExpense = convertedExpenses.reduce((sum, exp) => sum + exp.convertedAmount, 0);

  return (
    <div className="App">
      <header className="flex justify-between items-center mb-4 glass glass-card">
        <h1 className="flex items-center gap-4 m-0" style={{marginBottom: 0}}>
          <CreditCard size={32} color="var(--accent)" /> 
          Expense Tracker
        </h1>
        <div className="flex items-center gap-4">
          <label style={{fontWeight: 600}}>Currency:</label>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            style={{marginBottom: 0, width: 'auto'}}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="INR">INR</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
          </select>
        </div>
      </header>

      <div className="glass glass-card mb-4">
        <h2>Total Spent: {totalExpense.toFixed(2)} {currency}</h2>
      </div>

      <div className="dashboard-layout">
        <div>
          <ExpenseForm 
            onSubmit={handleAddExpense} 
            editingExpense={editingExpense} 
            onCancel={() => setEditingExpense(null)} 
          />
        </div>
        <div>
          <ExpenseList 
            expenses={convertedExpenses} 
            currency={currency} 
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
