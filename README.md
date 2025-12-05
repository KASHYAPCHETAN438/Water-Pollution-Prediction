# 🌊 Water Pollution Predict System

**AI-Based Classification System | Low • Average • High Water Quality**

---

## 📌 Overview

This project aims to classify **Tap Water** and **River Water** quality into:

> 🔹 **Low Quality**  
> 🔹 **Average Quality**  
> 🔹 **High Quality**

Two different machine learning models are trained:

| Model | Dataset Type | Used For | # Features |
|-------|--------------|----------|------------|
| 🟦 Tap Water Model | Supervised ML | Drinking water potability | 5 |
| 🟩 River Water Model | Real-world environmental data | River pollution analysis | 8 |

This project helps in:
- ✨ Public health awareness
- ✨ Real-time water monitoring
- ✨ Environmental conservation

---

## 📂 Dataset Information

### 🟦 Tap Water Dataset (Supervised Model Training)

- **Source**: Kaggle  
- 🔗 https://www.kaggle.com/datasets/uom190346a/water-quality-and-potability
- Contains validated tap water measurements
- Missing values filled using **Median Imputation**

#### Parameters Used:
| Feature | Description |
|--------|-------------|
| pH | Acidity / Alkalinity |
| Hardness | Minerals like Calcium/Magnesium |
| Chloramines | Disinfectant chemical |
| Sulfate | Mineral concentration |
| Turbidity | Water clarity |

Used for **classification model training & evaluation**.

---

### 🟩 River Water Dataset (Real-World CPCB Reports)

- **Source**: CPCB — National Water Monitoring Program (India)
- 🔗 https://cpcb.nic.in/nwmp-data/
- Available **only in PDF format**
- Extracted **last 8 years** dataset using:
  - `pdfplumber`
  - Manual corrections + cleaning
- Converted to **CSV format**

#### Parameters Used:
| Feature | Purpose |
|--------|---------|
| Temperature | Affects aquatic life health |
| Dissolved Oxygen | Key indicator of water purity |
| pH | Water acidity level |
| Conductivity | Presence of ions / chemicals |
| BOD (mg/L) | Biodegradable organic waste |
| Nitrate-N | Fertilizer pollutants |
| Fecal Coliform | Indicates pathogen risk |
| Total Coliform | Microbial contamination |

Used for:
- 🌍 Pollution analytics
- 📉 Trend forecasting
- 🔬 Real-world model validation

---

## 🤖 Machine Learning Workflow

| Step | Description |
|------|-------------|
| 1️⃣ | Load dataset(s) |
| 2️⃣ | Numeric conversion + Missing value handling |
| 3️⃣ | Create label category (Low / Average / High) using thresholds |
| 4️⃣ | Train/Test split with stratified sampling |
| 5️⃣ | ML Pipeline → Imputation → Scaling → RandomForest |
| 6️⃣ | Hyperparameter Tuning using GridSearchCV |
| 7️⃣ | Evaluation via multiple metrics |
| 8️⃣ | Save trained models (`tap_water.pkl` + `river_water.pkl`) |

---

## 📊 Model Evaluation & Insights

Both models include:

✔ Accuracy Score  
✔ Precision / Recall / F1-Score  
✔ Confusion Matrix Plot  
✔ ROC-AUC Curve (Multi-Class)  
✔ Feature Importance Graph  
✔ Cross-Validation Performance Graph  

These insights ensure the model is **reliable** & **accurate** for real usage.

---

## 🛠 Tools & Technologies

| Area | Tools |
|------|------|
| Language | Python |
| ML Libraries | Scikit-Learn, Pandas, NumPy |
| Visualization | Matplotlib, Seaborn |
| Data Extraction | pdfplumber |
| Backend (optional) | Flask / FastAPI / Spring Boot |
| Frontend (optional) | React / Streamlit UI |

---

## 🎯 Key Outcomes

- 💧 Automated Potability check for tap water
- 🌍 River water pollution detection from government data
- 🚦 Simple traffic-light style water status for normal users
- 🧪 Tested with real-world datasets
- 🇮🇳 Built for Indian environmental monitoring needs

---

## 🔮 Future Scope

| Feature | Impact |
|--------|--------|
| IoT Sensor Live Monitoring | Real-time water status |
| Google Maps Pollution Heatmap | Region-wise alerting |
| More CPCB datasets | Broader national coverage |
| Mobile App + Voice Support | User-friendly accessibility |
| Explainability via SHAP | Scientific transparency |

---

## 👨‍💻 Team Information

**Team Binary Builders**    
Water Prediction System 🌱🌊

---

## 📜 License

This project is for **research and educational purposes only**.  
Verify data before making public health decisions.

---

## ⭐ Support

If you find this project helpful —  
👉 Don’t forget to **star⭐ the repository** and contribute!

---
