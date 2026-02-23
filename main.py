from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd

app = FastAPI()

# Load dataset
df = pd.read_csv("./models/data.csv")

# ---------- Models ----------

class ChatRequest(BaseModel):
    message: str


# ---------- Routes ----------

@app.get("/")
def root():
    return {"message": "EcoWatch API running 🌱"}


# Get all entries from dataset
@app.get("/entries")
def get_entries():
    return df.to_dict(orient="records")


# Filter by species
@app.get("/entries/{species}")
def get_species_entries(species: str):
    filtered = df[df["species"] == species]
    return filtered.to_dict(orient="records")


# Weekly forecast (simple logic)
@app.get("/forecast")
def forecast():
    freq = df["frequency_level"].value_counts().to_dict()
    return {
        "summary": "Weekly wildlife frequency forecast",
        "data": freq
    }


# AI Chat (placeholder)
@app.post("/chat")
def chat_ai(chat: ChatRequest):
    return {
        "reply": f"AI says: based on data, wildlife activity is moderate 🐾"
    }