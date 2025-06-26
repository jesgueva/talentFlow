from typing import Dict, List, Optional
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
from datetime import datetime, timedelta
from bson import ObjectId
import random

class InterviewSchedulingAgent:
    """Agent responsible for scheduling interviews with approved candidates"""
    
    def __init__(self, llm_model: str = "gpt-4"):
        self.llm = ChatOpenAI(model=llm_model, temperature=0.1)
        self.agent = self._create_agent()
    
    def _create_agent(self) -> Agent:
        """Create the interview scheduling agent"""
        return Agent(
            role='Interview Coordinator',
            goal='Efficiently schedule interviews with approved candidates while accommodating their preferences',
            backstory="""You are a professional interview coordinator with years of experience in 
            scheduling and managing recruitment interviews. You excel at finding suitable time slots 
            that work for both candidates and interviewers. You understand the importance of clear 
            communication, timely responses, and creating a positive candidate experience. You're 
            skilled at handling scheduling conflicts and finding alternative solutions.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
    
    def generate_interview_slots(self, 
                               start_date: datetime,
                               end_date: datetime,
                               business_hours: tuple = (9, 17),
                               interview_duration: int = 60,
                               existing_interviews: List[Dict] = None) -> List[datetime]:
        """Generate available interview slots"""
        
        existing_interviews = existing_interviews or []
        available_slots = []
        
        # Get booked times
        booked_times = []
        for interview in existing_interviews:
            if interview.get('scheduled_at') and interview.get('status') != 'cancelled':
                booked_times.append(interview['scheduled_at'])
        
        # Generate slots for each business day
        current_date = start_date
        while current_date <= end_date:
            # Skip weekends
            if current_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
                current_date += timedelta(days=1)
                continue
            
            # Generate hourly slots for the day
            slot_time = current_date.replace(hour=business_hours[0], minute=0, second=0, microsecond=0)
            end_time = current_date.replace(hour=business_hours[1], minute=0, second=0, microsecond=0)
            
            while slot_time + timedelta(minutes=interview_duration) <= end_time:
                # Check if slot is available
                is_available = True
                for booked in booked_times:
                    if (slot_time <= booked < slot_time + timedelta(minutes=interview_duration)):
                        is_available = False
                        break
                
                if is_available:
                    available_slots.append(slot_time)
                
                # Move to next slot (30-minute intervals)
                slot_time += timedelta(minutes=30)
            
            current_date += timedelta(days=1)
        
        return available_slots
    
    def schedule_interview(self, 
                         candidate: Dict,
                         job: Dict,
                         preferred_times: List[datetime] = None,
                         interviewers: List[str] = None,
                         interview_type: str = 'initial',
                         location: str = 'Virtual',
                         duration_minutes: int = 60) -> Dict:
        """Schedule an interview for a candidate"""
        
        # If no preferred times, generate some options
        if not preferred_times:
            start_date = datetime.now() + timedelta(days=3)  # Start 3 days from now
            end_date = start_date + timedelta(days=14)  # 2 weeks window
            available_slots = self.generate_interview_slots(start_date, end_date)
            
            # Select 3 random slots as options
            if available_slots:
                preferred_times = random.sample(available_slots, min(3, len(available_slots)))
            else:
                preferred_times = [datetime.now() + timedelta(days=7)]  # Default to 1 week from now
        
        # Create interview scheduling task
        scheduling_task = Task(
            description=f"""
            Create an interview schedule for the following candidate:
            
            Candidate: {candidate.get('name', 'Unknown')}
            Position: {job.get('title', 'Unknown Position')}
            Interview Type: {interview_type}
            Duration: {duration_minutes} minutes
            Location: {location}
            
            Available time slots:
            {self._format_time_slots(preferred_times)}
            
            Based on the interview type and candidate profile, suggest:
            1. The best time slot from the available options
            2. Key topics to cover during the interview
            3. Preparation tips for the candidate
            4. Any special considerations
            """,
            expected_output="""A structured interview plan with:
            - selected_time: The chosen time slot
            - interview_agenda: Topics to cover
            - candidate_prep: Preparation tips for the candidate
            - special_notes: Any special considerations
            """,
            agent=self.agent
        )
        
        # Create crew and execute
        crew = Crew(
            agents=[self.agent],
            tasks=[scheduling_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        
        # Parse scheduling result
        scheduling_details = self._parse_scheduling_result(str(result), preferred_times)
        
        # Create interview record
        interview_data = {
            'candidate_id': candidate.get('_id'),
            'job_id': job.get('_id'),
            'scheduled_at': scheduling_details['selected_time'],
            'duration_minutes': duration_minutes,
            'interview_type': interview_type,
            'location': location,
            'meeting_link': self._generate_meeting_link() if location == 'Virtual' else '',
            'interviewers': interviewers or [],
            'status': 'scheduled',
            'candidate_confirmed': False,
            'notes': scheduling_details.get('interview_agenda', ''),
            'candidate_prep_notes': scheduling_details.get('candidate_prep', ''),
            'special_considerations': scheduling_details.get('special_notes', '')
        }
        
        return interview_data
    
    def process_candidate_response(self, 
                                 interview_id: str,
                                 response_type: str,
                                 new_time_preferences: List[datetime] = None,
                                 message: str = '') -> Dict:
        """Process candidate response to interview invitation"""
        
        response_task = Task(
            description=f"""
            Process the following candidate response to an interview invitation:
            
            Response Type: {response_type} (accept/decline/reschedule)
            Message from candidate: {message}
            
            {f"New time preferences: {self._format_time_slots(new_time_preferences)}" if new_time_preferences else ""}
            
            Based on the response:
            1. Determine the appropriate action
            2. Suggest a professional response message
            3. Identify any follow-up actions needed
            """,
            expected_output="""A structured response plan with:
            - action: The action to take
            - response_message: Professional response to send
            - follow_up_actions: List of follow-up actions
            - new_status: Updated interview status
            """,
            agent=self.agent
        )
        
        # Create crew and execute
        crew = Crew(
            agents=[self.agent],
            tasks=[response_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        
        # Parse response result
        response_plan = self._parse_response_result(str(result))
        
        return {
            'interview_id': interview_id,
            'action': response_plan.get('action', response_type),
            'new_status': response_plan.get('new_status', 'scheduled'),
            'response_message': response_plan.get('response_message', ''),
            'follow_up_actions': response_plan.get('follow_up_actions', [])
        }
    
    def _format_time_slots(self, time_slots: List[datetime]) -> str:
        """Format time slots for display"""
        if not time_slots:
            return "No time slots available"
        
        formatted_slots = []
        for slot in time_slots:
            formatted_slots.append(slot.strftime("%A, %B %d, %Y at %I:%M %p"))
        
        return "\n".join(f"{i+1}. {slot}" for i, slot in enumerate(formatted_slots))
    
    def _generate_meeting_link(self) -> str:
        """Generate a placeholder meeting link"""
        # In production, this would integrate with actual meeting platforms
        meeting_id = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=10))
        return f"https://meet.company.com/interview/{meeting_id}"
    
    def _parse_scheduling_result(self, llm_output: str, available_times: List[datetime]) -> Dict:
        """Parse the scheduling result from LLM output"""
        
        result = {
            'selected_time': available_times[0] if available_times else datetime.now() + timedelta(days=7),
            'interview_agenda': '',
            'candidate_prep': '',
            'special_notes': ''
        }
        
        try:
            lines = llm_output.split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Parse sections
                if 'selected_time:' in line.lower() or 'chosen time:' in line.lower():
                    # Try to extract time slot number
                    import re
                    numbers = re.findall(r'\d+', line)
                    if numbers and available_times:
                        slot_index = int(numbers[0]) - 1  # Convert to 0-based index
                        if 0 <= slot_index < len(available_times):
                            result['selected_time'] = available_times[slot_index]
                
                elif 'interview_agenda:' in line.lower() or 'topics to cover:' in line.lower():
                    current_section = 'interview_agenda'
                elif 'candidate_prep:' in line.lower() or 'preparation tips:' in line.lower():
                    current_section = 'candidate_prep'
                elif 'special_notes:' in line.lower() or 'special considerations:' in line.lower():
                    current_section = 'special_notes'
                
                # Add content to current section
                elif current_section and line:
                    if current_section in result:
                        if result[current_section]:
                            result[current_section] += '\n' + line
                        else:
                            result[current_section] = line
        
        except Exception as e:
            print(f"Error parsing scheduling result: {e}")
        
        return result
    
    def _parse_response_result(self, llm_output: str) -> Dict:
        """Parse the response processing result from LLM output"""
        
        result = {
            'action': 'accept',
            'response_message': '',
            'follow_up_actions': [],
            'new_status': 'scheduled'
        }
        
        try:
            lines = llm_output.split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Parse sections
                if 'action:' in line.lower():
                    result['action'] = line.split(':', 1)[1].strip().lower()
                elif 'new_status:' in line.lower():
                    result['new_status'] = line.split(':', 1)[1].strip().lower()
                elif 'response_message:' in line.lower():
                    current_section = 'response_message'
                    if ':' in line:
                        result['response_message'] = line.split(':', 1)[1].strip()
                elif 'follow_up_actions:' in line.lower():
                    current_section = 'follow_up_actions'
                
                # Add content to current section
                elif current_section == 'response_message' and line:
                    if result['response_message']:
                        result['response_message'] += '\n' + line
                    else:
                        result['response_message'] = line
                elif current_section == 'follow_up_actions' and line.startswith(('-', '•', '*')):
                    action = line.lstrip('-•* ').strip()
                    result['follow_up_actions'].append(action)
        
        except Exception as e:
            print(f"Error parsing response result: {e}")
        
        return result 