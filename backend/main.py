import ctypes
import os
import sqlite3
import platform
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from statistics import mean

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY,
            caretaker_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            risk_score INTEGER NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            caretaker_id INTEGER NOT NULL,
            patient_name TEXT NOT NULL,
            description TEXT NOT NULL,
            time TEXT NOT NULL
        )
    """)
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

class CaretakerRegister(BaseModel):
    name: str; email: str; password: str

class CaretakerLogin(BaseModel):
    email: str; password: str

class NewPatient(BaseModel):
    id: int; name: str; age: int; riskScore: int; caretakerId: int

class NewTask(BaseModel):
    patientName: str; description: str; time: str; caretakerId: int

class DailyReading(BaseModel):
    patientId: int; sysBp: int; diaBp: int; heartRate: int


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


is_windows = platform.system() == "Windows"
lib_ext = "dll" if is_windows else "so"

if is_windows:
    engine_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'cpp_engine', f'engine.{lib_ext}'))
else:
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

@app.delete("/api/patients/{patient_id}")
def delete_patient(patient_id: int):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM daily_vitals WHERE patient_id = ?", (patient_id,))
        cursor.execute("DELETE FROM alerts WHERE patient_id = ?", (patient_id,))
        cursor.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Patient not found.")
        conn.commit()
        return {"message": f"Patient {patient_id} permanently deleted."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Database error during deletion.")
    finally:
        conn.close()


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


@app.post("/api/vitals/log")
def log_daily_reading(reading: DailyReading):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO daily_vitals (patient_id, sys_bp, dia_bp, heart_rate) 
        VALUES (?, ?, ?, ?)
    """, (reading.patientId, reading.sysBp, reading.diaBp, reading.heartRate))
    
    alert_triggered = None
    
    if reading.sysBp >= 180 or reading.diaBp >= 120:
        alert_triggered = f"CRITICAL: Hypertensive Crisis ({reading.sysBp}/{reading.diaBp}). Immediate attention required!"
    elif reading.sysBp >= 140 or reading.diaBp >= 90:
        alert_triggered = f"WARNING: Stage 2 Hypertension detected ({reading.sysBp}/{reading.diaBp})."
    elif reading.sysBp < 90 or reading.diaBp < 60:
        alert_triggered = f"WARNING: Hypotension (Low BP) detected ({reading.sysBp}/{reading.diaBp})."
    elif reading.heartRate > 100:
        alert_triggered = f"WARNING: Tachycardia. High resting heart rate ({reading.heartRate} BPM)."
    elif reading.heartRate < 60:
        alert_triggered = f"WARNING: Bradycardia. Low resting heart rate ({reading.heartRate} BPM)."

    if not alert_triggered:
        cursor.execute("SELECT sys_bp FROM daily_vitals WHERE patient_id = ? ORDER BY date DESC LIMIT 4", (reading.patientId,))
        history = cursor.fetchall()
        
        if len(history) >= 4:
            past_sys_bps = [row['sys_bp'] for row in history[1:4]] 
            avg_past_sys = mean(past_sys_bps)
            
            if reading.sysBp >= (avg_past_sys * 1.10):
                alert_triggered = f"AI TREND ALERT: 10% BP Spike. Jumped from baseline ~{int(avg_past_sys)} to {reading.sysBp} mmHg."

    if alert_triggered:
        cursor.execute("INSERT INTO alerts (patient_id, alert_level, message) VALUES (?, ?, ?)",
                       (reading.patientId, "Critical" if "CRITICAL" in alert_triggered else "Warning", alert_triggered))

    conn.commit()
    conn.close()
    
    return {
        "message": f"Vitals logged ({reading.sysBp}/{reading.diaBp}, HR: {reading.heartRate}). Patient is stable.",
        "alert": alert_triggered
    }

@app.get("/api/ai/predict-risk/{patient_id}")
def predict_future_risk(patient_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT sys_bp FROM daily_vitals WHERE patient_id = ? ORDER BY id ASC", (patient_id,))
    records = cursor.fetchall()
    conn.close()

    if len(records) < 3:
        return {"error": "Not enough data. Log at least 3 daily vitals to run AI analysis."}

    y = [row['sys_bp'] for row in records]
    x = list(range(1, len(y) + 1))
    n = len(x)

    sum_x, sum_y = sum(x), sum(y)
    sum_xy = sum(x[i] * y[i] for i in range(n))
    sum_x_squared = sum(x[i] ** 2 for i in range(n))
    
    denominator = (n * sum_x_squared) - (sum_x ** 2)
    slope = 0 if denominator == 0 else ((n * sum_xy) - (sum_x * sum_y)) / denominator
    intercept = (sum_y - (slope * sum_x)) / n
    
    next_day = x[-1] + 1
    predicted_bp = (slope * next_day) + intercept
    warning = "CRITICAL: Rapid BP Spike Trajectory" if slope > 5 else "Warning: Upward BP Trend" if slope > 0 else "Stable Trajectory"
    
    return {
        "predicted_value": round(predicted_bp, 1), 
        "trajectory_slope": round(slope, 2), 
        "ai_warning": warning
    }
