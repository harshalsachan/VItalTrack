# 🏥 Auracare: AI-Powered Patient Monitoring System

VitalTrack is a full-stack, high-performance patient monitoring application. It bridges a modern React frontend with a Python (FastAPI) backend, which interfaces directly with a custom-built, 64-bit C++ Data Structures engine via memory pointers (`ctypes`). 

This architecture allows for lightning-fast patient lookups, real-time risk sorting, and AI-driven predictive health modeling.

---

## 🏗️ System Architecture & Tech Stack

* **Frontend:** React.js, Tailwind CSS, Vite, React Router, Context API (State Management)
* **Backend:** Python, FastAPI, SQLite (Persistent Data Hydration)
* **Core Engine:** C++ (Compiled to a 64-bit Shared Library `.dll`)
* **Bridge:** Python `ctypes` for direct C++ memory manipulation

## 🧠 Core Data Structures (C++ Engine)

This project bypasses standard libraries to implement raw, memory-managed data structures in C++ for maximum performance:

1. **Hash Map (O(1) Lookups):** * Stores patient profiles.
   * Uses a custom modulo hashing algorithm with Linked-List collision chaining.
   * Allows the Python backend to retrieve patient names and vitals in constant time.
2. **Binary Search Tree (High-Risk Sorting):** * Automatically sorts patients based on their critical risk score.
   * A Reverse In-Order Traversal (Right -> Root -> Left) is used to instantly pull the highest-risk patients for the dashboard alerts.
3. **FIFO Queue (Task Management):** * Manages the "Waiting Room" medical tasks.
   * Implements strict First-In, First-Out logic for enqueuing new tasks and dequeuing completed ones.

## 🤖 AI Predictive Module

Features a custom, dependency-free **Linear Regression Algorithm** written purely in Python. 
* Analyzes a patient's historical mobility data.
* Calculates the mathematical trajectory slope ($m$).
* Predicts future risk scores and automatically flags patients with a "CRITICAL" warning if rapid mobility decline is detected.

---

## 🚀 Installation & Setup Guide

### Prerequisites
* **Node.js** (v18+ recommended)
* **Python** (v3.8+, 64-bit)
* **G++ Compiler** (MinGW-w64 for Windows)

### Step 1: Compile the C++ Engine
The C++ core must be compiled into a 64-bit Shared Library so Python can read its memory.
1. Open a terminal and navigate to the `cpp_engine` folder.
2. Run the following compilation command:
   ```bash
   g++ -m64 -shared -o engine.dll core_engine.cpp
