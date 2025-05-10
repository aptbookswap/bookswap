function scrollToBottom() {
    const chatMessages = document.getElementById("chat-messages");
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function fetchMessages() {
    fetch(window.location.pathname + "fetch/")
        .then(response => response.json())
        .then(data => {
            document.getElementById("chat-messages").innerHTML = data.html;
            scrollToBottom();
        });
}

document.getElementById("send-message-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const input = document.getElementById("contentInput");
    const content = input.value.trim();
    if (!content) return;

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(window.location.pathname, {
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrfToken
        },
        body: new URLSearchParams({ content: content })
    }).then(response => {
        if (response.ok) {
            input.value = "";
            fetchMessages();
        }
    });
});

setInterval(fetchMessages, 3000);
window.onload = scrollToBottom;
