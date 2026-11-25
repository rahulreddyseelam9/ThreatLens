from datetime import datetime
from app import db


class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    scan_id = db.Column(
        db.Integer,
        db.ForeignKey("scans.id"),
        nullable=False
    )

    report_type = db.Column(
        db.String(20),
        nullable=False
    )

    file_path = db.Column(
        db.String(500),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    scan = db.relationship(
        "Scan",
        backref=db.backref("reports", lazy=True)
    )