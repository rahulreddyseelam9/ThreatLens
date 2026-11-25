from datetime import datetime

from app import db


class Scan(db.Model):
    __tablename__ = "scans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    ioc = db.Column(db.String(500), nullable=False)
    ioc_type = db.Column(db.String(20), nullable=False)
    classification = db.Column(db.String(40), nullable=True, default="PENDING")
    risk_score = db.Column(db.Float, nullable=True, default=0.0)
    confidence = db.Column(db.Float, nullable=True, default=0.0)
    status = db.Column(db.String(40), default="pending")
    analysis = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("scans", lazy=True))
