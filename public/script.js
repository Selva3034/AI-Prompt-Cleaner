const promptInput = document.getElementById("promptInput");
const promptType = document.getElementById("promptType");
const cleanBtn = document.getElementById("cleanBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const resultBox = document.getElementById("resultArea");
const charCount = document.getElementById("charCount");

// Character counter
promptInput.addEventListener("input", () => {
    charCount.textContent = `${promptInput.value.length}/2000`;
});


// Clear button
clearBtn.addEventListener("click", () => {
    promptInput.value = "";

    resultBox.innerHTML = `
        <div class="empty-state">
            <p>Your improved prompt will appear here.</p>
        </div>
    `;

    copyBtn.style.display = "none";
    charCount.textContent = "0/2000";
});


// Clean Prompt button
cleanBtn.addEventListener("click", async () => {

    const prompt = promptInput.value.trim();
    const type = promptType.value;

    // Check empty prompt
    if (!prompt) {
        alert("Please enter a prompt first.");
        return;
    }

    // Loading state
    cleanBtn.disabled = true;
    cleanBtn.textContent = "Improving...";

    resultBox.innerHTML = `
        <div class="empty-state">
            <p>AI is improving your prompt...</p>
        </div>
    `;

    copyBtn.style.display = "none";

    try {

        // Send prompt to Flask backend
        const response = await fetch(
            "/api/clean-prompt",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    prompt: prompt,
                    type: type
                })
            }
        );

        const data = await response.json();

        // Check backend response
        if (!response.ok) {
            throw new Error(
                data.error || "Something went wrong."
            );
        }

        // Show AI result
        resultBox.innerHTML = `
            <div class="result-content">
                ${escapeHtml(data.improved_prompt)}
            </div>
        `;

        // Show copy button
        copyBtn.style.display = "block";

    } catch (error) {

        console.error("Error:", error);

        resultBox.innerHTML = `
            <div class="empty-state">
                <p>Something went wrong. Please try again.</p>
            </div>
        `;

    } finally {

        // Reset button
        cleanBtn.disabled = false;
        cleanBtn.textContent = "Clean Prompt";
    }
});


// Copy button
copyBtn.addEventListener("click", async () => {

    const resultText = resultBox.innerText.trim();

    if (!resultText) {
        return;
    }

    try {

        await navigator.clipboard.writeText(resultText);

        const originalText = copyBtn.textContent;

        copyBtn.textContent = "Copied!";

        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 1500);

    } catch (error) {

        console.error("Copy failed:", error);

    }
});


// Prevent HTML from being inserted into the page
function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}