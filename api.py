from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
import pyodbc
from groq import Groq

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# ===============================
# Groq API
# ===============================
client = Groq(api_key="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")


# ===============================
# Load YOLO Model
# ===============================
model = YOLO("runs/detect/hardware_ai2/weights/best.pt")


# ===============================
# SQL Connection
# ===============================
def get_connection():
    return pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;"
        "DATABASE=AI_Vision_DB;"
        "Trusted_Connection=yes;"
    )


# ===============================
# Pages
# ===============================
@app.route("/")
def home():
    return render_template("login.html")


@app.route("/index")
def index():
    return render_template("index.html")


@app.route("/camera")
def camera():
    return render_template("camera.html")


@app.route("/detections")
def detections():
    return render_template("detections.html")


# ===============================
# Login
# ===============================
@app.route("/login", methods=["POST"])
def login():

    data=request.json
    username=data.get("username")
    password=data.get("password")

    conn=get_connection()
    cursor=conn.cursor()

    cursor.execute("""
    SELECT Id,Username
    FROM Users
    WHERE Username=?
    AND PasswordHash=?
    AND IsActive=1
    """,(username,password))

    user=cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({
            "success":False,
            "message":"Invalid username or password"
        })

    return jsonify({
        "success":True,
        "username":user.Username
    })


# ===============================
# Detect Frame
# ===============================
@app.route("/detect_frame", methods=["POST"])
def detect_frame():

    file=request.files["image"]
    img_bytes=file.read()

    np_img=np.frombuffer(img_bytes,np.uint8)
    frame=cv2.imdecode(np_img,cv2.IMREAD_COLOR)

    results=model(frame)[0]

    detections=[]

    for box in results.boxes:

        x1,y1,x2,y2=box.xyxy[0].tolist()
        label=model.names[int(box.cls[0])]
        conf=float(box.conf[0])

        if conf>0.5:
            detections.append({
                "label":label,
                "confidence":round(conf,2),
                "box":[x1,y1,x2,y2]
            })

    return jsonify({"detections":detections})


# ===============================
# AI Chat + Save To ChatMessages
# ===============================
@app.route("/chat", methods=["POST"])
def chat():

    try:
        data=request.json
        object_name=data.get("object")
        question=data.get("question")

        prompt=f"""
You are an educational AI assistant specialized in computer hardware.

Object: {object_name}

Question: {question}

Answer clearly and simply for students.
"""

        response=client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role":"user",
                    "content":prompt
                }
            ]
        )

        answer=response.choices[0].message.content.strip()


        # حفظ الرد في ChatMessages
        conn=get_connection()
        cursor=conn.cursor()

        cursor.execute("""
        INSERT INTO ChatMessages
        (ObjectName,Role,Message)
        VALUES (?,?,?)
        """,(object_name,"assistant",answer))

        conn.commit()
        conn.close()


        return jsonify({
            "answer":answer
        })

    except Exception as e:
        print(e)

        return jsonify({
            "answer":"AI service unavailable"
        })


# ===============================
# View Detections pulls saved chat
# ===============================
@app.route("/get_answers")
def get_answers():

    conn=get_connection()
    cursor=conn.cursor()

    cursor.execute("""
    SELECT ObjectName,Message,CreatedAt
    FROM ChatMessages
    WHERE Role='assistant'
    ORDER BY Id DESC
    """)

    rows=cursor.fetchall()

    conn.close()

    data=[]

    for row in rows:
        data.append({
            "object":row.ObjectName,
            "question":"AI Generated Explanation",
            "answer":row.Message,
            "date":str(row.CreatedAt)
        })

    return jsonify(data)


# ===============================
# Run Server
# ===============================
if __name__=="__main__":
    print("✅ Server Running on http://0.0.0.0:8000")
    app.run(host="0.0.0.0",port=8000)