from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException

SERVICE_A_URL = "http://service-a:5000/"

http_client: httpx.AsyncClient


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient()
    yield
    await http_client.aclose()


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def index():
    try:
        response = await http_client.get(SERVICE_A_URL)
        response.raise_for_status()
        service_a_data = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Service A unavailable: {exc}") from exc

    return {
        "service_b": {"message": "Hello from Service B", "status": "success"},
        "service_a": service_a_data,
    }
