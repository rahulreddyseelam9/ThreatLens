from datetime import datetime

from app import db


class APIResult(db.Model):
    __tablename__ = "api_results"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    scan_id = db.Column(
        db.Integer,
        db.ForeignKey("scans.id"),
        nullable=False
    )

    service_name = db.Column(
        db.String(50),
        nullable=False
    )

    status = db.Column(
        db.String(20),
        nullable=False
    )

    result_data = db.Column(
        db.JSON,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


# Backward-compatible alias for older imports.
ApiResult = APIResult