
<div align="center">
=======
# 🚀 DataCompare AI – Smart CSV & Excel Analysis Platform

  <h1>⚡ DataCompare AI</h1>

  <p>
    <strong>Next-Gen Data Analysis & Validation Platform</strong>
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#license">License</a>
  </p>

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
  ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

</div>

<br />

## 🚀 Overview

**DataCompare AI** is a powerful, full-stack solution designed to streamline data validation and analysis. It automates the tedious process of comparing large datasets, identifying anomalies, and generating actionable insights.

Whether you're a data analyst, QA engineer, or business operator, DataCompare AI helps you **trust your data** with confidence and speed.

---

## <a name="features"></a>✨ Key Features

| Feature | Description |
| :--- | :--- |
| **📁 Multi-File Upload** | Drag & drop support for CSV and Excel files. Automatic parsing and schema detection. |
| **⚖️ Intelligent Comparison** | Row-by-row comparison to detect added, removed, and modified records with precision. |
| **🚨 Anomaly Detection** | Advanced statistical analysis to spot outliers, value spikes, and null anomalies automatically. |
| **📊 Visual Dashboard** | Interactive dashboard featuring real-time statistics, activity logs, and data health summaries. |
| **📝 Comprehensive Reports** | Generate and download detailed comparison reports (CSV/Excel) to share findings. |
| **🎨 Modern UI** | sleek, dark-mode interface designed with glassmorphism for a premium user experience. |

---

## <a name="tech-stack"></a>🛠️ Tech Stack

### Frontend
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS + Vanilla CSS (Glassmorphism)
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Routing:** React Router DOM

### Backend
- **Framework:** FastAPI (Python)
- **Data Processing:** Pandas, NumPy
- **Database:** SQLAlchemy ORM (SQLite/PostgreSQL)
- **Validation:** Pydantic
- **Security:** OAuth2 with JWT

---

## <a name="getting-started"></a>🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v16+)
- Python (v3.9+)

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Viraj-005/DataCompareAI.git
cd DataCompareAI
```

### 2️⃣ Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
*The backend API will run on `http://localhost:8000`*

### 3️⃣ Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
*The frontend application will run on `http://localhost:5173`*

---

## � License

This project is licensed under the MIT License.

---

<div align="center">

  Created with ❤️ by **Viraj Induruwa**

  [LinkedIn](https://linkedin.com/in/viraj-induruwa) | [GitHub](https://github.com/Viraj-005)

</div>
