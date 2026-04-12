import React, { useState, useMemo } from 'react';
import { isSameWeek, isSameMonth, parseISO } from 'date-fns';
import { Trash2, Edit2, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ExpenseList = ({ expenses, currency, onDelete, onEdit }) => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.category.toLowerCase().includes(lower) || 
        e.description.toLowerCase().includes(lower)
      );
    }

    const now = new Date();
    if (filterType === 'daily') {
      const todayStr = now.toISOString().split('T')[0];
      filtered = filtered.filter(e => e.date === todayStr);
    } else if (filterType === 'weekly') {
      filtered = filtered.filter(e => isSameWeek(parseISO(e.date), now));
    } else if (filterType === 'monthly') {
      filtered = filtered.filter(e => isSameMonth(parseISO(e.date), now));
    }

    return filtered;
  }, [expenses, filterType, searchTerm]);

  const chartData = useMemo(() => {
    const dataObj = {};
    filteredExpenses.forEach(exp => {
      dataObj[exp.category] = (dataObj[exp.category] || 0) + exp.convertedAmount;
    });
    return Object.keys(dataObj).map(key => ({
      name: key,
      value: Number(dataObj[key].toFixed(2))
    })).sort((a,b) => b.value - a.value);
  }, [filteredExpenses]);


  return (
    <div className="glass glass-card flex" style={{flexDirection: 'column', gap: '1.5rem', height: '100%', minHeight: '500px'}}>
      <div className="flex justify-between items-center" style={{flexWrap: 'wrap', gap: '1rem'}}>
        <h2>Expenses</h2>
        
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center" style={{position: 'relative'}}>
            <Search size={18} style={{position: 'absolute', left: '10px', color: 'var(--text-secondary)'}} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{marginBottom: 0, paddingLeft: '35px', width: '200px'}}
            />
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{marginBottom: 0, width: 'auto'}}
          >
            <option value="all">All Time</option>
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
          </select>
        </div>
      </div>

      {chartData.length > 0 && (
        <div style={{height: '250px', width: '100%'}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}}/>
              <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}}/>
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: '8px'}} />
              <Bar dataKey="value" fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{overflowY: 'auto', flex: 1, paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
        {filteredExpenses.length === 0 ? (
          <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem'}}>No expenses found.</p>
        ) : (
          filteredExpenses.map(exp => (
            <div key={exp.id} className="glass" style={{padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h3 style={{marginBottom: '0.25rem', fontSize: '1.1rem'}}>{exp.category}</h3>
                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 0}}>
                  {exp.date} • {exp.description || 'No description'}
                </p>
                <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0}}>
                  Original: {exp.amount.toFixed(2)} {exp.currency}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span style={{fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)'}}>
                  {exp.convertedAmount.toFixed(2)} {currency}
                </span>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <button onClick={() => onEdit(exp)} style={{padding: '0.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)'}}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDelete(exp.id)} className="danger" style={{padding: '0.5rem'}}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
