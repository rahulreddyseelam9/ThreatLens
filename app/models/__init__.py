
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from sqlalchemy.engine import URL

# Load environment variables from the project root .env file
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()


def create_app():
    app = Flask(__name__)

    # --------------------------------------------------
    # 1. Security configuration
    # --------------------------------------------------
    secret_key = os.getenv("SECRET_KEY")

    if not secret_key or secret_key == "REPLACE_WITH_GENERATED_SECRET":
        raise RuntimeError(
            "Set a real SECRET_KEY in your .env file before starting Flask."
        )

    app.config["SECRET_KEY"] = secret_key

    # --------------------------------------------------
    # 2. MySQL configuration
    # --------------------------------------------------
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST", "127.0.0.1")
    db_port = os.getenv("DB_PORT", "3306")
    db_name = os.getenv("DB_NAME")

    if not all([db_user, db_password, db_host, db_name]):
        raise RuntimeError(
            "Missing MySQL settings. Check DB_USER, DB_PASSWORD, "
            "DB_HOST, and DB_NAME in your .env file."
        )

    database_url = URL.create(
        drivername="mysql+pymysql",
        username=db_user,
        password=db_password,
        host=db_host,
        port=int(db_port),
        database=db_name,
    )

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # --------------------------------------------------
    # 3. Frontend CORS configuration
    # --------------------------------------------------
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://127.0.0.1:3000",
                    "http://localhost:3000",
                ]
            }
        },
        supports_credentials=True,
    )

    # --------------------------------------------------
    # 4. Initialize Flask extensions
    # --------------------------------------------------
    db.init_app(app)
    login_manager.init_app(app)

    # Import models so SQLAlchemy knows about existing tables
    from app.models.user import User
    from app.models.scan import Scan
    from app.models.api_result import APIResult
    from app.models.recommendation import Recommendation
    from app.models.report import Report

    # --------------------------------------------------
    # 5. Register existing API blueprints
    # --------------------------------------------------
    from app.routes.auth import auth_bp
    from app.routes.scan import scan_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(scan_bp, url_prefix="/api")

    # --------------------------------------------------
    # 6. Flask-Login configuration
    # --------------------------------------------------
    @login_manager.user_loader
    def load_user(user_id):
        try:
            return db.session.get(User, int(user_id))
        except (ValueError, TypeError):
            return None

    @login_manager.unauthorized_handler
    def handle_unauthorized():
        if request.path.startswith("/api/"):
            return jsonify({
                "success": False,
                "message": "Authentication required",
            }), 401

        return jsonify({
            "success": False,
            "message": "Unauthorized",
        }), 401

    # --------------------------------------------------
    # 7. Basic application endpoint
    # --------------------------------------------------
    @app.route("/", methods=["GET"])
    def home():
        return jsonify({
            "message": "ThreatLens API",
            "status": "running",
        }), 200

    # --------------------------------------------------
    # 8. Health endpoint
    # --------------------------------------------------
    @app.route("/api/health", methods=["GET"])
    def health():
        try:
            db.session.execute(text("SELECT 1"))

            return jsonify({
                "status": "healthy",
                "database": "connected",
            }), 200

        except Exception:
            db.session.rollback()
            app.logger.exception("ThreatLens health check failed")

            return jsonify({
                "status": "unhealthy",
                "database": "disconnected",
            }), 503

    # --------------------------------------------------
    # 9. Database test endpoint
    # --------------------------------------------------
    @app.route("/db-test", methods=["GET"])
    def db_test():
        try:
            db.session.execute(text("SELECT 1"))

            return jsonify({
                "database": "MySQL",
                "status": "connected",
            }), 200

        except Exception:
            db.session.rollback()
            app.logger.exception("Database test failed")

            return jsonify({
                "database": "MySQL",
                "status": "connection failed",
            }), 500

    # --------------------------------------------------
    # 10. Create missing tables without deleting data
    # --------------------------------------------------
    with app.app_context():
        db.create_all()

    return app
