import os

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app import db
from app.models.api_result import APIResult
from app.models.scan import Scan
from app.services.email_service import build_alert_body, send_alert_email
from app.services.ioc_validator import identify_ioc_type, normalize_ioc_for_lookup
from app.services.providers.provider_manager import ProviderManager
from app.services.scan_analysis_service import analyze_scan

scan_bp = Blueprint("scan", __name__)


def _validation_error(code, message):
    return jsonify({
        "success": False,
        "error": {"code": code, "message": message},
        "detail": message,
    }), 400


@scan_bp.route("/scan", methods=["POST"])
@login_required
def scan_ioc():
    data = request.get_json(silent=True) or {}
    ioc = data.get("ioc")
    if not isinstance(ioc, str):
        return _validation_error("VALIDATION_ERROR", "IOC must be a string.")

    ioc = ioc.strip()
    if not ioc:
        return _validation_error("VALIDATION_ERROR", "IOC is required.")

    ioc_type = identify_ioc_type(ioc)
    if ioc_type == "UNKNOWN":
        return _validation_error(
            "INVALID_IOC",
            "Enter a valid IP address, HTTP(S) URL, domain, MD5, SHA1, or SHA256 indicator.",
        )

    scan = Scan(user_id=current_user.id, ioc=ioc, ioc_type=ioc_type, classification="PENDING", risk_score=0.0, status="pending")
    db.session.add(scan)
    db.session.commit()

    provider_manager = ProviderManager()
    lookup_ioc = normalize_ioc_for_lookup(ioc, ioc_type)
    results = provider_manager.collect_intelligence(lookup_ioc, ioc_type)

    for provider_result in results:
        status = str(provider_result.get("status", "ERROR")).lower()
        if status in {"not_supported", "reference"}:
            status = "unavailable"
        elif status == "failed":
            status = "error"
        elif status == "success":
            status = "success"

        api_result = APIResult(
            scan_id=scan.id,
            service_name=provider_result.get("service_name", "Unknown"),
            status=status,
            result_data=provider_result.get("data") or {"message": provider_result.get("message")},
        )
        db.session.add(api_result)

    db.session.commit()

    try:
        analysis = analyze_scan(scan.id)
        scan.analysis = analysis
        scan.status = "completed"
        classification = str(analysis.get("risk", {}).get("classification", "SAFE")).upper()
        scan.classification = classification
        scan.risk_score = float(analysis.get("risk", {}).get("risk_score", 0.0) or 0.0)
        scan.confidence = float(analysis.get("risk", {}).get("confidence", 0.0) or 0.0)
        db.session.commit()

        if classification in {"HIGH", "CRITICAL"} and getattr(current_user, "email", None):
            if os.getenv("EMAIL_ALERTS_ENABLED", "false").lower() == "true":
                try:
                    body = build_alert_body(
                        scan.ioc,
                        scan.ioc_type,
                        classification,
                        scan.risk_score,
                        scan.confidence,
                        analysis,
                    )
                    send_alert_email(
                        current_user.email,
                        f"ThreatLens Alert: {classification} - {scan.ioc}",
                        body,
                    )
                except Exception:
                    pass

        return jsonify({"success": True, "message": "IOC scanned successfully.", "data": analysis}), 201
    except Exception as exc:
        scan.status = "partial"
        db.session.commit()
        return jsonify({"success": True, "message": "IOC stored but analysis was incomplete.", "data": {"scan_id": scan.id, "ioc": ioc, "ioc_type": ioc_type, "providers": results}, "error": str(exc)}), 200


@scan_bp.route("/scans", methods=["GET"])
@login_required
def list_scans():
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 10)), 1), 50)
    query = Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc())
    total = query.count()
    scans = query.offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({
        "success": True,
        "data": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "items": [{
                "id": scan.id,
                "ioc": scan.ioc,
                "ioc_type": scan.ioc_type,
                "classification": scan.classification,
                "risk_score": scan.risk_score,
                "confidence": scan.confidence,
                "status": scan.status,
                "created_at": scan.created_at.isoformat() if scan.created_at else None,
            } for scan in scans]
        }
    }), 200


@scan_bp.route("/scans/<int:scan_id>", methods=["GET"])
@login_required
def get_scan(scan_id):
    scan = Scan.query.filter_by(id=scan_id, user_id=current_user.id).first()
    if not scan:
        return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Scan not found."}}), 404

    analysis = scan.analysis or analyze_scan(scan.id)
    return jsonify({"success": True, "data": {
        "id": scan.id,
        "ioc": scan.ioc,
        "ioc_type": scan.ioc_type,
        "classification": scan.classification,
        "risk_score": scan.risk_score,
        "confidence": scan.confidence,
        "analysis": analysis,
        "created_at": scan.created_at.isoformat() if scan.created_at else None,
    }}), 200
