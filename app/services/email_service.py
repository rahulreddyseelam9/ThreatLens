import os
import smtplib
from datetime import datetime
from email.message import EmailMessage


def build_alert_body(ioc, ioc_type, classification, risk_score, confidence, analysis=None):
    analysis = analysis or {}
    risk_data = analysis.get("risk", {}) if isinstance(analysis, dict) else {}
    correlation = analysis.get("correlation", {}) if isinstance(analysis, dict) else {}
    evidence = []
    if isinstance(correlation, dict):
        evidence.extend(correlation.get("evidence", []) or [])
    if not evidence:
        evidence.extend(risk_data.get("reasons", []) or [])
    if not evidence:
        evidence.append("Threat intelligence review completed.")

    if isinstance(evidence, list):
        evidence_text = "\n- ".join(str(item) for item in evidence[:6])
    else:
        evidence_text = str(evidence)

    timestamp = datetime.utcnow().isoformat() + "Z"
    return (
        "ThreatLens Security Alert\n\n"
        f"IOC: {ioc}\n"
        f"IOC Type: {ioc_type}\n"
        f"Classification: {classification}\n"
        f"Risk Score: {risk_score}\n"
        f"Confidence: {confidence}\n"
        f"Timestamp: {timestamp}\n\n"
        "Relevant evidence:\n"
        f"- {evidence_text}\n\n"
        "Recommended action: Review the IOC, validate the source, and apply containment or blocking controls if appropriate."
    )


def send_alert_email(to_address, subject, body):
    enabled = os.getenv("EMAIL_ALERTS_ENABLED", "false").lower() == "true"
    if not enabled:
        return False

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port_raw = os.getenv("SMTP_PORT", "587")
    try:
        smtp_port = int(smtp_port_raw)
    except (TypeError, ValueError):
        return False
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM")

    if not all([smtp_host, smtp_user, smtp_password, email_from, to_address]):
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = email_from
    message["To"] = to_address
    message.set_content(body)

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(message)
        return True
    except Exception:
        return False
