let chatUID = null;

function abrirChatModal(uid, nombre) {
    chatUID = uid;
    document.getElementById("chatUsername").textContent = nombre;

    const modal = new bootstrap.Modal(document.getElementById('chatModal'));
    modal.show();

    fetchMessages();
}

function scrollToBottom() {
    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function fetchMessages() {
    if (!chatUID) return;

    fetch(`/chat/${chatUID}/fetch/`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("chat-messages").innerHTML = data.html;
            scrollToBottom();
        });
}

document.getElementById("send-message-form")?.addEventListener("submit", function (e) {
    e.preventDefault();

    const input = document.getElementById("contentInput");
    const content = input.value.trim();
    if (!content || !chatUID) return;

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(`/chat/${chatUID}/`, {
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
