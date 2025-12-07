from flask import Flask
from extensions import db, mail, migrate
from flask_cors import CORS
import os
import secrets
from dotenv import load_dotenv

load_dotenv()


def create_app():
    """
    Application factory. Creates and configures the Flask app instance.
    """
    app = Flask(__name__)

    # ----------------------------------------------------
    # CORS configuration
    # ----------------------------------------------------
    # You can control allowed origins via the CORS_ORIGINS env variable.
    # If not set, we allow:
    #   - Local Vite dev frontend:  http://localhost:5173
    #   - Render frontend:         https://water-pollution-prediction.onrender.com
    default_origins = (
        "http://localhost:5173,"
        "https://water-pollution-prediction.onrender.com"
    )

    cors_origins_env = os.getenv("CORS_ORIGINS", default_origins)
    # Support comma-separated list in env var
    cors_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

    # We are using JWT in Authorization header (not cookies),
    # so supports_credentials=False is enough.
    CORS(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        supports_credentials=False,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    # ----------------------------------------------------
    # App configuration
    # ----------------------------------------------------

    # Secret key (used by Flask for session/CSRF etc.)
    # Note: regenerating this each start is OK if you do not rely on permanent
    # server-side sessions.
    app.config["SECRET_KEY"] = secrets.token_hex(16)

    # Email configuration
    app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
    app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "True").lower() == "true"
    app.config["MAIL_USE_SSL"] = os.getenv("MAIL_USE_SSL", "False").lower() == "true"
    app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
    app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
    app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_USERNAME")

    # Database configuration
    username = os.getenv("DB_USERNAME")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_NAME")
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")

    if not all([username, password, database, host, port]):
        print("⚠ Missing database configuration. Falling back to SQLite.")
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
    else:
        app.config[
            "SQLALCHEMY_DATABASE_URI"
        ] = f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize extensions with app
    db.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)  # Flask-Migrate

    # ----------------------------------------------------
    # Register models and blueprints
    # ----------------------------------------------------
    with app.app_context():
        try:
            # Import models so SQLAlchemy can register their tables
            from models.user import User  # noqa: F401

            try:
                from models.otp import OTP  # noqa: F401
            except Exception:
                # If OTP model import fails, log and continue
                print("⚠ Could not import OTP model before creating tables")

            # Create tables for all registered models
            db.create_all()

            # Register authentication routes
            from routes.auth_route import auth_bp

            app.register_blueprint(auth_bp, url_prefix="/api/auth")
        except Exception as e:
            print("⚠ Database setup error:", e)

        # Register prediction routes (no DB dependency required here)
        from routes.prediction_route import prediction_bp

        app.register_blueprint(prediction_bp, url_prefix="/api/prediction")

    return app


# Create the application instance for WSGI servers (Gunicorn, Render, etc.)
app = create_app()

if __name__ == "__main__":
    # For local development
    app.run(debug=True)
