from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/health', status_code=200)
def test_health():
    return {'status': 'Server is healthy!'}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)

