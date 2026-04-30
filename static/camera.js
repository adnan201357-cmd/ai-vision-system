const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

let detections = [];
let frozen = false;
let currentObject = "";

let currentFacingMode = "environment"; // الخلفية افتراضي
let currentStream = null;

// ✅ تشغيل الكاميرا حسب الوضع
async function startCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode }
        });

        video.srcObject = currentStream;
        video.play();

// ✅ إذا كانت الكاميرا أمامية اجعلها مرآة
if (currentFacingMode === "user") {
    video.style.transform = "scaleX(-1)";
} else {
    video.style.transform = "scaleX(1)";
}



        console.log("✅ Camera Started:", currentFacingMode);

    } catch (err) {
        console.error("❌ Camera Error:", err);
        alert("Camera not working: " + err.message);
    }
}

// ✅ زر تبديل الكاميرا
function switchCamera() {
    currentFacingMode =
        currentFacingMode === "environment" ? "user" : "environment";

    startCamera();
}

// تشغيل أول مرة
startCamera();

// ضبط المقاسات
video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
};


// ====== LIVE DETECTION ======
async function liveDetect() {
    if (frozen) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCanvas.getContext("2d").drawImage(video, 0, 0);

    tempCanvas.toBlob(async blob => {

        const form = new FormData();
        form.append("image", blob);

        try {
            // ✅ الرابط الصحيح بدون IP ثابت
            const res = await fetch("/detect_frame", {
                method: "POST",
                body: form
            });

            const data = await res.json();
            detections = data.detections;
            drawBoxes();

        } catch (err) {
            console.log("❌ Detection Error:", err);
        }

    }, "image/jpeg", 0.7);
}

function drawBoxes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ✅ نقلب الرسم فقط في الكاميرا الأمامية
    const mirror = (currentFacingMode === "user");

    ctx.save();

    if (mirror) {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
    }

    detections.forEach(d => {
        const [x1, y1, x2, y2] = d.box;

        // رسم المربع
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        // ✅ الآن نكتب النص بدون انعكاس
        ctx.save();

        if (mirror) {
            // نرجع النص طبيعي
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
        }

        ctx.fillStyle = "#00ff00";
        ctx.font = "16px Arial";

        // مكان النص الصحيح
        let textX = mirror ? (canvas.width - x2 + 5) : (x1 + 5);

        ctx.fillText(d.label, textX, y1 - 5);

        ctx.restore();
    });

    ctx.restore();
}



// ====== CLICK ON BOX ======
canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    detections.forEach(d => {
        const [x1, y1, x2, y2] = d.box;

        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
            openChat(d.label);
        }
    });
});

// ====== AI CHAT ======
async function askAI(objectName, question) {
    try {
        // ✅ الرابط الصحيح بدون IP ثابت
        const res = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ object: objectName, question })
        });

        return await res.json();

    } catch (err) {
        return { answer: "⚠️ AI Server not responding." };
    }
}

async function openChat(label) {
    currentObject = label;

    document.getElementById("objectTitle").innerText = label;
    document.getElementById("chatArea").innerHTML =
        `<div><b>AI:</b> Explaining ${label}...</div>`;

    document.getElementById("infoBox").classList.remove("hidden");

    const data = await askAI(label, `Explain what a ${label} is.`);
    document.getElementById("chatArea").innerHTML +=
        `<div><b>AI:</b> ${data.answer}</div>`;
}

async function sendQuestion() {
    const input = document.getElementById("userQuestion");
    const question = input.value.trim();
    if (!question) return;

    document.getElementById("chatArea").innerHTML +=
        `<div><b>You:</b> ${question}</div>`;

    input.value = "";

    const data = await askAI(currentObject, question);

    document.getElementById("chatArea").innerHTML +=
        `<div><b>AI:</b> ${data.answer}</div>`;

    document.getElementById("chatArea").scrollTop =
        document.getElementById("chatArea").scrollHeight;
}

// ====== CONTROLS ======
function capture() {
    frozen = true;
}

function resume() {
    frozen = false;
}

setInterval(liveDetect, 1000);

