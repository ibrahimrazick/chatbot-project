from fastapi import APIRouter
from app.schemas.request import ChatRequest
from app.services.grok_service import ask_grok

router = APIRouter()

@router.post("/chat")
def chat(request: ChatRequest):
    reply = ask_grok(request.message)
    return {"reply": reply}