async function loadDetections() {
    // لاحقًا سنربطها بباك إند Python API
    // الآن عرض تجريبي

    const data = [
        { object: "person", description: "A human being with thoughts and emotions." },
        { object: "cup", description: "A container used for drinking liquids." },
        { object: "scissors", description: "A tool used for cutting materials." }
    ];

    const container = document.getElementById("detections-list");
    container.innerHTML = "";

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <h3>${item.object}</h3>
            <p>${item.description}</p>
        `;
        container.appendChild(card);
    });
}

loadDetections();
