from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash
from bson import ObjectId
from bson.json_util import dumps
import os
from datetime import datetime, timedelta
import json

from config.config import Config
from models.database import Database, CandidateModel, JobModel, InterviewModel, UserModel, EmailModel
from agents import ResumeParserAgent, CandidateRankingAgent, InterviewSchedulingAgent
from utils.email_templates import EmailTemplates

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)
Config.init_app(app)

# Enable CORS
CORS(app, origins=['http://localhost:3000'], supports_credentials=True)

# Initialize JWT
jwt = JWTManager(app)
app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize database
db = Database(app.config['MONGODB_URI'], app.config['DATABASE_NAME'])

# Helper function to serialize MongoDB documents
def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                result['id'] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, (dict, list)):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc

# Authentication endpoints

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login endpoint"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    user = db.users.find_one({'email': email})
    if user and UserModel.verify_password(user['password_hash'], password):
        access_token = create_access_token(identity=str(user['_id']))
        user_data = serialize_doc(user)
        del user_data['password_hash']  # Don't send password hash
        
        return jsonify({
            'access_token': access_token,
            'user': user_data
        }), 200
    else:
        return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)})
    
    if user:
        user_data = serialize_doc(user)
        del user_data['password_hash']
        return jsonify(user_data), 200
    
    return jsonify({'error': 'User not found'}), 404

# Dashboard endpoints

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics"""
    stats = {
        'total_jobs': db.jobs.count_documents({'status': 'active'}),
        'total_candidates': db.candidates.count_documents({}),
        'scheduled_interviews': db.interviews.count_documents({'status': 'scheduled'}),
        'recent_candidates': []
    }
    
    # Get recent candidates
    recent_candidates = list(db.candidates.find().sort('created_at', -1).limit(5))
    for candidate in recent_candidates:
        if candidate.get('job_id'):
            job = db.jobs.find_one({'_id': candidate['job_id']})
            candidate['job_title'] = job['title'] if job else 'Unknown'
    
    stats['recent_candidates'] = serialize_doc(recent_candidates)
    
    return jsonify(stats), 200

# Job endpoints

@app.route('/api/jobs', methods=['GET'])
@jwt_required()
def get_jobs():
    """Get all jobs"""
    status = request.args.get('status', 'active')
    query = {'status': status} if status != 'all' else {}
    
    jobs_list = list(db.jobs.find(query))
    for job in jobs_list:
        job['candidate_count'] = db.candidates.count_documents({'job_id': job['_id']})
    
    return jsonify(serialize_doc(jobs_list)), 200

@app.route('/api/jobs', methods=['POST'])
@jwt_required()
def create_job():
    """Create a new job"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    job_data = {
        'title': data.get('title'),
        'department': data.get('department'),
        'description': data.get('description'),
        'required_skills': data.get('required_skills', []),
        'preferred_skills': data.get('preferred_skills', []),
        'min_experience_years': data.get('min_experience_years', 0),
        'education_level': data.get('education_level'),
        'certifications': data.get('certifications', []),
        'created_by': user_id
    }
    
    job_doc = JobModel.create_job(job_data)
    result = db.jobs.insert_one(job_doc)
    job_doc['_id'] = result.inserted_id
    
    return jsonify(serialize_doc(job_doc)), 201

@app.route('/api/jobs/<job_id>', methods=['GET'])
@jwt_required()
def get_job(job_id):
    """Get job details"""
    job = db.jobs.find_one({'_id': ObjectId(job_id)})
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Get candidates for this job
    candidates = list(db.candidates.find({'job_id': ObjectId(job_id)}))
    candidates.sort(key=lambda x: x.get('ranking_score', 0), reverse=True)
    
    return jsonify({
        'job': serialize_doc(job),
        'candidates': serialize_doc(candidates)
    }), 200

# Candidate endpoints

@app.route('/api/candidates', methods=['GET'])
@jwt_required()
def get_candidates():
    """Get all candidates"""
    job_id = request.args.get('job_id')
    status = request.args.get('status')
    
    query = {}
    if job_id:
        query['job_id'] = ObjectId(job_id)
    if status:
        query['status'] = status
    
    candidates_list = list(db.candidates.find(query))
    for candidate in candidates_list:
        if candidate.get('job_id'):
            job = db.jobs.find_one({'_id': candidate['job_id']})
            candidate['job_title'] = job['title'] if job else 'Unknown'
    
    return jsonify(serialize_doc(candidates_list)), 200

@app.route('/api/candidates/<candidate_id>', methods=['GET'])
@jwt_required()
def get_candidate(candidate_id):
    """Get candidate details"""
    candidate = db.candidates.find_one({'_id': ObjectId(candidate_id)})
    if not candidate:
        return jsonify({'error': 'Candidate not found'}), 404
    
    # Get job information
    if candidate.get('job_id'):
        job = db.jobs.find_one({'_id': candidate['job_id']})
        candidate['job'] = job
    
    # Get interview information
    interview = db.interviews.find_one({'candidate_id': ObjectId(candidate_id)})
    
    # Get email history
    emails = list(db.emails.find({'candidate_id': ObjectId(candidate_id)}).sort('created_at', -1))
    
    return jsonify({
        'candidate': serialize_doc(candidate),
        'interview': serialize_doc(interview) if interview else None,
        'emails': serialize_doc(emails)
    }), 200

@app.route('/api/candidates/<candidate_id>/status', methods=['PUT'])
@jwt_required()
def update_candidate_status(candidate_id):
    """Update candidate status"""
    data = request.get_json()
    new_status = data.get('status')
    notes = data.get('notes', '')
    
    if not new_status:
        return jsonify({'error': 'Status required'}), 400
    
    result = db.candidates.update_one(
        {'_id': ObjectId(candidate_id)},
        {'$set': {
            'status': new_status,
            'notes': notes,
            'updated_at': datetime.utcnow()
        }}
    )
    
    if result.modified_count > 0:
        return jsonify({'message': 'Status updated successfully'}), 200
    else:
        return jsonify({'error': 'Failed to update status'}), 400

# Resume upload endpoint

@app.route('/api/jobs/<job_id>/upload-resumes', methods=['POST'])
@jwt_required()
def upload_resumes(job_id):
    """Upload and process resumes for a job"""
    job = db.jobs.find_one({'_id': ObjectId(job_id)})
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    if 'resumes' not in request.files:
        return jsonify({'error': 'No files uploaded'}), 400
    
    uploaded_files = request.files.getlist('resumes')
    
    # Create job-specific upload folder
    job_folder = os.path.join(app.config['UPLOAD_FOLDER'], job_id)
    os.makedirs(job_folder, exist_ok=True)
    
    # Save uploaded files
    saved_files = []
    for file in uploaded_files:
        if file and file.filename.lower().endswith('.pdf'):
            filename = secure_filename(file.filename)
            filepath = os.path.join(job_folder, filename)
            file.save(filepath)
            saved_files.append(filepath)
    
    if not saved_files:
        return jsonify({'error': 'No valid PDF files uploaded'}), 400
    
    # Process resumes with agents
    parser = ResumeParserAgent()
    ranker = CandidateRankingAgent(ranking_weights=app.config['RANKING_WEIGHTS'])
    
    # Parse resumes
    parsed_candidates = parser.parse_resume_folder(job_folder, job_id)
    
    # Save parsed candidates to database
    candidate_docs = []
    for parsed_data in parsed_candidates:
        if 'error' not in parsed_data:
            candidate_doc = CandidateModel.create_candidate(parsed_data)
            result = db.candidates.insert_one(candidate_doc)
            candidate_doc['_id'] = result.inserted_id
            candidate_docs.append(candidate_doc)
    
    # Rank candidates
    if candidate_docs:
        ranked_candidates = ranker.rank_candidates(candidate_docs, job)
        
        # Update candidates with ranking information
        for candidate in ranked_candidates:
            db.candidates.update_one(
                {'_id': candidate['_id']},
                {'$set': {
                    'ranking_score': candidate['ranking_score'],
                    'ranking_details': candidate['ranking_details'],
                    'tier': candidate['tier'],
                    'updated_at': datetime.utcnow()
                }}
            )
    
    return jsonify({
        'message': f'Successfully processed {len(candidate_docs)} resumes',
        'processed_count': len(candidate_docs),
        'total_uploaded': len(saved_files)
    }), 200

# Interview endpoints

@app.route('/api/interviews', methods=['GET'])
@jwt_required()
def get_interviews():
    """Get all interviews"""
    status = request.args.get('status')
    query = {'status': status} if status else {}
    
    interviews_list = list(db.interviews.find(query))
    
    for interview in interviews_list:
        # Get candidate information
        candidate = db.candidates.find_one({'_id': interview['candidate_id']})
        if candidate:
            interview['candidate_name'] = candidate['name']
            interview['candidate_email'] = candidate['email']
        
        # Get job information
        job = db.jobs.find_one({'_id': interview['job_id']})
        if job:
            interview['job_title'] = job['title']
    
    return jsonify(serialize_doc(interviews_list)), 200

@app.route('/api/interviews', methods=['POST'])
@jwt_required()
def schedule_interview():
    """Schedule an interview"""
    data = request.get_json()
    candidate_id = data.get('candidate_id')
    interview_type = data.get('interview_type', 'initial')
    location = data.get('location', 'Virtual')
    
    if not candidate_id:
        return jsonify({'error': 'Candidate ID required'}), 400
    
    # Get candidate and job information
    candidate = db.candidates.find_one({'_id': ObjectId(candidate_id)})
    if not candidate:
        return jsonify({'error': 'Candidate not found'}), 404
    
    job = db.jobs.find_one({'_id': candidate['job_id']})
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Initialize scheduling agent
    scheduler = InterviewSchedulingAgent()
    
    # Schedule interview
    interview_data = scheduler.schedule_interview(
        candidate=candidate,
        job=job,
        interview_type=interview_type,
        location=location
    )
    
    # Save interview to database
    interview_doc = InterviewModel.create_interview(interview_data)
    result = db.interviews.insert_one(interview_doc)
    
    # Update candidate status
    db.candidates.update_one(
        {'_id': ObjectId(candidate_id)},
        {'$set': {
            'status': 'interview_scheduled',
            'updated_at': datetime.utcnow()
        }}
    )
    
    # Create interview invitation email
    email_content = EmailTemplates.interview_invitation(
        candidate_name=candidate['name'],
        job_title=job['title'],
        company_name=app.config['COMPANY_NAME']
    )
    
    email_doc = EmailModel.create_email({
        'candidate_id': candidate_id,
        'interview_id': str(result.inserted_id),
        'type': 'invitation',
        'subject': email_content['subject'],
        'body': email_content['body']
    })
    
    db.emails.insert_one(email_doc)
    
    return jsonify({
        'message': 'Interview scheduled successfully',
        'interview_id': str(result.inserted_id)
    }), 201

# Email endpoints

@app.route('/api/emails/send', methods=['POST'])
@jwt_required()
def send_email():
    """Send email to candidate"""
    data = request.get_json()
    candidate_id = data.get('candidate_id')
    email_type = data.get('email_type')
    custom_message = data.get('custom_message', '')
    subject = data.get('subject', '')
    
    if not candidate_id or not email_type:
        return jsonify({'error': 'Candidate ID and email type required'}), 400
    
    # Get candidate information
    candidate = db.candidates.find_one({'_id': ObjectId(candidate_id)})
    if not candidate:
        return jsonify({'error': 'Candidate not found'}), 404
    
    # Get job information
    job = db.jobs.find_one({'_id': candidate['job_id']}) if candidate.get('job_id') else None
    job_title = job['title'] if job else 'Position'
    
    # Generate email content based on type
    if email_type == 'rejection':
        email_content = EmailTemplates.rejection_email(
            candidate_name=candidate['name'],
            job_title=job_title,
            company_name=app.config['COMPANY_NAME'],
            personalized_message=custom_message
        )
    elif email_type == 'request_info':
        email_content = EmailTemplates.request_additional_info(
            candidate_name=candidate['name'],
            job_title=job_title,
            company_name=app.config['COMPANY_NAME'],
            info_needed=custom_message
        )
    elif email_type == 'custom':
        email_content = EmailTemplates.custom_email(
            candidate_name=candidate['name'],
            subject=subject,
            message=custom_message,
            company_name=app.config['COMPANY_NAME']
        )
    else:
        return jsonify({'error': 'Invalid email type'}), 400
    
    # Save email to database
    email_doc = EmailModel.create_email({
        'candidate_id': candidate_id,
        'type': email_type,
        'subject': email_content['subject'],
        'body': email_content['body'],
        'status': 'sent',
        'sent_at': datetime.utcnow()
    })
    
    db.emails.insert_one(email_doc)
    
    return jsonify({'message': 'Email sent successfully'}), 200

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Create default admin user if none exists
def create_default_admin():
    """Create a default admin user if no users exist"""
    if db.users.count_documents({}) == 0:
        admin_data = {
            'name': 'Admin User',
            'email': 'admin@talentflow.com',
            'password': 'admin123',
            'role': 'admin'
        }
        admin_doc = UserModel.create_user(admin_data)
        db.users.insert_one(admin_doc)
        print("Default admin user created: admin@talentflow.com / admin123")

if __name__ == '__main__':
    create_default_admin()
    app.run(debug=True, port=5000) 