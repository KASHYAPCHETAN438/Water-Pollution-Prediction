from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, current_app
from flask_mail import Message
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db, mail
from models.user import User
from itsdangerous import URLSafeTimedSerializer

auth_bp = Blueprint('auth_bp', __name__)

def make_serializer():
    secret = current_app.config.get('SECRET_KEY', None)
    return URLSafeTimedSerializer(secret) if secret else None

# ---------------- Home Page ----------------
@auth_bp.route('/')
def home():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return f"Welcome back, {user.name}! You're already logged in."
    return render_template('auth.html')

# ---------------- Register Route ----------------
@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        # Support JSON requests (from frontend) or form-data (from templates)
        payload = request.get_json(silent=True)
        if payload:
            name = payload.get('name')
            email = payload.get('email')
            password = payload.get('password')
            confirm_password = payload.get('confirm_password')
        else:
            name = request.form.get('name')
            email = request.form.get('email')
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')

        if not all([name, email, password, confirm_password]):
            return jsonify({'success': False, 'message': 'All fields are required.'}), 400

        if password != confirm_password:
            return jsonify({'success': False, 'message': 'Passwords do not match.'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Email already registered.'}), 409

        # Hash password before storing
        hashed_password = generate_password_hash(password)
        user = User(name=name, email=email, password=hashed_password)

        db.session.add(user)
        db.session.commit()

        # --------------- Send Welcome Email ---------------
        try:
            msg = Message(
                subject="Welcome to Our Platform!",
                recipients=[email],
                html=f"""
                <h2>Welcome, {name}! 👋</h2>
                <p>Thank you for registering on our platform.</p>
                <p>You can now log in and start exploring all our features! 🚀</p>
                <hr>
                <p style="color:gray;">Best regards,<br>Your Platform Team</p>
                """
            )
            mail.send(msg)
            print(f"📧 Welcome email sent to {email}")
        except Exception as e:
            print(f"❌ Email send failed: {str(e)}")
            # Registration succeeded even if email failed; inform frontend
            return jsonify({'success': True, 'message': 'Registration successful, but welcome email could not be sent.'}), 201

        return jsonify({'success': True, 'message': 'Registration successful.'}), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Registration error: {str(e)}")
        return "❌ An error occurred during registration. Please try again."

# ---------------- Login Route ----------------
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        payload = request.get_json(silent=True)
        if payload:
            email = payload.get('email')
            password = payload.get('password')
        else:
            email = request.form.get('email')
            password = request.form.get('password')

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            # Create a signed token that the frontend can store
            serializer = make_serializer()
            token = serializer.dumps({'user_id': user.id}) if serializer else ''
            return jsonify({'success': True, 'message': f'Welcome back, {user.name}!', 'token': token}), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return "❌ An error occurred during login. Please try again."

# ---------------- Logout Route ----------------
@auth_bp.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('auth_bp.home'))
