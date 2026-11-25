from datetime import datetime
from app import db


class Recommendation(db.Model):
    __tablename__ = "recommendations"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    scan_id = db.Column(
        db.Integer,
        db.ForeignKey("scans.id"),
        nullable=False
    )

    recommendation = db.Column(
        db.Text,
        nullable=False
    )

    priority = db.Column(
        db.String(20),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    scan = db.relationship(
        "Scan",
        backref=db.backref("recommendations", lazy=True)
    )