let conversationHistory = [];

function escapeHtml(unsafe) {
      return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

function sanitizeUserInput(input) {
      return input
            .replace(/\r\n|\n|\r/g, "\\n")
            .replace(/\\/g, "\\\\")
            .replace(/,/g, "\\,")
            .replace(/:/g, "\\:")
            .replace(/\{/g, "\\{")
            .replace(/\}/g, "\\}")
            .replace(/\[/g, "\\[")
            .replace(/\]/g, "\\]");
}

function sanitizeInput(input) {
      return encodeURIComponent(input);
}

function handleFormSubmit(event) {
      event.preventDefault();
      const inputText = document.getElementById("input-text").value;
      conversationHistory.push({
            role: "user",
            content: inputText,
      });

      const formattedInputText = inputText.replace(/\n/g, "<br>");

      const userMessageElement = document.createElement("div");
      userMessageElement.className = "response user-response";
      userMessageElement.innerHTML = `Q: ${formattedInputText}`;
      document
            .getElementById("response-container")
            .appendChild(userMessageElement);

      document.getElementById("input-text").value = "";

      fetch("/api/chatgpt", {
                  method: "POST",
                  headers: {
                        "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                        messages: conversationHistory,
                  }),
            })
            .then((response) => {
                  if (!response.ok) {
                        throw new Error("The development server is not responding. It may be overloaded. Please try again in 10 seconds.");
                  }
                  return response.json();
            })
            .then((data) => {
                  const genieResponseElement = document.createElement("div");
                  genieResponseElement.className = "response genie-response";

                  const escapedOutput = escapeHtml(data.output);
                  const formattedOutput = escapedOutput.replace(/\n/g, "<br>");

                  const codeBlockRegex = /```([\s\S]*?)```/g;
                  const formattedOutputWithCodeBlocks = formattedOutput.replace(
                        codeBlockRegex,
                        (match, p1) => {
                              return `<div class="code-block-container"><pre class="code-block"><code>${p1}</code></pre><button class="copy-code-button" onclick="copyCodeToClipboard(this)"><i class="fas fa-clipboard"></i></button></div>`;
                        }
                  );

                  genieResponseElement.innerHTML = `A: ${formattedOutputWithCodeBlocks}`;

                  document
                        .getElementById("response-container")
                        .appendChild(genieResponseElement);

                  conversationHistory.push({
                        role: "assistant",
                        content: data.output,
                  });

                  document.getElementById("response-container").scrollTop =
                        document.getElementById("response-container").scrollHeight;
            })
            .catch((error) => {
                  console.error(error);
                  const genieResponseElement = document.createElement("div");
                  genieResponseElement.className = "response genie-response error-response";
                  genieResponseElement.innerHTML = `A: ${error.message}`;
                  document
                        .getElementById("response-container")
                        .appendChild(genieResponseElement);
            });
}

function copyCodeToClipboard(button) {
      const codeBlock = button.previousElementSibling.querySelector("code");
      const range = document.createRange();
      range.selectNode(codeBlock);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand("copy");
      window.getSelection().removeAllRanges();
      button.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
            button.innerHTML = '<i class="fas fa-clipboard"></i>';
      }, 2000);
}

function changeModel() {
      const modelSelect = document.getElementById("model-select");
      const selectedModel =
            modelSelect.options[modelSelect.selectedIndex].value;

      fetch("/api/set_model", {
                  method: "POST",
                  headers: {
                        "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                        model: selectedModel
                  }),
            })
            .then((response) => response.json())
            .then(() => {
                  const responseContainer =
                        document.getElementById("response-container");
                  responseContainer.innerHTML = "";
                  conversationHistory = [];
            });
}

function handleKeyPress(e) {
  if (e.keyCode === 13 && !e.shiftKey) {  // 13 is the keycode for Enter
    e.preventDefault();  // Prevents the default action (newline)
    handleFormSubmit(e);  // Calls your form submit function
  }
}

function clearConversation() {
      document.getElementById("response-container").innerHTML = "";
      conversationHistory = [];
}

document.addEventListener("DOMContentLoaded", function () {
    loadRules();

    const inputText = document.getElementById('input-text');
    inputText.addEventListener('input', autoResize);

    function autoResize() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    }
});

function loadRules() {
    fetch("/api/get_rules", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        conversationHistory.push({
            role: "rules",
            content: data.rules,
        });
    });
}