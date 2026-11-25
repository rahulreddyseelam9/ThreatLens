import os

from flask import Blueprint, jsonify
from flask_login import current_user, login_required

from app.models.scan import Scan

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/alerts", methods=["GET"])
@login_required
def list_alerts():
    alert_enabled = os.getenv("EMAIL_ALERTS_ENABLED", "false").strip().lower() == "true"
    email_configured = alert_enabled or bool(os.getenv("SMTP_SERVER") or os.getenv("SMTP_HOST") or os.getenv("MAIL_SERVER"))

    scans = Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc()).all()
    alerts = []

    for scan in scans:
        classification = (scan.classification or "").upper()
        if classification not in {"MEDIUM", "HIGH", "CRITICAL"}:
            continue

        analysis = scan.analysis or {}
        risk = analysis.get("risk", {}) or {}
        reasons = risk.get("reasons") or []
        reason_text = "; ".join(str(item) for item in reasons[:2]) if reasons else f"{classification} risk level detected during the scan."

        alerts.append({
            "scan_id": scan.id,
            "ioc": scan.ioc,
            "classification": classification,
            "reason": reason_text,
            "status": "ACTIVE",
            "timestamp": (scan.updated_at or scan.created_at).isoformat() if (scan.updated_at or scan.created_at) else None,
            "email_alert": classification in {"HIGH", "CRITICAL"} and email_configured,
        })

    return jsonify({
        "success": True,
        "data": {
            "alerts": alerts,
            "email_configured": email_configured,
        },
    }), 200
