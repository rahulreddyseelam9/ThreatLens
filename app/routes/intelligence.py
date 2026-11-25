from flask import Blueprint, jsonify
from flask_login import current_user, login_required

from app.models.api_result import APIResult
from app.models.scan import Scan
from app.services.providers.provider_manager import ProviderManager

intelligence_bp = Blueprint("intelligence", __name__)


def _normalize_status(value):
    status = str(value or "unavailable").strip().lower()
    if status in {"success", "available", "positive", "reference"}:
        return "AVAILABLE"
    if status in {"warning", "suspect", "partial"}:
        return "POSITIVE"
    return "UNAVAILABLE"


def _provider_evidence(raw_payload):
    if not isinstance(raw_payload, dict) or not raw_payload:
        return "No provider evidence available."

    if raw_payload.get("malicious") or raw_payload.get("suspicious"):
        return f"{raw_payload.get('malicious', 0)} malicious / {raw_payload.get('suspicious', 0)} suspicious detections."
    if raw_payload.get("abuse_confidence_score") is not None:
        return f"AbuseIPDB confidence: {raw_payload.get('abuse_confidence_score')}/100."
    if raw_payload.get("query_status"):
        return f"URLHaus status: {raw_payload.get('query_status')}."
    if raw_payload.get("pulse_info"):
        pulse_count = (raw_payload.get("pulse_info") or {}).get("count", 0)
        return f"OTX pulse count: {pulse_count}."
    if raw_payload.get("message"):
        return str(raw_payload.get("message"))
    return "Provider responded successfully."


@intelligence_bp.route("/intelligence", methods=["GET"])
@login_required
def list_intelligence():
    provider_manager = ProviderManager()
    provider_names = [provider.provider_name() for provider in provider_manager.providers]
    configured = {
        name: {
            "id": name.lower().replace(" ", "-"),
            "name": name,
            "status": "UNAVAILABLE",
            "evidence": "Not yet queried.",
            "last_result": None,
        }
        for name in provider_names
    }

    scans = Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc()).all()
    query_count = 0
    latest_by_provider = {}

    for scan in scans:
        query_count += APIResult.query.filter_by(scan_id=scan.id).count()
        results = APIResult.query.filter_by(scan_id=scan.id).order_by(APIResult.created_at.desc()).all()
        for result in results:
            provider_name = result.service_name
            if provider_name not in latest_by_provider:
                latest_by_provider[provider_name] = result

    for provider_name, api_result in latest_by_provider.items():
        if provider_name not in configured:
            configured[provider_name] = {
                "id": provider_name.lower().replace(" ", "-"),
                "name": provider_name,
                "status": "UNAVAILABLE",
                "evidence": "No provider evidence available.",
                "last_result": None,
            }

        payload = api_result.result_data or {}
        status = _normalize_status(api_result.status)
        evidence = _provider_evidence(payload)
        if status == "AVAILABLE":
            evidence = evidence or "Provider responded successfully."

        configured[provider_name].update({
            "status": status,
            "evidence": evidence,
            "last_result": {
                "status": api_result.status,
                "at": api_result.created_at.isoformat() if api_result.created_at else None,
                "ioc": Scan.query.get(api_result.scan_id).ioc if api_result.scan_id else None,
            },
        })

    providers = list(configured.values())
    return jsonify({
        "success": True,
        "data": {
            "providers": providers,
            "queries": query_count,
            "provider_count": len(providers),
        },
    }), 200
