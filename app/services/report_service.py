import os
from datetime import datetime

from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app import db
from app.models.report import Report
from app.models.scan import Scan


class ReportService:
    def __init__(self, base_dir=None):
        self.base_dir = base_dir or os.path.join(os.getcwd(), "app", "reports")
        os.makedirs(self.base_dir, exist_ok=True)

    def generate_report(self, scan_id, report_type="pdf"):
        scan = db.session.get(Scan, scan_id)
        if not scan:
            raise ValueError("Scan not found")

        report_type = (report_type or "pdf").lower()
        if report_type == "xlsx":
            report_type = "excel"
        stamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        extension = "xlsx" if report_type == "excel" else report_type
        file_name = f"scan_{scan_id}_{stamp}.{extension}"
        file_path = os.path.join(self.base_dir, file_name)

        if report_type == "pdf":
            self._create_pdf(scan, file_path)
        elif report_type == "excel":
            self._create_excel(scan, file_path)
        else:
            raise ValueError("Unsupported report format")

        report = Report(scan_id=scan.id, report_type=report_type, file_path=file_path)
        db.session.add(report)
        db.session.commit()
        return file_path

    @staticmethod
    def _create_pdf(scan, file_path):
        analysis = scan.analysis or {}
        risk = analysis.get("risk", {})
        canvas_obj = canvas.Canvas(file_path, pagesize=letter)
        canvas_obj.setTitle(f"ThreatLens report for {scan.ioc}")
        canvas_obj.drawString(72, 750, "ThreatLens")
        canvas_obj.drawString(72, 730, f"IOC: {scan.ioc}")
        canvas_obj.drawString(72, 710, f"IOC Type: {scan.ioc_type}")
        canvas_obj.drawString(72, 690, f"Risk Score: {risk.get('risk_score', scan.risk_score or 0)}")
        canvas_obj.drawString(72, 670, f"Classification: {risk.get('classification', scan.classification or 'SAFE')}")
        canvas_obj.drawString(72, 650, "Recommendations:")
        y = 630
        for line in [f"- {item}" for item in (risk.get("reasons") or [])[:5]]:
            canvas_obj.drawString(72, y, line[:100])
            y -= 18
        canvas_obj.save()

    @staticmethod
    def _create_excel(scan, file_path):
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "ThreatLens"
        sheet.append(["IOC", "IOC Type", "Risk Score", "Classification", "Created At"])
        analysis = scan.analysis or {}
        risk = analysis.get("risk", {})
        sheet.append([scan.ioc, scan.ioc_type, risk.get("risk_score", scan.risk_score or 0), risk.get("classification", scan.classification or "SAFE"), scan.created_at.isoformat() if scan.created_at else ""])
        workbook.save(file_path)
