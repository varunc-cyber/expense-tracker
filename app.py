from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Expense
from datetime import datetime
import requests

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///expenses.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    expenses = Expense.query.order_by(Expense.date.desc()).all()
    return jsonify([exp.to_dict() for exp in expenses])

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    data = request.json
    try:
        new_exp = Expense(
            amount=data['amount'],
            currency=data.get('currency', 'USD'),
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            category=data['category'],
            description=data.get('description', '')
        )
        db.session.add(new_exp)
        db.session.commit()
        return jsonify(new_exp.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/expenses/<int:id>', methods=['PUT'])
def update_expense(id):
    expense = Expense.query.get_or_404(id)
    data = request.json
    try:
        if 'amount' in data:
            expense.amount = data['amount']
        if 'currency' in data:
            expense.currency = data['currency']
        if 'date' in data:
            expense.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if 'category' in data:
            expense.category = data['category']
        if 'description' in data:
            expense.description = data['description']
        
        db.session.commit()
        return jsonify(expense.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    expense = Expense.query.get_or_404(id)
    db.session.delete(expense)
    db.session.commit()
    return '', 204

@app.route('/api/rates', methods=['GET'])
def get_rates():
    base = request.args.get('base', 'USD')
    # Frankfurter API for free rates
    api_url = f"https://api.frankfurter.app/latest?from={base}"
    try:
        response = requests.get(api_url)
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Failed to fetch rates', 'status': response.status_code}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
