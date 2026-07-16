import random
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.business import Business
from app.models.history import SimulationHistory
from app.models.log import SystemLog
from app.models.notification import Notification

logger = logging.getLogger(__name__)

# Predefined cities for the world map
CITIES = {
    "New York": {"country": "United States", "latitude": 40.7128, "longitude": -74.0060},
    "San Francisco": {"country": "United States", "latitude": 37.7749, "longitude": -122.4194},
    "London": {"country": "United Kingdom", "latitude": 51.5074, "longitude": -0.1278},
    "Tokyo": {"country": "Japan", "latitude": 35.6762, "longitude": 139.6503},
    "Berlin": {"country": "Germany", "latitude": 52.5200, "longitude": 13.4050},
    "Singapore": {"country": "Singapore", "latitude": 1.3521, "longitude": 103.8198},
    "Sydney": {"country": "Australia", "latitude": -33.8688, "longitude": 151.2093},
    "Bangalore": {"country": "India", "latitude": 12.9716, "longitude": 77.5946}
}

INDUSTRIES = ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Energy"]
STRATEGIES = ["aggressive_expansion", "cost_cutting", "moderate_growth", "r_and_d_focus"]

def log_event(db: Session, message: str, level: str = "INFO", category: str = "general"):
    logger.info(f"[{category.upper()}] {message}")
    log_entry = SystemLog(
        message=message,
        level=level,
        category=category,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    db.flush()

def trigger_notification(db: Session, title: str, message: str, type_: str):
    notification = Notification(
        title=title,
        message=message,
        type=type_,
        is_read=False,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(notification)
    db.flush()

def seed_initial_data(db: Session):
    # Check if we already have businesses
    business_count = db.query(Business).count()
    if business_count > 0:
        return

    log_event(db, "Seeding initial simulator dataset...", "INFO", "simulation")

    # Create 24 sample businesses (3 per city)
    names_pool = [
        "Aether Tech", "Nvidia Labs", "Quantum Finance", "BioLife Labs", "Omni Retail",
        "Apex Energy", "Nebula Soft", "Stellar Capital", "Aura Health", "Vortex Goods",
        "Atlas Forge", "Zenith Power", "Horizon Cyber", "Meridian Trust", "Beacon Med",
        "Pinnacle Trade", "Fusion Heavy", "Prime Fuel", "Nova Logic", "Summit Asset",
        "Core Biotech", "Delta Logistics", "Titan Steel", "Solaria Energy"
    ]

    city_list = list(CITIES.keys())
    
    for i, name in enumerate(names_pool):
        city = city_list[i % len(city_list)]
        industry = INDUSTRIES[i % len(INDUSTRIES)]
        strategy = STRATEGIES[i % len(STRATEGIES)]
        
        # Random initial values
        employees = random.randint(5, 120)
        revenue = employees * random.uniform(8000.0, 15000.0)
        expenses = revenue * random.uniform(0.75, 0.95)
        capital = revenue * random.uniform(2.0, 5.0)
        growth_rate = random.uniform(0.01, 0.15)
        risk = random.uniform(5.0, 30.0)

        biz = Business(
            name=name,
            industry=industry,
            city=city,
            country=CITIES[city]["country"],
            employees=employees,
            revenue=revenue,
            expenses=expenses,
            growth_rate=growth_rate,
            ai_strategy=strategy,
            risk_level=risk,
            capital=capital,
            age=random.randint(1, 48),
            is_active=True,
            latitude=CITIES[city]["latitude"],
            longitude=CITIES[city]["longitude"]
        )
        db.add(biz)

    # Seed initial simulation history step 0
    history_count = db.query(SimulationHistory).count()
    if history_count == 0:
        db.commit() # commit businesses first to count them
        businesses = db.query(Business).filter(Business.is_active == True).all()
        total_employees = sum(b.employees for b in businesses)
        avg_revenue = sum(b.revenue for b in businesses) / len(businesses) if businesses else 0.0
        total_capital = sum(b.capital for b in businesses)
        
        history_step = SimulationHistory(
            step_number=0,
            total_businesses=len(businesses),
            total_employees=total_employees,
            avg_revenue=avg_revenue,
            active_startups=0,
            collapse_risk=5.0,
            gdp_growth=3.2,
            migration_count=0,
            total_capital=total_capital,
            unemployment_rate=5.0,
            average_risk=12.5,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(history_step)
        
    db.commit()
    log_event(db, "Simulator seeding completed successfully.", "INFO", "simulation")

class SimulationEngine:
    @staticmethod
    def calculate_city_health(db: Session, city: str) -> float:
        # Compute local city health score
        businesses = db.query(Business).filter(
            Business.city == city, 
            Business.is_active == True
        ).all()
        if not businesses:
            return 0.5
        
        avg_growth = sum(b.growth_rate for b in businesses) / len(businesses)
        avg_profit_ratio = sum(b.revenue / max(b.expenses, 1.0) for b in businesses) / len(businesses)
        avg_risk = sum(b.risk_level for b in businesses) / len(businesses)
        
        # Higher growth & profit ratio is good, higher risk is bad
        health = (avg_growth * 5.0) + (avg_profit_ratio * 0.8) - (avg_risk / 150.0)
        return max(0.1, health)

    @classmethod
    def run_simulation(cls, db: Session, months: int) -> int:
        # Seed if empty
        seed_initial_data(db)

        # Get last step number
        last_history = db.query(SimulationHistory).order_by(SimulationHistory.step_number.desc()).first()
        start_step = last_history.step_number if last_history else 0
        
        unemployment_rate = last_history.unemployment_rate if last_history else 5.0

        migrated_this_run = 0
        bankruptcies_this_run = 0
        mergers_this_run = 0
        startups_this_run = 0

        for month in range(1, months + 1):
            current_step = start_step + month
            
            # Step caches
            migration_count = 0
            bankrupt_count = 0
            merger_count = 0
            startup_count = 0
            
            active_businesses = db.query(Business).filter(Business.is_active == True).all()
            
            # Compute health scores for all cities
            city_health = {city: cls.calculate_city_health(db, city) for city in CITIES}
            
            log_event(db, f"Step {current_step}: Updating {len(active_businesses)} active business agents...", "INFO", "simulation")
            
            # 1. Update each business agent
            for biz in active_businesses:
                if not biz.is_active:
                    continue
                biz.age += 1
                
                # Financial adjustment based on strategy
                strategy = biz.ai_strategy
                base_growth = biz.growth_rate
                
                # Fluctuate revenue and expenses
                if strategy == "aggressive_expansion":
                    revenue_pct = random.uniform(0.02, 0.12)
                    expenses_pct = random.uniform(0.03, 0.09)
                    biz.growth_rate = min(0.40, biz.growth_rate + random.uniform(-0.01, 0.03))
                    biz.risk_level = min(100.0, biz.risk_level + random.uniform(0.5, 3.0))
                elif strategy == "cost_cutting":
                    revenue_pct = random.uniform(-0.04, 0.02)
                    expenses_pct = random.uniform(-0.12, -0.02)
                    biz.growth_rate = max(-0.15, biz.growth_rate + random.uniform(-0.03, 0.01))
                    biz.risk_level = max(0.0, biz.risk_level - random.uniform(1.0, 4.0))
                elif strategy == "r_and_d_focus":
                    revenue_pct = random.uniform(-0.05, 0.15)
                    expenses_pct = random.uniform(0.02, 0.08)
                    biz.growth_rate = min(0.35, biz.growth_rate + random.uniform(-0.02, 0.05))
                    biz.risk_level = min(100.0, biz.risk_level + random.uniform(0.1, 1.5))
                else: # moderate_growth
                    revenue_pct = random.uniform(0.01, 0.05)
                    expenses_pct = random.uniform(0.01, 0.04)
                    biz.growth_rate = biz.growth_rate * 0.95 + random.uniform(-0.01, 0.02)
                    biz.risk_level = biz.risk_level + random.uniform(-0.5, 0.5)

                # Month changes
                biz.revenue = max(1000.0, biz.revenue * (1.0 + revenue_pct))
                biz.expenses = max(800.0, biz.expenses * (1.0 + expenses_pct))
                
                monthly_profit = biz.revenue - biz.expenses
                biz.capital += monthly_profit
                
                # Check for financial distress
                if biz.capital < 0:
                    biz.risk_level = min(100.0, biz.risk_level + 5.0)
                else:
                    biz.risk_level = max(0.0, biz.risk_level - 0.2)
                
                # Bankruptcy trigger
                if biz.risk_level >= 95.0 and biz.capital < -10000.0:
                    biz.is_active = False
                    bankrupt_count += 1
                    bankruptcies_this_run += 1
                    log_event(db, f"Business {biz.name} has declared bankruptcy in {biz.city} due to capital depletion (${int(biz.capital)}).", "WARNING", "bankruptcy")
                    continue

                # AI Agent Actions
                action_roll = random.random()
                
                # Action 1: Hire Employees
                if action_roll < 0.15 and biz.capital > 25000 and monthly_profit > 0:
                    hire_count = random.randint(1, max(2, int(biz.employees * 0.15)))
                    biz.employees += hire_count
                    biz.expenses += hire_count * random.uniform(2500.0, 4500.0) # salary overhead
                    log_event(db, f"{biz.name} in {biz.city} hired {hire_count} employees to support expansion.", "INFO", "simulation")
                
                # Action 2: Layoffs
                elif action_roll < 0.28 and monthly_profit < 0 and biz.employees > 2:
                    layoff_count = random.randint(1, max(2, int(biz.employees * 0.25)))
                    layoff_count = min(layoff_count, biz.employees - 1)
                    biz.employees -= layoff_count
                    biz.expenses = max(800.0, biz.expenses - layoff_count * random.uniform(2000.0, 3800.0)) # savings
                    biz.risk_level = min(100.0, biz.risk_level + 2.0)
                    log_event(db, f"{biz.name} in {biz.city} laid off {layoff_count} employees to reduce operational overhead.", "WARNING", "simulation")

                # Action 3: Relocate (Migration)
                elif action_roll < 0.33 and biz.capital > 15000:
                    current_health = city_health.get(biz.city, 0.5)
                    # Find best city
                    best_city = biz.city
                    best_health = current_health
                    
                    for c, h in city_health.items():
                        if h > best_health:
                            best_health = h
                            best_city = c
                    
                    # Relocate if health is 30% higher
                    if best_city != biz.city and best_health > (current_health * 1.30):
                        old_city = biz.city
                        biz.city = best_city
                        biz.country = CITIES[best_city]["country"]
                        biz.latitude = CITIES[best_city]["latitude"]
                        biz.longitude = CITIES[best_city]["longitude"]
                        biz.capital -= 5000.0 # moving costs
                        migration_count += 1
                        migrated_this_run += 1
                        log_event(db, f"AI Agent {biz.name} migrated from {old_city} to {best_city} seeking better market conditions (Score: {best_health:.2f} vs {current_health:.2f}).", "INFO", "migration")
                
                # Action 4: Launch Startup (Spin-off)
                elif action_roll < 0.36 and biz.capital > 120000 and (strategy == "aggressive_expansion" or strategy == "r_and_d_focus"):
                    startup_capital = 30000.0
                    biz.capital -= startup_capital
                    
                    startup_name = f"{biz.name.split()[0]} Nexus" if len(biz.name.split()) > 0 else "Nexus Startup"
                    if db.query(Business).filter(Business.name == startup_name).first():
                        startup_name = f"{startup_name} {random.randint(10, 99)}"
                    
                    new_startup = Business(
                        name=startup_name,
                        industry=biz.industry if random.random() < 0.7 else random.choice(INDUSTRIES),
                        city=biz.city,
                        country=biz.country,
                        employees=random.randint(1, 4),
                        revenue=12000.0,
                        expenses=10000.0,
                        growth_rate=random.uniform(0.1, 0.3),
                        ai_strategy="aggressive_expansion" if random.random() < 0.6 else "r_and_d_focus",
                        risk_level=20.0,
                        capital=startup_capital,
                        age=0,
                        is_active=True,
                        latitude=biz.latitude,
                        longitude=biz.longitude
                    )
                    db.add(new_startup)
                    startup_count += 1
                    startups_this_run += 1
                    log_event(db, f"{biz.name} launched a new AI startup spin-off: {startup_name} in {biz.city}.", "INFO", "startup")
                    trigger_notification(db, "AI Startup Launched!", f"{biz.name} has spawned a new spin-off startup '{startup_name}' in {biz.city}.", "startup_boom")

                # Action 5: Merge
                elif action_roll < 0.38 and biz.risk_level > 55.0 and biz.capital > 8000:
                    # Look for a merger candidate in same industry
                    candidate = db.query(Business).filter(
                        Business.is_active == True,
                        Business.industry == biz.industry,
                        Business.id != biz.id,
                        Business.risk_level > 50.0
                    ).first()
                    
                    if candidate:
                        # Combine businesses
                        biz.name = f"{biz.name} & {candidate.name} Group"
                        biz.employees = int((biz.employees + candidate.employees) * 0.90) # 10% synergy cut
                        biz.revenue = biz.revenue + candidate.revenue
                        biz.expenses = (biz.expenses + candidate.expenses) * 0.85 # 15% efficiency gain
                        biz.capital = biz.capital + candidate.capital
                        biz.risk_level = (biz.risk_level + candidate.risk_level) / 2.0 - 10.0 # stabilized risk
                        
                        candidate.is_active = False # Deactivate merged candidate
                        merger_count += 1
                        mergers_this_run += 1
                        
                        log_event(db, f"High-risk businesses merged: {biz.name} formed, consolidating operations in {biz.city}.", "INFO", "merger")
                        trigger_notification(db, "Strategic Merger Completed", f"{biz.name} consolidated operations in {biz.city} to stabilize market risk.", "migration")

            # 2. General Economic Spawning (Uncorrelated Entrepreneurship)
            # If GDP/History is healthy, spawn new startups independently
            if len(active_businesses) < 50 and random.random() < 0.30:
                city = random.choice(list(CITIES.keys()))
                new_name = f"GenAI {random.randint(100, 999)} Inc"
                independent_startup = Business(
                    name=new_name,
                    industry=random.choice(INDUSTRIES),
                    city=city,
                    country=CITIES[city]["country"],
                    employees=random.randint(1, 3),
                    revenue=8000.0,
                    expenses=7000.0,
                    growth_rate=random.uniform(0.05, 0.20),
                    ai_strategy=random.choice(STRATEGIES),
                    risk_level=15.0,
                    capital=15000.0,
                    age=0,
                    is_active=True,
                    latitude=CITIES[city]["latitude"],
                    longitude=CITIES[city]["longitude"]
                )
                db.add(independent_startup)
                startup_count += 1
                startups_this_run += 1
                log_event(db, f"New independent AI startup spawned: {new_name} in {city}.", "INFO", "startup")
            
            # Recalculate global metrics
            log_event(db, f"Step {current_step}: Committing monthly agent updates to database...", "INFO", "simulation")
            try:
                db.commit() # commit changes for this month to query accurate numbers
            except Exception as e:
                db.rollback()
                logger.error(f"Database commit failed during simulation agent updates at step {current_step}: {e}")
                raise e
            
            active_businesses = db.query(Business).filter(Business.is_active == True).all()
            total_active = len(active_businesses)
            
            if total_active == 0:
                # Collapse state
                gdp_growth = -10.0
                collapse_risk = 100.0
                avg_revenue = 0.0
                total_capital = 0.0
                total_employees = 0
                average_risk = 100.0
                unemployment_rate = 25.0
            else:
                total_employees = sum(b.employees for b in active_businesses)
                avg_revenue = sum(b.revenue for b in active_businesses) / total_active
                total_capital = sum(b.capital for b in active_businesses)
                average_risk = sum(b.risk_level for b in active_businesses) / total_active
                
                # Estimate GDP growth based on average growth rate of firms
                avg_growth_rate = sum(b.growth_rate for b in active_businesses) / total_active
                gdp_growth = avg_growth_rate * 100.0
                
                # Estimate unemployment rate fluctuation
                # If businesses grew, hiring reduces unemployment. If they collapsed, it increases.
                prev_history = db.query(SimulationHistory).filter(SimulationHistory.step_number == current_step - 1).first()
                if prev_history and prev_history.total_employees is not None and prev_history.total_employees > 0:
                    employee_delta = (total_employees - prev_history.total_employees) / prev_history.total_employees
                    unemployment_rate = max(1.5, min(30.0, unemployment_rate - (employee_delta * 12.0)))
                else:
                    unemployment_rate = 5.0
                
                # Estimate economic collapse risk:
                # High collapse risk triggers if average risk is high, bankruptcy is high, or unemployment is high
                collapse_risk = (average_risk * 0.40) + (unemployment_rate * 2.0)
                if bankrupt_count > 2:
                    collapse_risk += 15.0
                collapse_risk = max(0.0, min(100.0, collapse_risk))
                
            # Create snapshot in database
            history_step = SimulationHistory(
                step_number=current_step,
                total_businesses=total_active,
                total_employees=total_employees,
                avg_revenue=avg_revenue,
                active_startups=startup_count,
                collapse_risk=collapse_risk,
                gdp_growth=gdp_growth,
                migration_count=migration_count,
                total_capital=total_capital,
                unemployment_rate=unemployment_rate,
                average_risk=average_risk,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(history_step)
            db.flush()
            
            # Post alerts based on economic metrics
            if collapse_risk > 70.0:
                trigger_notification(db, "Economic Collapse Warning!", f"Systemic risk has reached {collapse_risk:.1f}%. Unemployment is at {unemployment_rate:.1f}%, signaling high collapse risk.", "collapse_warning")
            if unemployment_rate > 12.0:
                trigger_notification(db, "Employment Decline Detected", f"Unemployment rate has surged to {unemployment_rate:.1f}% as corporations consolidate or bankrupt.", "employment_decline")
            
            log_event(db, f"Step {current_step}: Committing simulation step history snapshot...", "INFO", "simulation")
            try:
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Database commit failed during simulation snapshot at step {current_step}: {e}")
                raise e
            
            log_event(db, f"Finished simulation month step {current_step}. Businesses active: {total_active}, bankruptcies: {bankrupt_count}, mergers: {merger_count}, startups: {startup_count}.", "INFO", "simulation")

        return current_step
