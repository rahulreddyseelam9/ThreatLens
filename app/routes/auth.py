import re

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash

from app import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not username or not email or not password:
        return jsonify({"success": False, "error": {"code": "VALIDATION_ERROR", "message": "Username, email, and password are required."}}), 400

    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return jsonify({"success": False, "error": {"code": "VALIDATION_ERROR", "message": "A valid email address is required."}}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"success": False, "error": {"code": "USER_EXISTS", "message": "Username or email already exists."}}), 409

    user = User(username=username, email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "User registered successfully.",
        "user": {"id": user.id, "username": user.username, "email": user.email}
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username_or_email = str(data.get("username") or data.get("email") or "").strip()
    password = str(data.get("password") or "")

    if not username_or_email or not password:
        return jsonify({"success": False, "error": {"code": "VALIDATION_ERROR", "message": "Username/email and password are required."}}), 400

    user = User.query.filter((User.username == username_or_email) | (User.email == username_or_email.lower())).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"success": False, "error": {"code": "INVALID_CREDENTIALS", "message": "Invalid username or password."}}), 401

    login_user(user)
    return jsonify({
        "success": True,
        "message": "Login successful.",
        "user": {"id": user.id, "username": user.username, "email": user.email}
    }), 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return jsonify({
        "success": True,
        "user": {"id": current_user.id, "username": current_user.username, "email": current_user.email}
    }), 200


@auth_bp.route("/profile", methods=["GET"])
@login_required
def profile():
    return me()


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"success": True, "message": "Logout successful."}), 200
