import os

import pytest
import requests

from app import create_app, db
from app.services.providers.urlhaus_provider import URLHausProvider
from app.models.scan import Scan
from app.services.email_service import send_alert_email
from app.services.emerging_threat_service import calculate_emerging_threat
from app.services.ioc_validator import identify_ioc_type, normalize_ioc_for_lookup
from app.services.intelligence_correlation_service import correlate_intelligence
from app.services.ml.explainer import Explainer
from app.services.ml.predictor import ThreatPredictor
from app.services.recommendation_service import RecommendationService
from app.services.risk_service import calculate_risk


@pytest.fixture()
def app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite://",
        "WTF_CSRF_ENABLED": False,
    })
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def register_user(client, username="alice", email="alice@example.com", password="secretpass"):
    response = client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    return response


def login_user(client, username="alice", password="secretpass"):
    response = client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )
    return response


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["app"] == "ok"
    assert payload["database"]["status"] in {"connected", "error"}


def test_auth_flow(client):
    response = register_user(client)
    assert response.status_code == 201
    payload = response.get_json()
    assert payload["success"] is True

    response = client.get("/api/auth/me")
    assert response.status_code == 401

    response = login_user(client)
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["user"]["username"] == "alice"

    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.get_json()["user"]["email"] == "alice@example.com"

    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.get_json()["success"] is True


def test_recommendations_endpoint(client, monkeypatch):
    def fake_collect(self, ioc, ioc_type):
        return [
            {"service_name": "VirusTotal", "status": "success", "data": {"malicious": 5, "suspicious": 1, "harmless": 8, "undetected": 2, "timeout": 0}},
            {"service_name": "AbuseIPDB", "status": "success", "data": {"abuse_confidence_score": 75, "total_reports": 12}},
            {"service_name": "AlienVault OTX", "status": "success", "data": {"reputation": 65, "pulse_info": {"count": 6}}},
            {"service_name": "URLHaus", "status": "success", "data": {"query_status": "listed"}},
        ]

    monkeypatch.setattr("app.services.providers.provider_manager.ProviderManager.collect_intelligence", fake_collect)
    assert register_user(client).status_code == 201
    assert login_user(client).status_code == 200

    response = client.post("/api/scan", json={"ioc": "example.com"})
    assert response.status_code == 201

    recommendations = client.get("/api/recommendations")
    assert recommendations.status_code == 200
    payload = recommendations.get_json()
    assert payload["success"] is True
    assert "recommendations" in payload["data"]


def test_ioc_validation_helpers():
    assert identify_ioc_type("8.8.8.8") == "IP"
    assert identify_ioc_type("https://example.com") == "URL"
    assert identify_ioc_type("hxxp://192.0.2.145/invoice.exe") == "URL"
    assert identify_ioc_type("hxxps://example.com/login") == "URL"
    assert identify_ioc_type("example.com") == "DOMAIN"
    assert identify_ioc_type("1.1.1.1") == "IP"
    assert identify_ioc_type("d41d8cd98f00b204e9800998ecf8427e") == "MD5"
    assert identify_ioc_type("da39a3ee5e6b4b0d3255bfef95601890afd80709") == "SHA1"
    assert identify_ioc_type(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    ) == "SHA256"
    assert identify_ioc_type("invalid_ioc") == "UNKNOWN"
    assert identify_ioc_type("http://example.com:invalid") == "UNKNOWN"
    assert normalize_ioc_for_lookup("hxxp://192.0.2.145/invoice.exe", "URL") == "http://192.0.2.145/invoice.exe"
    assert normalize_ioc_for_lookup("hxxps://example.com/login", "URL") == "https://example.com/login"


def test_scan_endpoint_accepts_defanged_url_and_returns_clear_validation(client, monkeypatch):
    def fake_collect(self, ioc, ioc_type):
        assert ioc_type in {"IP", "URL", "DOMAIN", "MD5", "SHA1", "SHA256"}
        if ioc_type == "URL":
            assert ioc == "http://192.0.2.145/invoice.exe"
        return [
            {"service_name": "VirusTotal", "status": "success", "data": {"malicious": 0, "suspicious": 0, "harmless": 1, "undetected": 1, "timeout": 0}},
        ]

    monkeypatch.setattr("app.services.providers.provider_manager.ProviderManager.collect_intelligence", fake_collect)
    assert register_user(client).status_code == 201
    assert login_user(client).status_code == 200

    invalid_response = client.post(
        "/api/scan",
        json={"ioc": "not-an-indicator", "ioc_type": "url"},
    )
    assert invalid_response.status_code == 400
    invalid_payload = invalid_response.get_json()
    assert invalid_payload["error"]["code"] == "INVALID_IOC"
    assert invalid_payload["detail"] == invalid_payload["error"]["message"]

    indicators = [
        ("1.1.1.1", "IP"),
        ("hxxp://192.0.2.145/invoice.exe", "URL"),
        ("example.com", "DOMAIN"),
        ("d41d8cd98f00b204e9800998ecf8427e", "MD5"),
        ("da39a3ee5e6b4b0d3255bfef95601890afd80709", "SHA1"),
        ("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "SHA256"),
    ]
    for ioc, expected_type in indicators:
        response = client.post(
            "/api/scan",
            json={"ioc": ioc, "ioc_type": expected_type.lower()},
        )
        assert response.status_code == 201
        payload = response.get_json()
        assert payload["success"] is True
        assert payload["data"]["ioc"] == ioc
        assert payload["data"]["ioc_type"] == expected_type
        assert "risk" in payload["data"]

    history_response = client.get("/api/scans")
    assert history_response.status_code == 200
    assert history_response.get_json()["data"]["total"] == len(indicators)


def test_risk_and_correlation_services():
    vt_stats = {"malicious": 10, "suspicious": 3, "harmless": 5, "undetected": 2, "timeout": 0}
    risk = calculate_risk(vt_stats=vt_stats, abuseipdb_data={"abuse_confidence_score": 80}, otx_data={"reputation": 60, "pulse_info": {"count": 8}}, urlhaus_data={"query_status": "listed"})
    assert risk["risk_score"] >= 0
    assert risk["classification"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    normalized = [
        {"provider": "VirusTotal", "available": True, "risk_signal": 85, "positive_evidence": True, "evidence": ["malicious"], "details": {}},
        {"provider": "AbuseIPDB", "available": True, "risk_signal": 80, "positive_evidence": True, "evidence": ["abuse"], "details": {}},
        {"provider": "URLHaus", "available": True, "risk_signal": 100, "positive_evidence": True, "evidence": ["listed"], "details": {}},
    ]
    correlation = correlate_intelligence(normalized)
    assert correlation["positive_provider_count"] >= 2
    assert correlation["correlation_classification"] in {"MULTI_SOURCE", "STRONG_MULTI_SOURCE"}


def test_emerging_threat_service():
    result = calculate_emerging_threat(risk_score=90, malicious=10, suspicious=2, first_seen=None, recent_observations=5, related_ioc_count=3, provider_evidence_count=3)
    assert result["classification"] in {"EMERGING", "POTENTIAL", "NORMAL"}
    assert 0 <= result["emerging_threat_score"] <= 100


def test_scan_workflow_with_mocked_provider_results(client, monkeypatch):
    def fake_collect(self, ioc, ioc_type):
        return [
            {"service_name": "VirusTotal", "status": "success", "data": {"malicious": 5, "suspicious": 1, "harmless": 8, "undetected": 2, "timeout": 0}},
            {"service_name": "AbuseIPDB", "status": "success", "data": {"abuse_confidence_score": 75, "total_reports": 12}},
            {"service_name": "AlienVault OTX", "status": "success", "data": {"reputation": 65, "pulse_info": {"count": 6}}},
            {"service_name": "URLHaus", "status": "success", "data": {"query_status": "listed"}},
            {"service_name": "Cisco Talos", "status": "reference", "data": {"reference": "https://talosintelligence.com/reputation_center/analysis?ip=8.8.8.8"}},
        ]

    monkeypatch.setattr("app.services.providers.provider_manager.ProviderManager.collect_intelligence", fake_collect)

    response = register_user(client)
    assert response.status_code == 201
    assert login_user(client).status_code == 200

    response = client.post("/api/scan", json={"ioc": "8.8.8.8"})
    assert response.status_code == 201
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["data"]["scan_id"] > 0
    assert payload["data"]["risk"]["classification"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}

    response = client.get("/api/scans")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["total"] >= 1


def test_dashboard_and_emerging_endpoints(client, monkeypatch):
    def fake_collect(self, ioc, ioc_type):
        return [
            {"service_name": "VirusTotal", "status": "success", "data": {"malicious": 2, "suspicious": 1, "harmless": 10, "undetected": 5, "timeout": 0}},
            {"service_name": "URLHaus", "status": "success", "data": {"query_status": "listed"}},
        ]

    monkeypatch.setattr("app.services.providers.provider_manager.ProviderManager.collect_intelligence", fake_collect)
    assert register_user(client).status_code == 201
    assert login_user(client).status_code == 200
    scan_response = client.post("/api/scan", json={"ioc": "example.com"})
    assert scan_response.status_code == 201
    scan_id = scan_response.get_json()["data"]["scan_id"]

    response = client.get("/api/dashboard")
    assert response.status_code == 200
    payload = response.get_json()["data"]
    assert payload["total_scans"] >= 1
    assert "provider_activity" in payload

    response = client.get(f"/api/emerging/{scan_id}")
    assert response.status_code == 200
    assert response.get_json()["success"] is True


def test_reports_generation_endpoint(client, monkeypatch):
    def fake_collect(self, ioc, ioc_type):
        return [{"service_name": "VirusTotal", "status": "success", "data": {"malicious": 1, "suspicious": 0, "harmless": 10, "undetected": 2, "timeout": 0}}]

    monkeypatch.setattr("app.services.providers.provider_manager.ProviderManager.collect_intelligence", fake_collect)
    assert register_user(client).status_code == 201
    assert login_user(client).status_code == 200
    scan_response = client.post("/api/scan", json={"ioc": "8.8.4.4"})
    assert scan_response.status_code == 201
    scan_id = scan_response.get_json()["data"]["scan_id"]

    response = client.post("/api/reports/generate", json={"scan_id": scan_id, "format": "pdf"})
    assert response.status_code == 201
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["data"]["file_path"].endswith(".pdf")

    response = client.get("/api/reports")
    assert response.status_code == 200
    assert response.get_json()["data"]


def test_recommendation_and_ml_services():
    scan = type("Scan", (), {"id": 42, "ioc": "8.8.8.8", "ioc_type": "IP"})()
    analysis = {
        "risk": {"risk_score": 85, "classification": "HIGH"},
        "correlation": {"positive_provider_count": 3},
        "virustotal": {"malicious": 5, "suspicious": 1},
    }
    recommendations = RecommendationService.generate_recommendations(scan, analysis)
    assert recommendations and recommendations[0]["priority"] in {"high", "medium", "low"}

    predictor = ThreatPredictor()
    prediction = predictor.predict({
        "risk": {"risk_score": 85, "classification": "HIGH"},
        "virustotal": {"malicious": 10, "suspicious": 0},
        "correlation": {"positive_provider_count": 3},
    })
    assert prediction["prediction"] in {"SAFE", "SUSPICIOUS", "HIGH_RISK"}
    explanation = Explainer.explain({"risk": {"risk_score": 85}, "virustotal": {"malicious": 10}, "correlation": {"positive_provider_count": 3}}, prediction)
    assert "reasons" in explanation


def test_urlhaus_provider_positive_lookup(monkeypatch):
    class FakeResponse:
        status_code = 200
        text = '{"query_status": "listed", "url": "https://malicious.example/path", "threat": "phishing"}'

        def json(self):
            return {"query_status": "listed", "url": "https://malicious.example/path", "threat": "phishing"}

    def fake_post(url, headers=None, data=None, timeout=15):
        assert url == "https://urlhaus-api.abuse.ch/v1/url/"
        assert headers == {"Auth-Key": "test-urlhaus-key"}
        assert data == {"url": "https://malicious.example/path"}
        assert timeout == 15
        return FakeResponse()

    monkeypatch.setenv("URLHAUS_AUTH_KEY", "test-urlhaus-key")
    monkeypatch.setattr("app.services.providers.urlhaus_provider.requests.post", fake_post)

    result = URLHausProvider().lookup("https://malicious.example/path", "URL")
    assert result["status"] == "success"
    assert result["data"]["query_status"] == "listed"
    assert result["data"]["threat"] == "phishing"


def test_urlhaus_provider_clean_lookup(monkeypatch):
    class FakeResponse:
        status_code = 200
        text = '{"query_status": "no_results"}'

        def json(self):
            return {"query_status": "no_results"}

    monkeypatch.setenv("URLHAUS_AUTH_KEY", "test-urlhaus-key")
    monkeypatch.setattr("app.services.providers.urlhaus_provider.requests.post", lambda *args, **kwargs: FakeResponse())

    result = URLHausProvider().lookup("https://clean.example", "URL")
    assert result["status"] == "success"
    assert result["data"]["query_status"] == "no_results"


def test_urlhaus_provider_missing_key(monkeypatch):
    monkeypatch.delenv("URLHAUS_AUTH_KEY", raising=False)
    result = URLHausProvider().lookup("https://example.com", "URL")
    assert result["status"] == "error"
    assert result["data"] == {}
    assert "URLHAUS_AUTH_KEY" in result["message"]


def test_urlhaus_provider_network_failure(monkeypatch):
    def fake_post(*args, **kwargs):
        raise requests.RequestException("timed out")

    monkeypatch.setenv("URLHAUS_AUTH_KEY", "test-urlhaus-key")
    monkeypatch.setattr("app.services.providers.urlhaus_provider.requests.post", fake_post)

    result = URLHausProvider().lookup("https://example.com", "URL")
    assert result["status"] == "error"
    assert result["http_status"] is None
    assert "timed out" in result["message"]


def test_urlhaus_provider_rejects_ip_ioc(monkeypatch):
    monkeypatch.setenv("URLHAUS_AUTH_KEY", "test-urlhaus-key")
    result = URLHausProvider().lookup("8.8.8.8", "IP")
    assert result["status"] == "not_supported"


def test_email_alert_service_graceful_failure(monkeypatch):
    monkeypatch.delenv("EMAIL_ALERTS_ENABLED", raising=False)
    monkeypatch.delenv("SMTP_HOST", raising=False)
    monkeypatch.delenv("SMTP_USER", raising=False)
    monkeypatch.delenv("SMTP_PASSWORD", raising=False)
    monkeypatch.delenv("EMAIL_FROM", raising=False)
    assert send_alert_email("user@example.com", "Test", "body") is False


def test_email_service_uses_mocked_smtp(monkeypatch):
    class FakeSMTP:
        def __init__(self, host, port):
            self.host = host
            self.port = port

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def starttls(self):
            self.tls = True

        def login(self, username, password):
            self.username = username
            self.password = password

        def send_message(self, message):
            self.message = message

    monkeypatch.setenv("EMAIL_ALERTS_ENABLED", "true")
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USER", "user")
    monkeypatch.setenv("SMTP_PASSWORD", "secret")
    monkeypatch.setenv("EMAIL_FROM", "alerts@example.com")
    monkeypatch.setattr("app.services.email_service.smtplib.SMTP", FakeSMTP)

    assert send_alert_email("recipient@example.com", "Test", "body") is True


def test_scan_triggers_email_on_high_risk(client, monkeypatch):
    calls = []

    def fake_collect(self, ioc, ioc_type):
        return [{
            "service_name": "VirusTotal",
            "status": "success",
            "data": {"malicious": 5, "suspicious": 5, "harmless": 0, "undetected": 0, "timeout": 0},
        }]

    monkeypatch.setenv("EMAIL_ALERTS_ENABLED", "true")
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USER", "user")
    monkeypatch.setenv("SMTP_PASSWORD", "secret")
    monkeypatch.setenv("EMAIL_FROM", "alerts@example.com")
    monkeypatch.setattr("app.services.providers.provider_manager.ProviderManager.collect_intelligence", fake_collect)
    monkeypatch.setattr("app.routes.scan.send_alert_email", lambda to_address, subject, body: calls.append((to_address, subject, body)) or True)

    response = register_user(client, username="alice_high", email="alice_high@example.com", password="StrongPass123!")
    assert response.status_code == 201
    assert login_user(client, username="alice_high", password="StrongPass123!").status_code == 200

    response = client.post("/api/scan", json={"ioc": "8.8.8.8"})
    assert response.status_code == 201
    assert len(calls) == 1
    assert calls[0][0] == "alice_high@example.com"
    assert "ThreatLens" in calls[0][2]
    assert "8.8.8.8" in calls[0][2]


def test_scan_triggers_email_on_critical_risk(client, monkeypatch):
    calls = []

    def fake_collect(self, ioc, ioc_type):
        return [{
            "service_name": "VirusTotal",
            "status": "success",
            "data": {"malicious": 10, "suspicious": 0, "harmless": 0, "undetected": 0, "timeout": 0},
        }]

    monkeypatch.setenv("EMAIL_ALERTS_ENABLED", "true")
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USER", "user")
    monkeypatch.setenv("SMTP_PASSWORD", "secret")
    monkeypatch.setenv("EMAIL_FROM", "alerts@example.com")
    monkeypatch.setattr("app.services.providers.provider_manager.ProviderManager.collect_intelligence", fake_collect)
    monkeypatch.setattr("app.routes.scan.send_alert_email", lambda to_address, subject, body: calls.append((to_address, subject, body)) or True)

    response = register_user(client, username="alice_critical", email="alice_critical@example.com", password="StrongPass123!")
    assert response.status_code == 201
    assert login_user(client, username="alice_critical", password="StrongPass123!").status_code == 200

    response = client.post("/api/scan", json={"ioc": "8.8.8.8"})
    assert response.status_code == 201
    assert len(calls) == 1
    assert calls[0][0] == "alice_critical@example.com"
    assert "CRITICAL" in calls[0][1]


def test_scan_skips_alert_for_medium_low_safe(client, monkeypatch):
    for provider_data, expected_status in [
        ({"malicious": 3, "suspicious": 3, "harmless": 2, "undetected": 2, "timeout": 0}, "MEDIUM"),
        ({"malicious": 1, "suspicious": 0, "harmless": 10, "undetected": 0, "timeout": 0}, "LOW"),
        ({"malicious": 0, "suspicious": 0, "harmless": 10, "undetected": 0, "timeout": 0}, "SAFE"),
    ]:
        calls = []

        def fake_collect(self, ioc, ioc_type, provider_data=provider_data):
            return [{"service_name": "VirusTotal", "status": "success", "data": provider_data}]

        monkeypatch.setenv("EMAIL_ALERTS_ENABLED", "true")
        monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
        monkeypatch.setenv("SMTP_PORT", "587")
        monkeypatch.setenv("SMTP_USER", "user")
        monkeypatch.setenv("SMTP_PASSWORD", "secret")
        monkeypatch.setenv("EMAIL_FROM", "alerts@example.com")
        monkeypatch.setattr("app.services.providers.provider_manager.ProviderManager.collect_intelligence", fake_collect)
        monkeypatch.setattr("app.routes.scan.send_alert_email", lambda to_address, subject, body: calls.append((to_address, subject, body)) or True)

        response = register_user(client, username=f"alice_{expected_status.lower()}", email=f"alice_{expected_status.lower()}@example.com", password="StrongPass123!")
        assert response.status_code == 201
        assert login_user(client, username=f"alice_{expected_status.lower()}", password="StrongPass123!").status_code == 200

        scan_response = client.post("/api/scan", json={"ioc": "8.8.8.8"})
        assert scan_response.status_code == 201
        assert len(calls) == 0


def test_scan_email_failure_does_not_fail_scan(client, monkeypatch):
    def fake_collect(self, ioc, ioc_type):
        return [{
            "service_name": "VirusTotal",
            "status": "success",
            "data": {"malicious": 10, "suspicious": 0, "harmless": 0, "undetected": 0, "timeout": 0},
        }]

    monkeypatch.setenv("EMAIL_ALERTS_ENABLED", "true")
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USER", "user")
    monkeypatch.setenv("SMTP_PASSWORD", "secret")
    monkeypatch.setenv("EMAIL_FROM", "alerts@example.com")
    monkeypatch.setattr("app.services.providers.provider_manager.ProviderManager.collect_intelligence", fake_collect)
    monkeypatch.setattr("app.routes.scan.send_alert_email", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("smtp down")))

    response = register_user(client, username="alice_failed", email="alice_failed@example.com", password="StrongPass123!")
    assert response.status_code == 201
    assert login_user(client, username="alice_failed", password="StrongPass123!").status_code == 200

    response = client.post("/api/scan", json={"ioc": "8.8.8.8"})
    assert response.status_code == 201
    assert response.get_json()["success"] is True


def test_scan_does_not_send_email_when_disabled(client, monkeypatch):
    calls = []

    def fake_collect(self, ioc, ioc_type):
        return [{
            "service_name": "VirusTotal",
            "status": "success",
            "data": {"malicious": 10, "suspicious": 0, "harmless": 0, "undetected": 0, "timeout": 0},
        }]

    monkeypatch.setenv("EMAIL_ALERTS_ENABLED", "false")
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USER", "user")
    monkeypatch.setenv("SMTP_PASSWORD", "secret")
    monkeypatch.setenv("EMAIL_FROM", "alerts@example.com")
    monkeypatch.setattr("app.services.providers.provider_manager.ProviderManager.collect_intelligence", fake_collect)
    monkeypatch.setattr("app.routes.scan.send_alert_email", lambda *args, **kwargs: calls.append(args) or True)

    response = register_user(client, username="alice_disabled", email="alice_disabled@example.com", password="StrongPass123!")
    assert response.status_code == 201
    assert login_user(client, username="alice_disabled", password="StrongPass123!").status_code == 200

    response = client.post("/api/scan", json={"ioc": "8.8.8.8"})
    assert response.status_code == 201
    assert calls == []


def test_app_factory_uses_sqlite_for_tests():
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite://"})
    assert app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite")


def test_invalid_scan_rejected(client):
    response = register_user(client)
    assert response.status_code == 201
    assert login_user(client).status_code == 200

    response = client.post("/api/scan", json={"ioc": "not-real-ioc"})
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "INVALID_IOC"
