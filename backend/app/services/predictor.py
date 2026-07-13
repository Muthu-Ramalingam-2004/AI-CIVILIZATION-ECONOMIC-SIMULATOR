import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sqlalchemy.orm import Session
from app.models.business import Business
from app.models.history import SimulationHistory
from app.services.simulator import CITIES, INDUSTRIES

class EconomicPredictor:
    @staticmethod
    def get_predictions(db: Session):
        # Fetch history records
        history = db.query(SimulationHistory).order_by(SimulationHistory.step_number.asc()).all()
        
        # If we have very little history, generate baseline predictions
        if len(history) < 5:
            return cls_mock_predictions(history)

        # Convert to Pandas DataFrame
        df = pd.DataFrame([{
            "step_number": h.step_number,
            "total_businesses": h.total_businesses,
            "total_employees": h.total_employees,
            "avg_revenue": h.avg_revenue,
            "active_startups": h.active_startups,
            "collapse_risk": h.collapse_risk,
            "gdp_growth": h.gdp_growth,
            "migration_count": h.migration_count,
            "unemployment_rate": h.unemployment_rate,
            "average_risk": h.average_risk
        } for h in history])

        # 1. Forecast next 12 steps using Linear Regression
        X = df[["step_number"]].values
        last_step = int(df["step_number"].max())
        future_steps = np.array([[last_step + i] for i in range(1, 13)])
        
        forecasts = {
            "steps": [int(f[0]) for f in future_steps]
        }
        
        targets = ["total_businesses", "total_employees", "avg_revenue", "active_startups", "collapse_risk", "gdp_growth", "unemployment_rate"]
        
        for target in targets:
            y = df[target].values
            model = LinearRegression()
            model.fit(X, y)
            pred = model.predict(future_steps)
            
            # Bound predictions logically
            if target in ["total_businesses", "total_employees", "active_startups"]:
                pred = np.clip(pred, 0, None)
            elif target in ["collapse_risk", "unemployment_rate"]:
                pred = np.clip(pred, 0, 100)
                
            forecasts[target] = [float(val) for val in pred]

        # 2. Train Random Forest to find Collapse Risk Drivers (Feature Importances)
        # We predict collapse_risk from other economic variables
        features = ["total_businesses", "total_employees", "avg_revenue", "migration_count", "unemployment_rate", "average_risk"]
        X_rf = df[features].values
        y_rf = df["collapse_risk"].values
        
        rf = RandomForestRegressor(n_estimators=50, random_state=42)
        rf.fit(X_rf, y_rf)
        
        importances = rf.feature_importances_
        feature_importance_list = [
            {"feature": feat.replace("_", " ").title(), "importance": float(imp)}
            for feat, imp in zip(features, importances)
        ]
        feature_importance_list = sorted(feature_importance_list, key=lambda x: x["importance"], reverse=True)

        return {
            "forecast": forecasts,
            "feature_importance": feature_importance_list,
            "data_points_trained": len(history)
        }

    @staticmethod
    def get_recommendations(db: Session):
        active_businesses = db.query(Business).filter(Business.is_active == True).all()
        if not active_businesses:
            return {
                "best_city": "New York",
                "best_industry": "Technology",
                "hiring_recommendation": "Hold hiring due to lack of market data.",
                "risk_reduction_strategy": "Incentivize new businesses to spawn."
            }

        # 1. Best City to Expand (based on average profit margin of firms in that city)
        city_profits = {}
        for biz in active_businesses:
            margin = (biz.revenue - biz.expenses) / max(biz.expenses, 1.0)
            city_profits.setdefault(biz.city, []).append(margin)
            
        best_city = "New York"
        best_margin = -999.0
        for city, margins in city_profits.items():
            avg_m = sum(margins) / len(margins)
            if avg_m > best_margin:
                best_margin = avg_m
                best_city = city

        # 2. Best Industry to Invest (based on total profit and low risk)
        industry_scores = {}
        for biz in active_businesses:
            profit = biz.revenue - biz.expenses
            score = profit * (1.0 - (biz.risk_level / 100.0))
            industry_scores.setdefault(biz.industry, []).append(score)
            
        best_industry = "Technology"
        best_score = -999.0
        for ind, scores in industry_scores.items():
            avg_s = sum(scores) / len(scores)
            if avg_s > best_score:
                best_score = avg_s
                best_industry = ind

        # 3. General Hiring Recommendation based on current GDP growth trend
        last_history = db.query(SimulationHistory).order_by(SimulationHistory.step_number.desc()).first()
        gdp = last_history.gdp_growth if last_history else 3.0
        unemp = last_history.unemployment_rate if last_history else 5.0
        
        if gdp > 3.0 and unemp < 6.0:
            hiring_rec = "Aggressive Hiring. The economy is expanding and talent is competitively priced. Ideal time to scale operations."
        elif gdp < 0 or unemp > 10.0:
            hiring_rec = "Freezes & Consolidation. High unemployment and negative growth indicate market contraction. Focus on optimizing employee output rather than headcount."
        else:
            hiring_rec = "Selective Hiring. Grow critical departments only. Monitor regional economic indicators before committing to large salary overheads."

        # 4. Risk Reduction Strategy based on collapse risk
        risk = last_history.collapse_risk if last_history else 10.0
        if risk > 60.0:
            risk_strat = "Capital Preservation. Shift active business strategies to 'cost_cutting'. Reduce capital investment by 30% and pause all startup spin-off funding."
        elif risk > 30.0:
            risk_strat = "Diversification. Distribute operations across multiple cities (e.g. migrate to higher-scoring areas like Singapore or London) and change strategy to 'moderate_growth'."
        else:
            risk_strat = "Strategic Growth. Capital reserves are secure. Recommend 'r_and_d_focus' to capture future market share, and sponsor startup launch programs."

        return {
            "best_city": best_city,
            "best_industry": best_industry,
            "hiring_recommendation": hiring_rec,
            "risk_reduction_strategy": risk_strat
        }

def cls_mock_predictions(history):
    # Generates mock/fallback predictions when history is small
    last_step = len(history)
    steps = [last_step + i for i in range(1, 13)]
    
    total_businesses = [30 + i * 2 for i in range(1, 13)]
    total_employees = [1500 + i * 80 for i in range(1, 13)]
    avg_revenue = [12000 + i * 350 for i in range(1, 13)]
    active_startups = [3 + i // 3 for i in range(1, 13)]
    collapse_risk = [15.0 - i * 0.4 for i in range(1, 13)]
    gdp_growth = [3.2 + i * 0.05 for i in range(1, 13)]
    unemployment_rate = [5.0 - i * 0.1 for i in range(1, 13)]
    
    return {
        "forecast": {
            "steps": steps,
            "total_businesses": total_businesses,
            "total_employees": total_employees,
            "avg_revenue": avg_revenue,
            "active_startups": active_startups,
            "collapse_risk": collapse_risk,
            "gdp_growth": gdp_growth,
            "unemployment_rate": unemployment_rate
        },
        "feature_importance": [
            {"feature": "Unemployment Rate", "importance": 0.45},
            {"feature": "Average Risk", "importance": 0.30},
            {"feature": "Total Employees", "importance": 0.15},
            {"feature": "Average Revenue", "importance": 0.10}
        ],
        "data_points_trained": len(history)
    }
