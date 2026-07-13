import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logger = logging.getLogger("finsight")

app = FastAPI(title="FinSight API")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Starlette routes handlers registered for bare Exception through
    # ServerErrorMiddleware, which sits *outside* CORSMiddleware no matter
    # what order add_middleware/exception_handler are called in - so a 500
    # from this handler never picks up CORS headers from the middleware
    # itself. The browser then reports a misleading "CORS error" instead of
    # the real 500. Setting the header directly here is the actual fix.
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    response = JSONResponse(status_code=500, content={"error": "internal_server_error", "detail": str(exc)})
    response.headers["Access-Control-Allow-Origin"] = request.headers.get("origin", "*")
    return response

from app.routers import dashboard, insights, llm_settings, nlq, scope_options, scorecards, uploads

app.include_router(uploads.router)
app.include_router(dashboard.router)
app.include_router(scorecards.router)
app.include_router(insights.router)
app.include_router(nlq.router)
app.include_router(scope_options.router)
app.include_router(llm_settings.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}
