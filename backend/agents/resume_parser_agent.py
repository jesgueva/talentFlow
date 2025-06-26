import os
import re
from typing import Dict, List, Optional
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
import pdfplumber
import pypdf
from datetime import datetime
from bson import ObjectId

class ResumeParserAgent:
    """Agent responsible for parsing resumes and extracting structured information"""
    
    def __init__(self, llm_model: str = "gpt-4"):
        self.llm = ChatOpenAI(model=llm_model, temperature=0.1)
        self.agent = self._create_agent()
    
    def _create_agent(self) -> Agent:
        """Create the resume parser agent"""
        return Agent(
            role='Resume Parser Specialist',
            goal='Extract structured information from resumes accurately and comprehensively',
            backstory="""You are an expert in parsing resumes and extracting relevant information. 
            You have years of experience in understanding various resume formats and can identify 
            key information such as contact details, education, work experience, skills, and certifications. 
            You pay attention to detail and ensure no important information is missed.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF using multiple methods for better coverage"""
        text = ""
        
        # Try pdfplumber first (better for complex layouts)
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"pdfplumber failed: {e}")
        
        # If pdfplumber didn't get much, try pypdf
        if len(text.strip()) < 100:
            try:
                with open(pdf_path, 'rb') as file:
                    pdf_reader = pypdf.PdfReader(file)
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception as e:
                print(f"pypdf failed: {e}")
        
        return text.strip()
    
    def parse_single_resume(self, pdf_path: str, job_id: Optional[str] = None) -> Dict:
        """Parse a single resume and extract structured information"""
        
        # Extract text from PDF
        resume_text = self.extract_text_from_pdf(pdf_path)
        
        if not resume_text:
            return {"error": "Could not extract text from PDF"}
        
        # Create parsing task
        parsing_task = Task(
            description=f"""
            Parse the following resume and extract structured information.
            
            Resume text:
            {resume_text}
            
            Extract the following information:
            1. Full name
            2. Email address
            3. Phone number
            4. Professional summary (if available)
            5. Education history (degree, institution, graduation year)
            6. Work experience (company, position, duration, key responsibilities)
            7. Technical skills (programming languages, tools, frameworks)
            8. Soft skills
            9. Certifications (if any)
            10. Languages spoken (if mentioned)
            
            Return the information in a structured format with clear sections.
            Be thorough and don't miss any important details.
            If certain information is not available, indicate it as "Not found".
            """,
            expected_output="""A structured JSON-like format containing:
            - name: Full name
            - email: Email address
            - phone: Phone number
            - summary: Professional summary
            - education: List of educational qualifications
            - experience: List of work experiences
            - skills: List of technical skills
            - soft_skills: List of soft skills
            - certifications: List of certifications
            - languages: List of languages
            """,
            agent=self.agent
        )
        
        # Create crew and execute
        crew = Crew(
            agents=[self.agent],
            tasks=[parsing_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        
        # Parse the result and structure it
        parsed_data = self._structure_parsed_data(str(result), resume_text)
        parsed_data['resume_path'] = pdf_path
        parsed_data['job_id'] = job_id
        
        return parsed_data
    
    def _structure_parsed_data(self, llm_output: str, original_text: str) -> Dict:
        """Structure the parsed data from LLM output"""
        
        # Initialize default structure
        structured_data = {
            'name': '',
            'email': '',
            'phone': '',
            'summary': '',
            'education': [],
            'experience': [],
            'skills': [],
            'soft_skills': [],
            'certifications': [],
            'languages': []
        }
        
        # Extract email using regex as backup
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, original_text)
        if emails:
            structured_data['email'] = emails[0]
        
        # Extract phone using regex as backup
        phone_pattern = r'[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}'
        phones = re.findall(phone_pattern, original_text)
        if phones:
            structured_data['phone'] = phones[0]
        
        # Parse LLM output
        try:
            # This is a simplified parser - in production, you'd want more robust parsing
            lines = llm_output.split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check for section headers
                if 'name:' in line.lower():
                    structured_data['name'] = line.split(':', 1)[1].strip()
                elif 'email:' in line.lower() and not structured_data['email']:
                    structured_data['email'] = line.split(':', 1)[1].strip()
                elif 'phone:' in line.lower() and not structured_data['phone']:
                    structured_data['phone'] = line.split(':', 1)[1].strip()
                elif 'summary:' in line.lower():
                    structured_data['summary'] = line.split(':', 1)[1].strip()
                elif 'education:' in line.lower():
                    current_section = 'education'
                elif 'experience:' in line.lower():
                    current_section = 'experience'
                elif 'skills:' in line.lower() or 'technical skills:' in line.lower():
                    current_section = 'skills'
                elif 'soft skills:' in line.lower():
                    current_section = 'soft_skills'
                elif 'certifications:' in line.lower():
                    current_section = 'certifications'
                elif 'languages:' in line.lower():
                    current_section = 'languages'
                elif current_section and line.startswith(('-', '•', '*')):
                    # Add items to current section
                    item = line.lstrip('-•* ').strip()
                    if current_section in structured_data and isinstance(structured_data[current_section], list):
                        structured_data[current_section].append(item)
        
        except Exception as e:
            print(f"Error parsing LLM output: {e}")
        
        return structured_data
    
    def parse_resume_folder(self, folder_path: str, job_id: Optional[str] = None) -> List[Dict]:
        """Parse all resumes in a folder"""
        parsed_resumes = []
        
        # Get all PDF files in the folder
        pdf_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
        
        for pdf_file in pdf_files:
            pdf_path = os.path.join(folder_path, pdf_file)
            print(f"Parsing resume: {pdf_file}")
            
            try:
                parsed_data = self.parse_single_resume(pdf_path, job_id)
                parsed_resumes.append(parsed_data)
            except Exception as e:
                print(f"Error parsing {pdf_file}: {e}")
                parsed_resumes.append({
                    'error': str(e),
                    'resume_path': pdf_path,
                    'job_id': job_id
                })
        
        return parsed_resumes 