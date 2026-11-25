from flask import Blueprint, jsonify
from flask_login import current_user, login_required

from app.models.scan import Scan
from app.services.scan_analysis_service import analyze_scan

emerging_bp = Blueprint("emerging", __name__)


@emerging_bp.route("/emerging", methods=["GET"])
@login_required
def list_emerging():
    items = []
    for scan in Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc()).all():
        try:
            analysis = analyze_scan(scan.id)
        except Exception:
            continue
        classification = analysis.get("emerging_threat", {}).get("classification", "NORMAL")
        if classification in {"EMERGING", "POTENTIAL"}:
            items.append({
                "scan_id": scan.id,
                "ioc": scan.ioc,
                "ioc_type": scan.ioc_type,
                "classification": classification,
                "emerging_threat_score": analysis.get("emerging_threat", {}).get("emerging_threat_score", 0),
            })
    return jsonify({"success": True, "data": items}), 200


@emerging_bp.route("/emerging/<int:scan_id>", methods=["GET"])
@login_required
def emerging_detail(scan_id):
    scan = Scan.query.filter_by(id=scan_id, user_id=current_user.id).first()
    if not scan:
        return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Scan not found."}}), 404
    analysis = analyze_scan(scan.id)
    return jsonify({"success": True, "data": analysis.get("emerging_threat", {})}), 200
