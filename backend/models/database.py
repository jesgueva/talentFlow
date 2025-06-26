from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId
from typing import List, Dict, Optional
from werkzeug.security import generate_password_hash, check_password_hash

class Database:
    def __init__(self, uri: str, database_name: str):
        self.client = MongoClient(uri)
        self.db = self.client[database_name]
        
        # Collections
        self.candidates = self.db.candidates
        self.jobs = self.db.jobs
        self.interviews = self.db.interviews
        self.users = self.db.users
        self.emails = self.db.emails
        
        # Create indexes
        self._create_indexes()
    
    def _create_indexes(self):
        """Create database indexes for better performance"""
        self.candidates.create_index("email", unique=True, sparse=True)
        self.candidates.create_index("status")
        self.jobs.create_index("status")
        self.interviews.create_index([("candidate_id", 1), ("job_id", 1)])
        self.users.create_index("email", unique=True)
        self.emails.create_index([("candidate_id", 1), ("type", 1)])

class CandidateModel:
    """Schema for candidate documents"""
    
    STATUS_OPTIONS = ['new', 'reviewed', 'shortlisted', 'rejected', 'interview_scheduled', 'interviewed', 'hired']
    
    @staticmethod
    def create_candidate(data: Dict) -> Dict:
        return {
            'name': data.get('name', ''),
            'email': data.get('email', ''),
            'phone': data.get('phone', ''),
            'resume_path': data.get('resume_path', ''),
            'parsed_data': {
                'education': data.get('education', []),
                'experience': data.get('experience', []),
                'skills': data.get('skills', []),
                'summary': data.get('summary', ''),
                'certifications': data.get('certifications', [])
            },
            'job_id': ObjectId(data.get('job_id')) if data.get('job_id') else None,
            'ranking_score': data.get('ranking_score', 0),
            'ranking_details': data.get('ranking_details', {}),
            'tier': data.get('tier', 'unranked'),  # strong_fit, moderate_fit, weak_fit, unranked
            'status': data.get('status', 'new'),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

class JobModel:
    """Schema for job postings"""
    
    @staticmethod
    def create_job(data: Dict) -> Dict:
        return {
            'title': data.get('title', ''),
            'department': data.get('department', ''),
            'description': data.get('description', ''),
            'requirements': {
                'required_skills': data.get('required_skills', []),
                'preferred_skills': data.get('preferred_skills', []),
                'min_experience_years': data.get('min_experience_years', 0),
                'education_level': data.get('education_level', ''),
                'certifications': data.get('certifications', [])
            },
            'status': data.get('status', 'active'),  # active, closed, on_hold
            'created_by': ObjectId(data.get('created_by')) if data.get('created_by') else None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

class InterviewModel:
    """Schema for interview scheduling"""
    
    @staticmethod
    def create_interview(data: Dict) -> Dict:
        return {
            'candidate_id': ObjectId(data.get('candidate_id')),
            'job_id': ObjectId(data.get('job_id')),
            'scheduled_at': data.get('scheduled_at'),
            'duration_minutes': data.get('duration_minutes', 60),
            'interview_type': data.get('interview_type', 'initial'),  # initial, technical, final
            'location': data.get('location', 'TBD'),
            'meeting_link': data.get('meeting_link', ''),
            'interviewers': data.get('interviewers', []),
            'status': data.get('status', 'scheduled'),  # scheduled, confirmed, completed, cancelled
            'candidate_confirmed': data.get('candidate_confirmed', False),
            'notes': data.get('notes', ''),
            'feedback': data.get('feedback', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

class UserModel:
    """Schema for system users (HR, recruiters)"""
    
    @staticmethod
    def create_user(data: Dict) -> Dict:
        return {
            'name': data.get('name', ''),
            'email': data.get('email', ''),
            'password_hash': generate_password_hash(data.get('password', '')),
            'role': data.get('role', 'recruiter'),  # admin, recruiter, interviewer
            'is_active': data.get('is_active', True),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    
    @staticmethod
    def verify_password(password_hash: str, password: str) -> bool:
        return check_password_hash(password_hash, password)

class EmailModel:
    """Schema for email communications"""
    
    @staticmethod
    def create_email(data: Dict) -> Dict:
        return {
            'candidate_id': ObjectId(data.get('candidate_id')),
            'interview_id': ObjectId(data.get('interview_id')) if data.get('interview_id') else None,
            'type': data.get('type', 'general'),  # invitation, reminder, rejection, confirmation
            'subject': data.get('subject', ''),
            'body': data.get('body', ''),
            'status': data.get('status', 'pending'),  # pending, sent, failed
            'sent_at': data.get('sent_at'),
            'created_at': datetime.utcnow()
        } 