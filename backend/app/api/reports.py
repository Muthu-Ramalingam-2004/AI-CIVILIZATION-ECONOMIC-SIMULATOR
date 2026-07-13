from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.report_generator import PDFReportGenerator

router = APIRouter()

@router.get("/export-pdf")
def export_pdf_report(db: Session = Depends(get_db)):
    pdf_buffer = PDFReportGenerator.generate_report(db)
    
    headers = {
        'Content-Disposition': 'attachment; filename="AI_Civilization_Economic_Report.pdf"'
    }
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers=headers
    )
