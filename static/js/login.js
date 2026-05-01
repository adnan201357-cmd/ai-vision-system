function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorBox = document.getElementById("error");

    if (!username || !password) {
        errorBox.innerText = "Please enter username and password";
        return;
    }

    // ✅ الرابط الصحيح بدون localhost
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("username", data.username);

           window.location.href = "/index";

        } else {
            errorBox.innerText = data.message;
        }
    })
    .catch(() => {
        errorBox.innerText = "Server error";
    });
}
