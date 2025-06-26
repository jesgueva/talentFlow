from typing import Dict, List, Tuple
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
import numpy as np
from datetime import datetime

class CandidateRankingAgent:
    """Agent responsible for ranking candidates based on job requirements"""
    
    def __init__(self, llm_model: str = "gpt-4", ranking_weights: Dict = None):
        self.llm = ChatOpenAI(model=llm_model, temperature=0.1)
        self.agent = self._create_agent()
        self.ranking_weights = ranking_weights or {
            'skills_match': 0.40,
            'experience_relevance': 0.30,
            'education_match': 0.20,
            'overall_fit': 0.10
        }
    
    def _create_agent(self) -> Agent:
        """Create the candidate ranking agent"""
        return Agent(
            role='Talent Acquisition Specialist',
            goal='Evaluate and rank candidates based on their qualifications and fit for the job requirements',
            backstory="""You are an experienced talent acquisition specialist with deep expertise in 
            evaluating candidates. You have a keen eye for matching skills, experience, and cultural fit 
            with job requirements. You're fair, unbiased, and focus on finding the best candidates based 
            on merit and qualifications. You understand the importance of both technical skills and soft 
            skills in making successful placements.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
    
    def rank_candidates(self, candidates: List[Dict], job_requirements: Dict) -> List[Dict]:
        """Rank candidates based on job requirements"""
        ranked_candidates = []
        
        for candidate in candidates:
            if 'error' in candidate:
                # Skip candidates with parsing errors
                continue
            
            # Evaluate candidate
            evaluation = self._evaluate_candidate(candidate, job_requirements)
            
            # Calculate final score
            final_score = self._calculate_final_score(evaluation)
            
            # Determine tier
            tier = self._determine_tier(final_score)
            
            # Add ranking information to candidate
            candidate['ranking_score'] = final_score
            candidate['ranking_details'] = evaluation
            candidate['tier'] = tier
            
            ranked_candidates.append(candidate)
        
        # Sort by ranking score (descending)
        ranked_candidates.sort(key=lambda x: x['ranking_score'], reverse=True)
        
        return ranked_candidates
    
    def _evaluate_candidate(self, candidate: Dict, job_requirements: Dict) -> Dict:
        """Evaluate a single candidate against job requirements"""
        
        # Create evaluation task
        evaluation_task = Task(
            description=f"""
            Evaluate the following candidate against the job requirements.
            
            Candidate Information:
            Name: {candidate.get('name', 'Unknown')}
            Email: {candidate.get('email', 'Unknown')}
            
            Education: {', '.join(candidate.get('education', []))}
            
            Experience: {', '.join(candidate.get('experience', []))}
            
            Technical Skills: {', '.join(candidate.get('skills', []))}
            
            Soft Skills: {', '.join(candidate.get('soft_skills', []))}
            
            Certifications: {', '.join(candidate.get('certifications', []))}
            
            Summary: {candidate.get('summary', 'Not provided')}
            
            Job Requirements:
            Title: {job_requirements.get('title', 'Not specified')}
            
            Required Skills: {', '.join(job_requirements.get('requirements', {}).get('required_skills', []))}
            
            Preferred Skills: {', '.join(job_requirements.get('requirements', {}).get('preferred_skills', []))}
            
            Minimum Experience: {job_requirements.get('requirements', {}).get('min_experience_years', 0)} years
            
            Education Level: {job_requirements.get('requirements', {}).get('education_level', 'Not specified')}
            
            Required Certifications: {', '.join(job_requirements.get('requirements', {}).get('certifications', []))}
            
            Provide scores (0-100) for:
            1. Skills Match: How well do the candidate's skills match the requirements?
            2. Experience Relevance: How relevant is their experience to this role?
            3. Education Match: Does their education meet the requirements?
            4. Overall Fit: Overall assessment of the candidate's fit for the role
            
            Also provide:
            - Key strengths (bullet points)
            - Areas of concern (bullet points)
            - Recommendation summary
            """,
            expected_output="""A structured evaluation with:
            - skills_match_score: 0-100
            - experience_relevance_score: 0-100
            - education_match_score: 0-100
            - overall_fit_score: 0-100
            - strengths: List of key strengths
            - concerns: List of areas of concern
            - recommendation: Brief recommendation summary
            """,
            agent=self.agent
        )
        
        # Create crew and execute
        crew = Crew(
            agents=[self.agent],
            tasks=[evaluation_task],
            process=Process.sequential,
            verbose=True
        )
        
        result = crew.kickoff()
        
        # Parse the evaluation result
        evaluation = self._parse_evaluation_result(str(result))
        
        return evaluation
    
    def _parse_evaluation_result(self, llm_output: str) -> Dict:
        """Parse the evaluation result from LLM output"""
        
        evaluation = {
            'skills_match_score': 0,
            'experience_relevance_score': 0,
            'education_match_score': 0,
            'overall_fit_score': 0,
            'strengths': [],
            'concerns': [],
            'recommendation': ''
        }
        
        try:
            lines = llm_output.split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Parse scores
                if 'skills_match_score:' in line.lower() or 'skills match:' in line.lower():
                    score = self._extract_score(line)
                    evaluation['skills_match_score'] = score
                elif 'experience_relevance_score:' in line.lower() or 'experience relevance:' in line.lower():
                    score = self._extract_score(line)
                    evaluation['experience_relevance_score'] = score
                elif 'education_match_score:' in line.lower() or 'education match:' in line.lower():
                    score = self._extract_score(line)
                    evaluation['education_match_score'] = score
                elif 'overall_fit_score:' in line.lower() or 'overall fit:' in line.lower():
                    score = self._extract_score(line)
                    evaluation['overall_fit_score'] = score
                
                # Parse sections
                elif 'strengths:' in line.lower() or 'key strengths:' in line.lower():
                    current_section = 'strengths'
                elif 'concerns:' in line.lower() or 'areas of concern:' in line.lower():
                    current_section = 'concerns'
                elif 'recommendation:' in line.lower():
                    current_section = 'recommendation'
                    # Get recommendation from the same line if available
                    if ':' in line:
                        evaluation['recommendation'] = line.split(':', 1)[1].strip()
                
                # Add items to current section
                elif current_section and line.startswith(('-', '•', '*')):
                    item = line.lstrip('-•* ').strip()
                    if current_section in ['strengths', 'concerns']:
                        evaluation[current_section].append(item)
                elif current_section == 'recommendation' and not evaluation['recommendation']:
                    evaluation['recommendation'] = line
        
        except Exception as e:
            print(f"Error parsing evaluation result: {e}")
        
        return evaluation
    
    def _extract_score(self, line: str) -> int:
        """Extract numeric score from a line of text"""
        import re
        
        # Find numbers in the line
        numbers = re.findall(r'\d+', line)
        if numbers:
            score = int(numbers[0])
            # Ensure score is between 0 and 100
            return min(max(score, 0), 100)
        return 0
    
    def _calculate_final_score(self, evaluation: Dict) -> float:
        """Calculate the final ranking score based on weighted criteria"""
        
        score = (
            evaluation['skills_match_score'] * self.ranking_weights['skills_match'] +
            evaluation['experience_relevance_score'] * self.ranking_weights['experience_relevance'] +
            evaluation['education_match_score'] * self.ranking_weights['education_match'] +
            evaluation['overall_fit_score'] * self.ranking_weights['overall_fit']
        )
        
        return round(score, 2)
    
    def _determine_tier(self, score: float) -> str:
        """Determine candidate tier based on score"""
        
        if score >= 80:
            return 'strong_fit'
        elif score >= 60:
            return 'moderate_fit'
        elif score >= 40:
            return 'weak_fit'
        else:
            return 'not_suitable'
    
    def get_ranking_summary(self, ranked_candidates: List[Dict]) -> Dict:
        """Generate a summary of the ranking results"""
        
        summary = {
            'total_candidates': len(ranked_candidates),
            'tier_distribution': {
                'strong_fit': 0,
                'moderate_fit': 0,
                'weak_fit': 0,
                'not_suitable': 0
            },
            'average_score': 0,
            'top_candidates': []
        }
        
        if not ranked_candidates:
            return summary
        
        # Calculate tier distribution
        for candidate in ranked_candidates:
            tier = candidate.get('tier', 'not_suitable')
            summary['tier_distribution'][tier] += 1
        
        # Calculate average score
        scores = [c.get('ranking_score', 0) for c in ranked_candidates]
        summary['average_score'] = round(np.mean(scores), 2)
        
        # Get top 5 candidates
        summary['top_candidates'] = [
            {
                'name': c.get('name', 'Unknown'),
                'email': c.get('email', 'Unknown'),
                'score': c.get('ranking_score', 0),
                'tier': c.get('tier', 'not_suitable'),
                'key_strengths': c.get('ranking_details', {}).get('strengths', [])[:3]
            }
            for c in ranked_candidates[:5]
        ]
        
        return summary 