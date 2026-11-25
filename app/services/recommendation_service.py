from flask import has_app_context

from app.models.recommendation import Recommendation
from app import db


class RecommendationService:
    @staticmethod
    def generate_recommendations(scan, analysis):
        recommendations = []
        risk = (analysis or {}).get("risk", {})
        risk_score = float(risk.get("risk_score", 0) or 0)
        ioc_type = (scan.ioc_type or "").upper()
        classification = risk.get("classification", "SAFE")

        if ioc_type in {"IP", "DOMAIN", "URL"}:
            recommendations.append({
                "title": "Block and investigate indicator",
                "priority": "high",
                "reason": f"{scan.ioc} is associated with elevated threat activity and warrants investigation.",
                "action": f"Block and investigate {scan.ioc} across network and application controls.",
            })
        if classification in {"HIGH", "CRITICAL"}:
            recommendations.append({
                "title": "Escalate incident response",
                "priority": "high",
                "reason": "The IOC has a high or critical risk classification and warrants immediate attention.",
                "action": "Escalate to the security operations team and preserve relevant evidence for forensic review.",
            })
        if risk_score >= 30:
            recommendations.append({
                "title": "Review related telemetry",
                "priority": "medium",
                "reason": "Risk indicators suggest a broader investigation is warranted across logs and correlated indicators.",
                "action": "Review related logs, DNS records, and recent outbound activity for correlated indicators.",
            })
        if risk_score < 30:
            recommendations.append({
                "title": "Continue monitoring",
                "priority": "low",
                "reason": "The observed risk is low and routine monitoring remains the correct posture.",
                "action": "Continue routine monitoring for changes in reputation or behavior.",
            })

        saved = []
        if not has_app_context():
            return recommendations

        for item in recommendations:
            rec = Recommendation(
                scan_id=scan.id,
                recommendation=item["action"],
                priority=item["priority"],
            )
            db.session.add(rec)
            saved.append({
                "title": item["title"],
                "priority": item["priority"],
                "reason": item["reason"],
                "action": item["action"],
                "related_ioc": scan.ioc,
            })
        db.session.commit()
        return saved
