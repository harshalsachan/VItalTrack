import ctypes
import os
import sqlite3
import platform
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # We will lock this down to your Vercel URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. DATABASE SETUP (Multi-Tenant)
# ==========================================
def get_db():
    conn = sqlite3.connect("vitaltrack.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS caretakers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL
        )
    """)
    # ADDED: caretaker_id to patients
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY,
            caretaker_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            risk_score INTEGER NOT NULL
        )
    """)
    # ADDED: caretaker_id to tasks
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            caretaker_id INTEGER NOT NULL,
            patient_name TEXT NOT NULL,
            description TEXT NOT NULL,
            time TEXT NOT NULL
        )
    """)
    # ADDED: Time-series table for daily vitals
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_vitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            date TEXT DEFAULT CURRENT_TIMESTAMP,
            sys_bp INTEGER NOT NULL,
            dia_bp INTEGER NOT NULL,
            heart_rate INTEGER NOT NULL,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        )
    """)
    # ADDED: Table to store AI-generated anomalies
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            alert_level TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ==========================================
# 2. DATA MODELS & AUTHENTICATION
# ==========================================
class CaretakerRegister(BaseModel):
    name: str; email: str; password: str

class CaretakerLogin(BaseModel):
    email: str; password: str

class NewPatient(BaseModel):
    id: int; name: str; age: int; riskScore: int; caretakerId: int

class DailyReading(BaseModel):
    patientId: int
    sysBp: int
    diaBp: int
    heartRate: int

class NewTask(BaseModel):
    patientName: str; description: str; time: str; caretakerId: int

class PatientHistory(BaseModel):
    days: list[int]; mobility_scores: list[int]

@app.post("/api/register")
def register_caretaker(caretaker: CaretakerRegister):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO caretakers (email, password, name) VALUES (?, ?, ?)", 
                       (caretaker.email, caretaker.password, caretaker.name))
        conn.commit()
        return {"message": "Account created successfully!"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    finally:
        conn.close()

@app.post("/api/login")
def login_caretaker(caretaker: CaretakerLogin):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM caretakers WHERE email = ? AND password = ?", (caretaker.email, caretaker.password))
    user = cursor.fetchone()
    conn.close()
    if user: return {"message": "Login successful", "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}
    raise HTTPException(status_code=401, detail="Invalid email or password")


# ==========================================
# 3. C++ ENGINE BRIDGE (CLOUD & LOCAL COMPATIBLE)
# ==========================================
# Dynamically load .dll for Windows or .so for Linux (Render)
is_windows = platform.system() == "Windows"
lib_ext = "dll" if is_windows else "so"

if is_windows:
    # Local Windows path
    engine_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'cpp_engine', f'engine.{lib_ext}'))
else:
    # Render Linux path (build.sh puts it directly in the backend folder)
    engine_path = os.path.join(os.path.dirname(__file__), f'engine.{lib_ext}')

try:
    cpp_engine = ctypes.cdll.LoadLibrary(engine_path)
    cpp_engine.get_patient_name.restype = ctypes.c_char_p
    cpp_engine.get_patient_risk.restype = ctypes.c_int
    cpp_engine.get_patient_age.restype = ctypes.c_int
    cpp_engine.get_high_risk_patients.argtypes = [ctypes.POINTER(ctypes.c_int), ctypes.c_int]
    
    cpp_engine.get_task_count.restype = ctypes.c_int
    cpp_engine.get_task_name.restype = ctypes.c_char_p
    cpp_engine.get_task_desc.restype = ctypes.c_char_p
    cpp_engine.get_task_time.restype = ctypes.c_char_p
    print("✅ C++ Engine Loaded Successfully!")

    def sync_db_to_cpp():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patients")
        for row in cursor.fetchall():
            cpp_engine.create_patient(row['id'], row['name'].encode('utf-8'), row['age'], row['risk_score'])
        cursor.execute("SELECT * FROM tasks ORDER BY id ASC")
        for row in cursor.fetchall():
            cpp_engine.add_task(row['id'], row['patient_name'].encode('utf-8'), row['description'].encode('utf-8'), row['time'].encode('utf-8'))
        conn.close()
        print("✅ Production Data Synced from SQLite to C++ Memory!")

    sync_db_to_cpp()
except Exception as e:
    print(f"❌ Failed to load C++ engine: {e}")

# ==========================================
# 4. PATIENT & TASK ENDPOINTS (Isolated)
# ==========================================
@app.get("/api/patients")
def get_all_patients(caretaker_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, age, risk_score FROM patients WHERE caretaker_id = ? ORDER BY name ASC", (caretaker_id,))
    patients = [{"id": row["id"], "name": row["name"], "age": row["age"], "riskScore": row["risk_score"]} for row in cursor.fetchall()]
    conn.close()
    return patients

@app.post("/api/patients")
def add_new_patient(patient: NewPatient):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO patients (id, caretaker_id, name, age, risk_score) VALUES (?, ?, ?, ?, ?)",
                       (patient.id, patient.caretakerId, patient.name, patient.age, patient.riskScore))
        conn.commit()
        cpp_engine.create_patient(patient.id, patient.name.encode('utf-8'), patient.age, patient.riskScore)
        return {"message": "Patient saved to DB and C++ Memory"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Patient ID already exists in DB.")
    finally:
        conn.close()

@app.get("/api/patients/high-risk")
def get_high_risk_alerts(caretaker_id: int):
    IntArray5 = ctypes.c_int * 5
    out_ids = IntArray5()
    count = cpp_engine.get_high_risk_patients(out_ids, 5)
    
    alerts = []
    conn = get_db()
    cursor = conn.cursor()
    
    for i in range(count):
        p_id = out_ids[i]
        cursor.execute("SELECT id FROM patients WHERE id = ? AND caretaker_id = ?", (p_id, caretaker_id))
        if cursor.fetchone():
            score = cpp_engine.get_patient_risk(p_id)
            if score > 70:
                name = cpp_engine.get_patient_name(p_id).decode('utf-8')
                alerts.append({"id": p_id, "name": name, "reason": f"Risk score: {score}/100", "riskLevel": "Critical" if score > 90 else "High"})
    conn.close()
    return alerts

@app.get("/api/patients/{patient_id}")
def get_patient_profile(patient_id: int):
    name_bytes = cpp_engine.get_patient_name(patient_id)
    if name_bytes == b"Not Found":
        raise HTTPException(status_code=404, detail="Patient not found")
    score = cpp_engine.get_patient_risk(patient_id)
    age = cpp_engine.get_patient_age(patient_id)
    return {"id": patient_id, "name": name_bytes.decode('utf-8'), "age": age, "status": "Critical" if score > 90 else "High Risk" if score > 70 else "Low Risk", "riskScore": score}

@app.get("/api/tasks")
def get_waiting_room_tasks(caretaker_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, patient_name, description, time FROM tasks WHERE caretaker_id = ? ORDER BY id ASC", (caretaker_id,))
    tasks = [{"id": row["id"], "patientName": row["patient_name"], "description": row["description"], "time": row["time"]} for row in cursor.fetchall()]
    conn.close()
    return tasks

@app.post("/api/tasks")
def create_new_task(task: NewTask):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tasks (caretaker_id, patient_name, description, time) VALUES (?, ?, ?, ?)", 
                   (task.caretakerId, task.patientName, task.description, task.time))
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    cpp_engine.add_task(task_id, task.patientName.encode('utf-8'), task.description.encode('utf-8'), task.time.encode('utf-8'))
    return {"message": "Task saved"}

@app.post("/api/tasks/complete")
def complete_front_task(task_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    cpp_engine.complete_task()
    return {"message": "Task dequeued"}

@app.post("/api/ai/predict-risk")
def predict_future_risk(history: PatientHistory):
    x, y, n = history.days, history.mobility_scores, len(history.days)
    sum_x, sum_y = sum(x), sum(y)
    sum_xy = sum(x[i] * y[i] for i in range(n))
    sum_x_squared = sum(x[i] ** 2 for i in range(n))
    denominator = (n * sum_x_squared) - (sum_x ** 2)
    slope = 0 if denominator == 0 else ((n * sum_xy) - (sum_x * sum_y)) / denominator
    intercept = (sum_y - (slope * sum_x)) / n
    next_day = x[-1] + 1
    predicted_mobility = (slope * next_day) + intercept
    predicted_risk = max(0, min(100, 100 - int(predicted_mobility)))
    warning = "CRITICAL: Rapid Decline" if slope < -5 else "Warning: Slow Decline" if slope < 0 else "Stable"
    return {"predicted_mobility_score": round(predicted_mobility, 1), "predicted_risk_score": predicted_risk, "trajectory_slope": round(slope, 2), "ai_warning": warning}

from statistics import mean

@app.post("/api/vitals/log")
def log_daily_reading(reading: DailyReading):
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Save today's reading
    cursor.execute("""
        INSERT INTO daily_vitals (patient_id, sys_bp, dia_bp, heart_rate) 
        VALUES (?, ?, ?, ?)
    """, (reading.patientId, reading.sysBp, reading.diaBp, reading.heartRate))
    
    # 2. Fetch recent history for AI Anomaly Detection
    cursor.execute("""
        SELECT sys_bp FROM daily_vitals 
        WHERE patient_id = ? ORDER BY date DESC LIMIT 4
    """, (reading.patientId,))
    history = cursor.fetchall()
    
    alert_triggered = None
    
    # 3. AI Logic: Check for a 10% spike against a 3-day moving average
    if len(history) >= 4:
        # history[0] is today. history[1:4] is the past 3 readings.
        past_sys_bps = [row['sys_bp'] for row in history[1:4]] 
        avg_past_sys = mean(past_sys_bps)
        
        if reading.sysBp >= (avg_past_sys * 1.10):
            alert_triggered = f"AI ALERT: 10% BP Spike Detected. Jumped from baseline ~{int(avg_past_sys)} to {reading.sysBp} mmHg."
            
            # Log the critical alert
            cursor.execute("INSERT INTO alerts (patient_id, alert_level, message) VALUES (?, ?, ?)",
                           (reading.patientId, "Critical", alert_triggered))
            
            # (Optional) Update the overall risk_score in the patients table here
            cursor.execute("UPDATE patients SET risk_score = risk_score + 15 WHERE id = ?", (reading.patientId,))

    conn.commit()
    conn.close()
    
    return {
        "message": "Vitals logged successfully.",
        "alert": alert_triggered
    }