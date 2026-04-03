from fastapi import FastAPI

from app.api.routes.actions import router as action_router
from app.api.routes.system import router as system_router
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME, debug=settings.APP_DEBUG)
app.include_router(system_router)
app.include_router(action_router)
