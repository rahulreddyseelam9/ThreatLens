from collections import Counter

from flask import Blueprint, jsonify
from flask_login import current_user, login_required

from app.models.api_result import APIResult
from app.models.scan import Scan


dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard", methods=["GET"])
@login_required
def dashboard():
    scans = Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc()).all()
    classifications = Counter(scan.classification or "SAFE" for scan in scans)
    provider_activity = Counter()
    emerging_threats = []

    for scan in scans:
        for result in APIResult.query.filter_by(scan_id=scan.id).all():
            provider_activity[result.service_name] += 1

        analysis = scan.analysis or {}
        emerging = analysis.get("emerging_threat") or {}
        classification = emerging.get("classification")
        if classification in {"EMERGING", "POTENTIAL"}:
            emerging_threats.append({
                "id": scan.id,
                "ioc": scan.ioc,
                "ioc_type": scan.ioc_type,
                "classification": classification,
                "risk_score": emerging.get("emerging_threat_score") or scan.risk_score,
                "confidence": emerging.get("confidence"),
                "created_at": scan.created_at.isoformat() if scan.created_at else None,
            })

    return jsonify({
        "success": True,
        "data": {
            "total_scans": len(scans),
            "safe_scans": classifications.get("SAFE", 0),
            "low_risk": classifications.get("LOW", 0),
            "medium_risk": classifications.get("MEDIUM", 0),
            "high_risk": classifications.get("HIGH", 0),
            "critical_risk": classifications.get("CRITICAL", 0),
            "emerging_threats": emerging_threats,
            "emerging_threats_count": len(emerging_threats),
            "recent_scans": [{
                "id": scan.id,
                "ioc": scan.ioc,
                "ioc_type": scan.ioc_type,
                "classification": scan.classification,
                "risk_score": scan.risk_score,
                "created_at": scan.created_at.isoformat() if scan.created_at else None,
            } for scan in scans[:10]],
            "provider_activity": dict(provider_activity),
        }
    }), 200
