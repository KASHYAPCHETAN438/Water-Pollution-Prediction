from flask import Flask
from extensions import db, mail, migrate
from flask_cors import CORS
import os
import secrets
from dotenv import load_dotenv
load_dotenv()

def create_app():
    # We'll use environment variables directly if available, otherwise use defaults
    # You can set these environment variables manually or use a .env file with python-dotenv

    # Initialize Flask app
    app = Flask(__name__)


    # Enable CORS with support for credentials and custom headers
    # Allow configurable CORS origins via environment variable for development on other hosts
    cors_origins_env = os.getenv('CORS_ORIGINS', 'http://localhost:5173')
    # Support comma-separated list in env var
    cors_origins = [o.strip() for o in cors_origins_env.split(',') if o.strip()]

    CORS(app,
         supports_credentials=True,
         resources={
             r"/api/*": {
                 "origins": cors_origins,
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization"],
                 "expose_headers": ["Content-Type", "Authorization"],
                 "allow_credentials": True
             }
         })
    
    # App Configuration
    app.config['SECRET_KEY'] = secrets.token_hex(16)

    # Email Configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

    # Database Configuration
    username = os.getenv("DB_USERNAME")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_NAME")
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")

    if not all([username, password, database, host, port]):
        print("⚠ Missing database configuration. Falling back to SQLite.")
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions with app
    db.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)  # Initialize Flask-Migrate

    with app.app_context():
        try:
            # Import models (after db is initialized)
            # Import all models so SQLAlchemy can register their tables
            from models.user import User
            try:
                from models.otp import OTP
            except Exception:
                # If OTP model missing or causes import error, continue and log
                print('⚠ Could not import OTP model before creating tables')

            # Create database tables for all imported models
            db.create_all()
            
            # Register auth blueprint (imports routes that may reference models)
            from routes.auth_route import auth_bp
            app.register_blueprint(auth_bp, url_prefix='/api/auth')
        except Exception as e:
            print("⚠ Database setup error:", e)

        # Register prediction blueprint (no database dependency)
        from routes.prediction_route import prediction_bp
        app.register_blueprint(prediction_bp, url_prefix='/api/prediction')

    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # You can set host='0.0.0.0' to listen on all interfaces or leave default (127.0.0.1)
    app.run(debug=True)
    
    