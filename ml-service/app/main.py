from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.models import forecast_series, analyze_turnover_risk

app = FastAPI(title="AMDOX ERP AI/ML Service", version="1.0.0")

class TransactionInput(BaseModel):
    date: str
    amount: float

class FinanceForecastRequest(BaseModel):
    incomes: List[TransactionInput]
    expenses: List[TransactionInput]
    months_to_predict: Optional[int] = 3

class FinanceForecastResponse(BaseModel):
    success: bool
    predicted_revenue: List[float]
    predicted_expenses: List[float]

class EmployeeInput(BaseModel):
    id: str
    name: str
    department: str
    salary: float
    joiningDate: str

class TurnoverRiskRequest(BaseModel):
    employees: List[EmployeeInput]

class EmployeeRiskOut(BaseModel):
    employeeId: str
    name: str
    department: str
    riskScore: float
    riskLevel: str

class TurnoverRiskResponse(BaseModel):
    success: bool
    risks: List[EmployeeRiskOut]

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ML-service"}

@app.post("/predict/finance", response_model=FinanceForecastResponse)
def predict_finance(payload: FinanceForecastRequest):
    try:
        incomes_list = [{"date": item.date, "amount": item.amount} for item in payload.incomes]
        expenses_list = [{"date": item.date, "amount": item.amount} for item in payload.expenses]
        
        pred_rev = forecast_series(incomes_list, payload.months_to_predict)
        pred_exp = forecast_series(expenses_list, payload.months_to_predict)
        
        return {
            "success": True,
            "predicted_revenue": pred_rev,
            "predicted_expenses": pred_exp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/turnover", response_model=TurnoverRiskResponse)
def predict_turnover(payload: TurnoverRiskRequest):
    try:
        emp_list = [{
            "id": emp.id,
            "name": emp.name,
            "department": emp.department,
            "salary": emp.salary,
            "joiningDate": emp.joiningDate
        } for emp in payload.employees]
        
        risks = analyze_turnover_risk(emp_list)
        
        return {
            "success": True,
            "risks": risks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
