import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # MongoDB Configuration
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb://localhost:27017/'
    DATABASE_NAME = os.environ.get('DATABASE_NAME') or 'talentflow_db'
    
    # CrewAI and OpenAI Configuration
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    
    # Upload Configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    ALLOWED_EXTENSIONS = {'pdf'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Email Configuration (stored in DB for now)
    EMAIL_FROM = os.environ.get('EMAIL_FROM') or 'hr@company.com'
    COMPANY_NAME = os.environ.get('COMPANY_NAME') or 'Your Company'
    
    # Ranking Weights
    RANKING_WEIGHTS = {
        'skills_match': 0.40,
        'experience_relevance': 0.30,
        'education_match': 0.20,
        'overall_fit': 0.10
    }
    
    # Interview Scheduling
    DEFAULT_INTERVIEW_DURATION = 60  # minutes
    BUSINESS_HOURS_START = 9  # 9 AM
    BUSINESS_HOURS_END = 17   # 5 PM
    
    @staticmethod
    def init_app(app):
        # Create upload folder if it doesn't exist
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True) 