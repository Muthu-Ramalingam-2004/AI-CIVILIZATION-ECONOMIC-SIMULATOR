from io import BytesIO
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from sqlalchemy.orm import Session
from app.models.business import Business
from app.models.history import SimulationHistory

class PDFReportGenerator:
    @staticmethod
    def generate_report(db: Session) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Define Custom Styles for a high-quality look
        title_style = ParagraphStyle(
            name="TitleStyle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=24,
            textColor=colors.HexColor("#1A365D"),  # Deep Navy Blue
            spaceAfter=15,
            alignment=1  # Centered
        )
        
        header_style = ParagraphStyle(
            name="HeaderStyle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            textColor=colors.HexColor("#2C5282"),
            spaceBefore=15,
            spaceAfter=10,
            keepWithNext=True
        )

        body_style = ParagraphStyle(
            name="BodyStyle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=colors.HexColor("#2D3748"),
            spaceAfter=8
        )

        table_header_style = ParagraphStyle(
            name="TableHeaderStyle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=colors.white
        )

        table_body_style = ParagraphStyle(
            name="TableBodyStyle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=colors.HexColor("#2D3748")
        )

        story = []

        # 1. Header Section
        story.append(Paragraph("AI Civilization Economic Simulator", title_style))
        story.append(Paragraph(f"Executive Economic Report - Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", body_style))
        story.append(Spacer(1, 10))

        # Divider line
        story.append(Table([[""]], colWidths=[540], rowHeights=[2], style=TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#3182CE")),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ])))
        story.append(Spacer(1, 15))

        # 2. Economic Summary Section
        story.append(Paragraph("1. Global Economic Indicators Summary", header_style))
        
        last_history = db.query(SimulationHistory).order_by(SimulationHistory.step_number.desc()).first()
        active_businesses = db.query(Business).filter(Business.is_active == True).all()
        
        if last_history:
            total_biz = last_history.total_businesses
            total_emp = last_history.total_employees
            avg_rev = last_history.avg_revenue
            gdp = last_history.gdp_growth
            collapse = last_history.collapse_risk
            unemp = last_history.unemployment_rate
        else:
            total_biz = len(active_businesses)
            total_emp = sum(b.employees for b in active_businesses)
            avg_rev = sum(b.revenue for b in active_businesses) / len(active_businesses) if active_businesses else 0.0
            gdp = 3.0
            collapse = 10.0
            unemp = 5.0

        summary_data = [
            [
                Paragraph("Indicator", table_header_style), 
                Paragraph("Value", table_header_style),
                Paragraph("Health / Alert Status", table_header_style)
            ],
            [
                Paragraph("Total Active Businesses", table_body_style), 
                Paragraph(f"{total_biz}", table_body_style),
                Paragraph("Stable" if total_biz > 15 else "Critical Underpopulation", table_body_style)
            ],
            [
                Paragraph("Total Workforce (Employees)", table_body_style), 
                Paragraph(f"{total_emp:,}", table_body_style),
                Paragraph("Expanding" if gdp > 2.0 else "Contraction", table_body_style)
            ],
            [
                Paragraph("Average Monthly Revenue", table_body_style), 
                Paragraph(f"${avg_rev:,.2f}", table_body_style),
                Paragraph("Optimized" if avg_rev > 12000 else "Moderate Margins", table_body_style)
            ],
            [
                Paragraph("GDP Growth Estimate", table_body_style), 
                Paragraph(f"{gdp:.2f}%", table_body_style),
                Paragraph("Strong Expansion" if gdp > 3.0 else ("Recession Warning" if gdp < 0.0 else "Healthy"), table_body_style)
            ],
            [
                Paragraph("Unemployment Rate", table_body_style), 
                Paragraph(f"{unemp:.2f}%", table_body_style),
                Paragraph("Full Employment" if unemp < 4.0 else ("Unemployment Hazard" if unemp > 10.0 else "Normal"), table_body_style)
            ],
            [
                Paragraph("Economic Collapse Risk", table_body_style), 
                Paragraph(f"{collapse:.2f}%", table_body_style),
                Paragraph("SAFE" if collapse < 30.0 else ("CRITICAL RISK" if collapse > 70.0 else "ELEVATED RISK"), table_body_style)
            ]
        ]

        summary_table = Table(summary_data, colWidths=[200, 140, 200])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2C5282")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F7FAFC")]),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 15))

        # 3. Active Businesses List
        story.append(Paragraph("2. Active Business Agent Roster", header_style))
        story.append(Paragraph("Below is a catalog of the currently active autonomous AI business agents in the simulator, including their location, headcount, capital, and risk levels.", body_style))
        
        biz_data = [
            [
                Paragraph("Business Name", table_header_style), 
                Paragraph("Industry", table_header_style), 
                Paragraph("Location", table_header_style), 
                Paragraph("Employees", table_header_style), 
                Paragraph("Capital", table_header_style),
                Paragraph("Risk", table_header_style)
            ]
        ]
        
        # Sort businesses by name, showing top 25 max to keep report compact and printable
        sorted_biz = sorted(active_businesses, key=lambda b: b.name)[:25]
        
        for b in sorted_biz:
            biz_data.append([
                Paragraph(b.name, table_body_style),
                Paragraph(b.industry, table_body_style),
                Paragraph(f"{b.city}, {b.country}", table_body_style),
                Paragraph(f"{b.employees}", table_body_style),
                Paragraph(f"${b.capital:,.0f}", table_body_style),
                Paragraph(f"{b.risk_level:.1f}%", table_body_style)
            ])
            
        biz_table = Table(biz_data, colWidths=[120, 90, 120, 60, 90, 60])
        biz_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#4A5568")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#EDF2F7")]),
        ]))
        story.append(biz_table)
        
        if len(active_businesses) > 25:
            story.append(Spacer(1, 5))
            story.append(Paragraph(f"* Showing top 25 out of {len(active_businesses)} active businesses. Use system dashboard to inspect full listing.", table_body_style))

        story.append(Spacer(1, 20))
        story.append(Paragraph("This economic simulator report compiles machine learning forecasts and agent telemetry in real-time. Discrepancies in growth patterns represent simulated agent autonomy, market competition, and random structural shocks.", table_body_style))

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
