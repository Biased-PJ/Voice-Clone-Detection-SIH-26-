from pydantic import BaseModel
from typing import List, Optional

class AnalyzeRequest(BaseModel):
    session_id: str
    transcript: str
    
    language: str

class AnalyzeResponse(BaseModel):
    session_id: str
    language: str
    risk_score: int
    risk_level: str
    synthetic_probability: float

    speaker_match_probability: float
    ai_voice_percent: float = 0.0
    scam_score: int = 0
    risk_factors: List[str]
    suggestion: str
    threat_location: Optional[dict] = None

class CallStartRequest(BaseModel):
    language: str

class CallSessionResponse(BaseModel):
    session_id: str
    user_id: str
    language: str
    status: str


    started_at: str
    ended_at: Optional[str] = None
    threat_location: Optional[dict] = None

class AlertResponse(BaseModel):
    alert_id: str
    session_id: str

    user_id: str
    risk_score: int
    risk_level: str
    message: str
    created_at: str

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    credential: str  

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: Optional[str] = "user"