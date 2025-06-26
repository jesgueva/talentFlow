from typing import Dict
from datetime import datetime

class EmailTemplates:
    """Email templates for various communication types"""
    
    @staticmethod
    def interview_invitation(candidate_name: str, job_title: str, company_name: str) -> Dict[str, str]:
        """Generate interview invitation email"""
        subject = f"Interview Invitation - {job_title} Position at {company_name}"
        
        body = f"""Dear {candidate_name},

Thank you for your application for the {job_title} position at {company_name}. We were impressed with your qualifications and would like to invite you for an interview.

We would appreciate if you could provide us with your availability for the next two weeks. Please suggest 2-3 time slots that work best for you, and we will do our best to accommodate your schedule.

The interview will be approximately 60 minutes and will cover:
- Your background and experience
- Technical skills relevant to the position
- Your interest in the role and our company
- Questions you may have about the position

Please respond to this email with your availability at your earliest convenience.

We look forward to meeting you!

Best regards,
HR Team
{company_name}"""
        
        return {"subject": subject, "body": body}
    
    @staticmethod
    def interview_confirmation(candidate_name: str, job_title: str, interview_date: datetime, 
                             location: str, duration: int, company_name: str) -> Dict[str, str]:
        """Generate interview confirmation email"""
        subject = f"Interview Confirmation - {job_title} at {company_name}"
        
        formatted_date = interview_date.strftime("%B %d, %Y at %I:%M %p")
        
        body = f"""Dear {candidate_name},

This email confirms your interview for the {job_title} position at {company_name}.

Interview Details:
📅 Date & Time: {formatted_date}
📍 Location: {location}
⏱️ Duration: {duration} minutes

What to Prepare:
- Please bring a copy of your resume
- Be prepared to discuss your experience and skills
- Prepare any questions you have about the role or company

If you need to reschedule or have any questions, please don't hesitate to contact us.

We look forward to meeting you!

Best regards,
HR Team
{company_name}"""
        
        return {"subject": subject, "body": body}
    
    @staticmethod
    def interview_reminder(candidate_name: str, job_title: str, interview_date: datetime, 
                          location: str, company_name: str) -> Dict[str, str]:
        """Generate interview reminder email"""
        subject = f"Interview Reminder - {job_title} at {company_name} Tomorrow"
        
        formatted_date = interview_date.strftime("%B %d, %Y at %I:%M %p")
        
        body = f"""Dear {candidate_name},

This is a friendly reminder about your upcoming interview for the {job_title} position at {company_name}.

Interview Details:
📅 Date & Time: {formatted_date} (Tomorrow)
📍 Location: {location}

Please let us know if you have any questions or concerns.

See you tomorrow!

Best regards,
HR Team
{company_name}"""
        
        return {"subject": subject, "body": body}
    
    @staticmethod
    def application_received(candidate_name: str, job_title: str, company_name: str) -> Dict[str, str]:
        """Generate application received confirmation email"""
        subject = f"Application Received - {job_title} at {company_name}"
        
        body = f"""Dear {candidate_name},

Thank you for applying for the {job_title} position at {company_name}. We have successfully received your application and resume.

Our recruitment team will carefully review your qualifications. If your profile matches our requirements, we will contact you to schedule an interview.

We appreciate your interest in joining our team and will keep you updated on the status of your application.

Best regards,
HR Team
{company_name}"""
        
        return {"subject": subject, "body": body}
    
    @staticmethod
    def rejection_email(candidate_name: str, job_title: str, company_name: str, 
                       personalized_message: str = "") -> Dict[str, str]:
        """Generate rejection email"""
        subject = f"Update on Your Application - {job_title} at {company_name}"
        
        additional_message = f"\n\n{personalized_message}" if personalized_message else ""
        
        body = f"""Dear {candidate_name},

Thank you for your interest in the {job_title} position at {company_name} and for taking the time to apply.

After careful consideration of your application, we have decided to move forward with other candidates whose qualifications more closely match our current needs.{additional_message}

We were impressed by your background and encourage you to apply for future openings that match your skills and experience. We will keep your resume on file for future opportunities.

We wish you the best in your job search and future career endeavors.

Best regards,
HR Team
{company_name}"""
        
        return {"subject": subject, "body": body}
    
    @staticmethod
    def request_additional_info(candidate_name: str, job_title: str, company_name: str, 
                               info_needed: str) -> Dict[str, str]:
        """Generate email requesting additional information"""
        subject = f"Additional Information Needed - {job_title} Application at {company_name}"
        
        body = f"""Dear {candidate_name},

Thank you for your application for the {job_title} position at {company_name}.

To proceed with your application, we need the following additional information:

{info_needed}

Please provide this information at your earliest convenience so we can continue with the evaluation process.

If you have any questions, please don't hesitate to reach out.

Best regards,
HR Team
{company_name}"""
        
        return {"subject": subject, "body": body}
    
    @staticmethod
    def custom_email(candidate_name: str, subject: str, message: str, company_name: str) -> Dict[str, str]:
        """Generate custom email"""
        body = f"""Dear {candidate_name},

{message}

Best regards,
HR Team
{company_name}"""
        
        return {"subject": subject, "body": body} 