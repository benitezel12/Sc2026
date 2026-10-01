from flask import Flask, render_template
import os
from dotenv import load_dotenv

load_dotenv()
app=Flask(__name__)

@app.context_processor
def config():
    return dict(
        SUPABASE_URL=os.getenv("SUPABASE_URL",""),
        SUPABASE_PUBLISHABLE_KEY=os.getenv("SUPABASE_PUBLISHABLE_KEY","")
    )

@app.get("/")
def index(): return render_template("login.html")

@app.get("/dashboard")
def dashboard(): return render_template("dashboard.html")

@app.get("/vendedores")
def vendedores(): return render_template("vendedores.html")

@app.get("/boletas")
def boletas(): return render_template("boletas.html")

if __name__=="__main__":
    app.run(debug=True)
