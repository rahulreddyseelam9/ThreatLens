from flask import Blueprint, jsonify
from flask_login import current_user, login_required

from app import db
from app.models.recommendation import Recommendation
from app.models.scan import Scan

recommendations_bp = Blueprint("recommendations", __name__)


def _normalize_recommendation(item):
    if isinstance(item, Recommendation):
        text = item.recommendation or "Review the indicator and apply the recommended control."
        priority = (item.priority or "medium").lower()
        return {
            "title": "ThreatLens recommendation",
            "priority": priority,
            "reason": text,
            "action": text,
            "related_ioc": None,
        }

    if isinstance(item, dict):
        priority = str(item.get("priority") or item.get("level") or "medium").lower()
        title = item.get("title") or item.get("name") or "ThreatLens recommendation"
        reason = item.get("reason") or item.get("text") or item.get("recommendation") or item.get("action") or "Review the indicator and apply the recommended control."
        action = item.get("action") or reason
        related_ioc = item.get("related_ioc") or item.get("ioc")
        return {
            "title": title,
            "priority": priority,
            "reason": reason,
            "action": action,
            "related_ioc": related_ioc,
        }

    text = str(item)
    return {
        "title": "ThreatLens recommendation",
        "priority": "medium",
        "reason": text,
        "action": text,
        "related_ioc": None,
    }


@recommendations_bp.route("/recommendations", methods=["GET"])
@login_required
def list_recommendations():
    scans = Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc()).all()
    recommendations = []
    seen = set()

    for scan in scans:
        analysis = scan.analysis or {}
        items = analysis.get("recommendations") or []
        if items:
            for item in items:
                normalized = _normalize_recommendation(item)
                key = (normalized["title"], normalized["reason"], normalized["action"])
                if key in seen:
                    continue
                seen.add(key)
                recommendations.append({**normalized, "related_ioc": normalized.get("related_ioc") or scan.ioc})
            continue

        db_recommendations = Recommendation.query.filter_by(scan_id=scan.id).order_by(Recommendation.created_at.desc()).all()
        for item in db_recommendations:
            normalized = _normalize_recommendation(item)
            key = (normalized["title"], normalized["reason"], normalized["action"])
            if key in seen:
                continue
            seen.add(key)
            recommendations.append({**normalized, "related_ioc": scan.ioc})

    return jsonify({
        "success": True,
        "data": {
            "recommendations": recommendations,
            "count": len(recommendations),
        },
    }), 200
