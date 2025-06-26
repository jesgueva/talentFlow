# 🚀 TalentFlow - AI-Powered Recruitment System

**A complete multi-agent job application screening and interview scheduling system built with CrewAI, Flask, React, and MongoDB.**

![TalentFlow Banner](https://img.shields.io/badge/TalentFlow-AI%20Recruitment-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.8+-green?style=flat-square)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square)
![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-orange?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=flat-square)

## 🎯 What is TalentFlow?

TalentFlow is a comprehensive AI-powered recruitment automation system that transforms how organizations handle hiring. It combines the power of **CrewAI agents** with modern web technologies to automate:

- 📄 **Resume Parsing** - Intelligent extraction from PDF resumes
- 🏆 **Candidate Ranking** - AI-powered scoring and tier classification  
- 📅 **Interview Scheduling** - Automated coordination and communication
- 📧 **Email Management** - Professional communication workflows
- 📊 **Analytics Dashboard** - Real-time recruitment insights

## ⚡ Quick Start

### 🚀 One-Command Launch

```bash
git clone <repository-url>
cd talentflow
./start_talentflow.sh
```

This script automatically:
- ✅ Checks prerequisites
- ✅ Sets up virtual environments
- ✅ Installs all dependencies
- ✅ Creates configuration files
- ✅ Starts both servers

### 📍 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### 👤 Default Login

- **Email**: `admin@talentflow.com`
- **Password**: `admin123`

## 🛠️ Manual Setup

<details>
<summary>Click to expand manual installation instructions</summary>

### Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API Key

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
echo "SECRET_KEY=your-secret-key
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=talentflow_db
OPENAI_API_KEY=your-openai-api-key
COMPANY_NAME=Your Company
EMAIL_FROM=hr@yourcompany.com" > .env

python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
echo "REACT_APP_API_URL=http://localhost:5000" > .env
npm start
```

</details>

## 🤖 CrewAI Agents

### 1. Resume Parser Agent
- **Input**: PDF resumes uploaded for specific jobs
- **Process**: Intelligent extraction using AI and PDF processing
- **Output**: Structured candidate profiles with skills, experience, education

### 2. Candidate Ranking Agent
- **Input**: Parsed candidate data and job requirements
- **Process**: Weighted scoring algorithm considering multiple factors
- **Output**: Ranked candidates with scores and tier classifications

### 3. Interview Scheduling Agent
- **Input**: Approved candidates and scheduling preferences
- **Process**: Automated coordination and email generation
- **Output**: Scheduled interviews with calendar integration

## 📸 Screenshots

<details>
<summary>🖼️ View Application Screenshots</summary>

### Dashboard
![Dashboard Overview](https://via.placeholder.com/800x400/4F46E5/white?text=Dashboard+Overview)

### Job Management
![Job Management](https://via.placeholder.com/800x400/059669/white?text=Job+Management)

### Candidate Review
![Candidate Review](https://via.placeholder.com/800x400/DC2626/white?text=Candidate+Review)

### Resume Upload
![Resume Upload](https://via.placeholder.com/800x400/7C3AED/white?text=Resume+Upload)

</details>

## 🎯 Key Features

### ✅ Complete Job Management
- Create and manage job postings
- Define skills and requirements
- Track application statistics

### ✅ AI-Powered Resume Processing
- Drag & drop PDF upload
- Intelligent data extraction
- Real-time processing feedback

### ✅ Smart Candidate Ranking
- Automated scoring algorithms
- Tier classification (Strong/Moderate/Weak fit)
- Customizable ranking weights

### ✅ Interview Automation
- One-click interview scheduling
- Automated email invitations
- Calendar integration ready

### ✅ Professional Communication
- Pre-built email templates
- Custom message capabilities
- Complete communication history

### ✅ Modern Dashboard
- Real-time analytics
- Visual recruitment metrics
- Quick action shortcuts

## 📱 Mobile Responsive

TalentFlow works seamlessly across all devices:
- 💻 **Desktop** - Full feature set
- 📱 **Mobile** - Optimized touch interface
- 🖲️ **Tablet** - Adaptive layout

## 🔧 Configuration

### Ranking Algorithm Weights

Customize in `backend/config/config.py`:

```python
RANKING_WEIGHTS = {
    'skills_match': 0.40,        # Skills alignment
    'experience_relevance': 0.30, # Experience level
    'education_match': 0.20,     # Education requirements
    'overall_fit': 0.10          # General assessment
}
```

### Email Templates

Modify templates in `backend/utils/email_templates.py` for:
- Interview invitations
- Rejection notifications
- Follow-up communications

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Current user info

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create job
- `POST /api/jobs/{id}/upload-resumes` - Process resumes

### Candidates
- `GET /api/candidates` - List candidates
- `PUT /api/candidates/{id}/status` - Update status

### Interviews
- `GET /api/interviews` - List interviews
- `POST /api/interviews` - Schedule interview

## 🚀 Deployment

### Development
```bash
./start_talentflow.sh
```

### Production
- Set up MongoDB Atlas or dedicated MongoDB instance
- Configure environment variables for production
- Use process managers (PM2, systemd) for server management
- Set up reverse proxy (nginx) for production serving

## 🛡️ Security Features

- 🔐 JWT-based authentication
- 🔒 Password hashing with bcrypt
- 🛡️ CORS protection
- ✅ Input validation and sanitization
- 🚫 Secure error handling

## 📊 System Requirements

### Minimum
- **RAM**: 2GB
- **Storage**: 1GB
- **CPU**: 2 cores

### Recommended
- **RAM**: 4GB+
- **Storage**: 5GB+
- **CPU**: 4+ cores

## 🔄 Roadmap

### Phase 1 (Current) ✅
- Core recruitment workflow
- AI-powered resume parsing
- Basic interview scheduling
- Email communication system

### Phase 2 (Planned)
- 📅 Advanced calendar integration
- 🎥 Video interview links
- 📈 Advanced analytics
- 🔄 Background job processing

### Phase 3 (Future)
- 🌐 Multi-tenant support
- 🤖 Advanced AI features
- 📱 Mobile applications
- 🔗 Third-party integrations

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Start MongoDB service
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
```

**Port Already in Use**
```bash
# Kill processes on ports 3000 and 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

**OpenAI API Issues**
- Verify API key in `backend/.env`
- Check API usage limits
- Ensure sufficient credits

## 📚 Documentation

- [System Overview](SYSTEM_OVERVIEW.md) - Comprehensive system documentation
- [API Documentation](docs/api.md) - Detailed API reference
- [Deployment Guide](docs/deployment.md) - Production deployment
- [Contributing](CONTRIBUTING.md) - Development guidelines

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CrewAI** - Multi-agent AI framework
- **OpenAI** - GPT models for intelligent processing
- **React Team** - Modern UI framework
- **Flask Community** - Lightweight web framework
- **MongoDB** - Flexible document database

## 📞 Support

Need help? Here's how to get support:

- 📧 **Email**: support@talentflow.com
- 💬 **Issues**: Create a GitHub issue
- 📖 **Documentation**: Check our comprehensive docs
- 🤝 **Community**: Join our Discord server

---

<div align="center">

**Ready to revolutionize your recruitment process?**

[Get Started](#-quick-start) • [View Docs](SYSTEM_OVERVIEW.md) • [Report Bug](issues/new)

Made with ❤️ by the TalentFlow Team

</div>