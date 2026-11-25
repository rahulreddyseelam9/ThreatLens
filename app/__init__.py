from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.engine import URL
import os


db = SQLAlchemy()
login_manager = LoginManager()
load_dotenv()


def create_app(test_config=None):
    app = Flask(__name__)

    if test_config is not None:
        app.config.update(test_config)

    is_testing = bool(app.config.get("TESTING") or os.getenv("TESTING") == "1")
    secret_key = app.config.get("SECRET_KEY") or os.getenv("SECRET_KEY")

    if is_testing:
        app.config["SECRET_KEY"] = secret_key or "isolated-test-secret-key"
    else:
        if not secret_key or secret_key.strip().upper() in {
            "REPLACE_WITH_GENERATED_SECRET",
            "DEV-SECRET-KEY",
            "CHANGE_ME",
        }:
            raise RuntimeError(
                "SECRET_KEY must be set to a strong, environment-managed value "
                "before starting ThreatLens outside isolated tests."
            )
        app.config["SECRET_KEY"] = secret_key

    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT")
    db_name = os.getenv("DB_NAME")
    app.config.setdefault("SESSION_COOKIE_HTTPONLY", True)
    app.config.setdefault("SESSION_COOKIE_SAMESITE", "Lax")
    app.config.setdefault("SESSION_COOKIE_SECURE", False)

    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        if os.getenv("TESTING") == "1" or app.config.get("TESTING"):
            app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite://"
        else:
            database_url = URL.create(
                drivername="mysql+pymysql",
                username=db_user,
                password=db_password,
                host=db_host,
                port=int(db_port) if db_port else None,
                database=db_name,
            )
            app.config["SQLALCHEMY_DATABASE_URI"] = database_url

    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)

    db.init_app(app)
    login_manager.init_app(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": [
            "http://127.0.0.1:3000",
            "http://localhost:3000",
        ]}},
        supports_credentials=True,
    )

    from .models.user import User
    from .models.scan import Scan
    from .models.api_result import APIResult
    from .models.recommendation import Recommendation
    from .models.report import Report

    from .routes.ai_analysis import ai_analysis_bp
    from .routes.alerts import alerts_bp
    from .routes.auth import auth_bp
    from .routes.dashboard import dashboard_bp
    from .routes.emerging import emerging_bp
    from .routes.intelligence import intelligence_bp
    from .routes.recommendations import recommendations_bp
    from .routes.reports import reports_bp
    from .routes.scan import scan_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(scan_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api")
    app.register_blueprint(emerging_bp, url_prefix="/api")
    app.register_blueprint(recommendations_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api")
    app.register_blueprint(intelligence_bp, url_prefix="/api")
    app.register_blueprint(alerts_bp, url_prefix="/api")
    app.register_blueprint(ai_analysis_bp, url_prefix="/api")

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    with app.app_context():
        db.create_all()

        @app.route("/api/health", methods=["GET"])
        def health():
            try:
                db.session.execute(text("SELECT 1"))
                return jsonify({
                    "app": "ok",
                    "status": "healthy",
                    "database": {"status": "connected"},
                }), 200
            except Exception as exc:
                db.session.rollback()
                app.logger.exception("Health check failed")
                return jsonify({
                    "app": "error",
                    "status": "unhealthy",
                    "database": {"status": "error", "message": str(exc)},
                }), 503

        @app.route("/")
        def home():
            return {
                "message": "Automated Emerging Cyber Threat Identification API",
                "status": "running",
            }

        @app.route("/db-test")
        def db_test():
            try:
                db.session.execute(text("SELECT 1"))
                return {
                    "database": "MySQL",
                    "status": "connected",
                }
            except Exception as e:
                return {
                    "database": "MySQL",
                    "status": "connection failed",
                    "error": str(e),
                }, 500

    return app