from flask import Blueprint, jsonify
from flask_login import current_user, login_required

from app.models.scan import Scan

ai_analysis_bp = Blueprint("ai_analysis", __name__)


@ai_analysis_bp.route("/ai-analysis", methods=["GET"])
@login_required
def get_ai_analysis():
    scan = Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc()).first()

    if not scan:
        return jsonify({
            "success": True,
            "data": {
                "scan": None,
                "message": "No scan history is available yet.",
            },
        }), 200

    analysis = scan.analysis or {}
    ai_summary = analysis.get("ai") or analysis.get("ml_prediction") or {}
    risk = analysis.get("risk") or {}

    return jsonify({
        "success": True,
        "data": {
            "scan_id": scan.id,
            "ioc": scan.ioc,
            "ioc_type": scan.ioc_type,
            "risk_score": scan.risk_score,
            "classification": scan.classification,
            "confidence": scan.confidence,
            "ai": ai_summary,
            "risk": risk,
        },
    }), 200
