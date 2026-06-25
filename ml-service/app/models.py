import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.linear_model import LinearRegression

def forecast_series(history, months_to_predict=3):
    """
    Given a list of transactions (dicts with date and amount),
    group them by month, fit a linear trend, and predict future months.
    """
    if not history:
        return [0.0] * months_to_predict

    # Convert to DataFrame
    df = pd.DataFrame(history)
    df['date'] = pd.to_datetime(df['date'])
    df['amount'] = df['amount'].astype(float)
    
    # Set index and resample monthly
    df.set_index('date', inplace=True)
    monthly = df['amount'].resample('ME').sum().reset_index()
    
    if len(monthly) < 2:
        # Not enough data points to fit a trend line, just repeat last value or average
        val = float(monthly['amount'].iloc[0]) if len(monthly) == 1 else 0.0
        return [val] * months_to_predict

    # Feature engineering: month index (0, 1, 2...)
    monthly['month_idx'] = np.arange(len(monthly))
    
    # Fit regression model
    X = monthly[['month_idx']]
    y = monthly['amount']
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict next months
    last_idx = monthly['month_idx'].iloc[-1]
    future_indices = np.arange(last_idx + 1, last_idx + 1 + months_to_predict).reshape(-1, 1)
    predictions = model.predict(future_indices)
    
    # Ensure no negative predictions (e.g. for revenue/expenses)
    predictions = np.clip(predictions, a_min=0, a_max=None)
    
    return [round(float(p), 2) for p in predictions]

def analyze_turnover_risk(employees):
    """
    Analyze employees list to compute risk levels.
    """
    if not employees:
        return []
    
    results = []
    # Calculate some stats for relative comparison
    salaries = [float(emp['salary']) for emp in employees if 'salary' in emp]
    avg_salary = np.mean(salaries) if salaries else 50000.0

    for emp in employees:
        salary = float(emp.get('salary', 50000))
        # Simple risk factors:
        # 1. Salary lower than average
        # 2. Tenure (joining date)
        # 3. Department risk modifiers (e.g., Engineering holds slightly higher market turnover)
        risk_score = 15.0  # base risk percent
        
        if salary < avg_salary * 0.8:
            risk_score += 25.0
        elif salary > avg_salary * 1.2:
            risk_score -= 10.0
            
        dept = emp.get('department', '')
        if dept in ['Engineering', 'Sales']:
            risk_score += 15.0
            
        joining_date_str = emp.get('joiningDate')
        if joining_date_str:
            try:
                # Expecting iso string
                joining_date = pd.to_datetime(joining_date_str)
                tenure_days = (datetime.now() - joining_date.to_pydatetime()).days
                if tenure_days < 180: # newly joined risk
                    risk_score += 10.0
                elif tenure_days > 730: # long term, stable
                    risk_score -= 15.0
            except Exception:
                pass
                
        # Clip risk score between 5% and 95%
        risk_score = np.clip(risk_score, 5.0, 95.0)
        
        results.append({
            "employeeId": emp.get("id"),
            "name": emp.get("name"),
            "department": dept,
            "riskScore": round(float(risk_score), 1),
            "riskLevel": "High" if risk_score > 60 else ("Medium" if risk_score > 35 else "Low")
        })
        
    return results
