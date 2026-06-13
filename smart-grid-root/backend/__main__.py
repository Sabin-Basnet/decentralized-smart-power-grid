"""
__main__.py - Entry point for Smart Grid Backend
Alternative way to run the FastAPI server
"""
import uvicorn
from main import app

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════════════════╗
    ║     Smart Grid Backend - FastAPI Server           ║
    ║                                                    ║
    ║  API Docs: http://localhost:8000/docs             ║
    ║  ReDoc:    http://localhost:8000/redoc            ║
    ║  Health:   http://localhost:8000/api/health       ║
    ╚════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
