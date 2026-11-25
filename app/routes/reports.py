from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app.models.report import Report
from app.models.scan import Scan
from app.services.report_service import ReportService

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/reports", methods=["GET"])
@login_required
def list_reports():
    reports = Report.query.join(Scan).filter(Scan.user_id == current_user.id).order_by(Report.created_at.desc()).all()
    items = []
    for report in reports:
        items.append({
            "id": report.id,
            "scan_id": report.scan_id,
            "report_type": report.report_type,
            "format": report.report_type,
            "scope": "all",
            "count": 1,
            "file_path": report.file_path,
            "created_at": report.created_at.isoformat() if report.created_at else None,
        })
    return jsonify({"success": True, "data": items}), 200


@reports_bp.route("/reports/<int:report_id>/download", methods=["GET"])
@login_required
def download_report(report_id):
    report = Report.query.join(Scan).filter(Report.id == report_id, Scan.user_id == current_user.id).first()
    if not report:
        return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Report not found."}}), 404
    if not report.file_path or not report.file_path:
        return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Report file is missing."}}), 404
    try:
        with open(report.file_path, "rb") as fh:
            payload = fh.read()
    except FileNotFoundError:
        return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Report file is missing."}}), 404
    from flask import Response
    return Response(payload, mimetype="application/pdf" if report.report_type == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f'attachment; filename="{report.file_path.split("/")[-1]}"'})


@reports_bp.route("/reports/generate", methods=["POST"])
@login_required
def generate_report():
    data = request.get_json(silent=True) or {}
    scan_id = data.get("scan_id")
    report_type = str(data.get("format", "pdf") or "pdf").lower()
    scope = str(data.get("scope", "all") or "all").lower()

    if not scan_id:
        scan = Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc()).first()
        if not scan:
            return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "No scans available for report generation."}}), 404
    else:
        scan = Scan.query.filter_by(id=scan_id, user_id=current_user.id).first()
        if not scan:
            return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Scan not found."}}), 404

    file_path = ReportService().generate_report(scan.id, report_type)
    report = Report.query.filter_by(scan_id=scan.id, report_type=report_type).order_by(Report.created_at.desc()).first()
    return jsonify({
        "success": True,
        "message": "Report generated.",
        "data": {
            "id": report.id if report else 0,
            "scan_id": scan.id,
            "report_type": report_type,
            "format": report_type,
            "scope": scope,
            "count": 1,
            "file_path": file_path,
        }
    }), 201
