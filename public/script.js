document.addEventListener("DOMContentLoaded", () => {

    const promptInput = document.getElementById("promptInput");
    const promptType = document.getElementById("promptType");

    const cleanBtn = document.getElementById("cleanBtn");
    const cleanBtnText = document.getElementById("cleanBtnText");

    const clearBtn = document.getElementById("clearBtn");
    const copyBtn = document.getElementById("copyBtn");

    const resultBox = document.getElementById("resultArea");
    const skeletonLoader = document.getElementById("skeletonLoader");

    const charCount = document.getElementById("charCount");

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    const navbar = document.getElementById("navbar");
    const backToTop = document.getElementById("backToTop");

    const cookieBanner = document.getElementById("cookieBanner");
    const cookieAccept = document.getElementById("cookieAccept");

    const toastContainer =
        document.getElementById("toastContainer");


    /* =========================================
       CHARACTER COUNTER
    ========================================= */

    function updateCharacterCount() {

        const length = promptInput.value.length;

        charCount.textContent = `${length} / 2000`;

        if (length >= 1800) {
            charCount.classList.add("warning");
        } else {
            charCount.classList.remove("warning");
        }
    }

    promptInput.addEventListener(
        "input",
        updateCharacterCount
    );


    /* =========================================
       TOAST NOTIFICATIONS
    ========================================= */

    function showToast(message, type = "info") {

        const toast = document.createElement("div");

        toast.className = `toast toast-${type}`;

        toast.innerHTML = `
            <span class="toast-icon">
                ${type === "success" ? "✓" : type === "error" ? "!" : "i"}
            </span>
            <span class="toast-message">
                ${escapeHtml(message)}
            </span>
        `;

        toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        setTimeout(() => {

            toast.classList.remove("show");

            setTimeout(() => {
                toast.remove();
            }, 250);

        }, 3000);
    }


    /* =========================================
       THEME
    ========================================= */

    function applyTheme(theme) {

        if (theme === "light") {

            document.documentElement.classList.add(
                "light-theme"
            );

            themeIcon.textContent = "☾";

            themeToggle.setAttribute(
                "aria-label",
                "Switch to dark mode"
            );

        } else {

            document.documentElement.classList.remove(
                "light-theme"
            );

            themeIcon.textContent = "☀";

            themeToggle.setAttribute(
                "aria-label",
                "Switch to light mode"
            );
        }
    }


    const savedTheme = localStorage.getItem(
        "promptly-theme"
    );

    applyTheme(savedTheme || "dark");


    themeToggle.addEventListener("click", () => {

        const isLight =
            document.documentElement.classList.contains(
                "light-theme"
            );

        const newTheme = isLight ? "dark" : "light";

        localStorage.setItem(
            "promptly-theme",
            newTheme
        );

        applyTheme(newTheme);

        showToast(
            `${newTheme === "light" ? "Light" : "Dark"} mode enabled`,
            "success"
        );
    });


    /* =========================================
       CLEAR PROMPT
    ========================================= */

    clearBtn.addEventListener("click", () => {

        promptInput.value = "";

        updateCharacterCount();

        resultBox.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ✦
                </div>

                <h3>
                    Your improved prompt will appear here
                </h3>

                <p>
                    Enter a rough prompt on the left and
                    let AI improve it.
                </p>

            </div>
        `;

        copyBtn.disabled = true;

        promptInput.focus();
    });


    /* =========================================
       LOADING STATE
    ========================================= */

    function setLoading(isLoading) {

        if (isLoading) {

            cleanBtn.disabled = true;

            cleanBtnText.textContent =
                "Improving...";

            resultBox.classList.add("hidden");

            skeletonLoader.classList.remove("hidden");

            copyBtn.disabled = true;

        } else {

            cleanBtn.disabled = false;

            cleanBtnText.textContent =
                "Clean Prompt";

            skeletonLoader.classList.add("hidden");

            resultBox.classList.remove("hidden");
        }
    }


    /* =========================================
       CLEAN PROMPT
    ========================================= */

    cleanBtn.addEventListener("click", cleanPrompt);


    async function cleanPrompt() {

        const prompt = promptInput.value.trim();

        const type = promptType.value;


        if (!prompt) {

            showToast(
                "Please enter a prompt first.",
                "error"
            );

            promptInput.focus();

            return;
        }


        if (prompt.length > 2000) {

            showToast(
                "Prompt cannot exceed 2000 characters.",
                "error"
            );

            return;
        }


        setLoading(true);


        try {

            const response = await fetch(
                "/api/clean-prompt",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        prompt: prompt,
                        type: type
                    })
                }
            );


            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    "Invalid response from server."
                );
            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Something went wrong."
                );
            }


            if (
                !data.improved_prompt ||
                typeof data.improved_prompt !== "string"
            ) {

                throw new Error(
                    "The AI returned an empty result."
                );
            }


            resultBox.innerHTML = `
                <div class="result-content">
                    ${escapeHtml(data.improved_prompt)}
                </div>
            `;

            copyBtn.disabled = false;

            showToast(
                "Prompt improved successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Prompt cleaning error:",
                error
            );


            resultBox.innerHTML = `
                <div class="error-state">

                    <div class="error-icon">
                        !
                    </div>

                    <h3>
                        Unable to improve prompt
                    </h3>

                    <p>
                        ${escapeHtml(
                            error.message ||
                            "Please try again."
                        )}
                    </p>

                </div>
            `;

            copyBtn.disabled = true;

            showToast(
                error.message ||
                "Something went wrong.",
                "error"
            );

        } finally {

            setLoading(false);
        }
    }


    /* =========================================
       COPY RESULT
    ========================================= */

    copyBtn.addEventListener(
        "click",
        async () => {

            const result =
                resultBox.querySelector(
                    ".result-content"
                );

            if (!result) {
                return;
            }


            const text =
                result.textContent.trim();


            if (!text) {
                return;
            }


            try {

                await navigator.clipboard.writeText(
                    text
                );

                showToast(
                    "Prompt copied to clipboard.",
                    "success"
                );

            } catch (error) {

                console.error(
                    "Copy error:",
                    error
                );

                showToast(
                    "Unable to copy prompt.",
                    "error"
                );
            }
        }
    );


    /* =========================================
       KEYBOARD SHORTCUTS
    ========================================= */

    document.addEventListener(
        "keydown",
        (event) => {

            const modifier =
                event.ctrlKey ||
                event.metaKey;


            /* Ctrl/Cmd + Enter */
            if (
                modifier &&
                event.key === "Enter"
            ) {

                event.preventDefault();

                if (!cleanBtn.disabled) {
                    cleanPrompt();
                }

                return;
            }


            /* Ctrl/Cmd + K */
            if (
                modifier &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                promptInput.focus();

                return;
            }


            /* Ctrl/Cmd + Shift + C */
            if (
                modifier &&
                event.shiftKey &&
                event.key.toLowerCase() === "c"
            ) {

                event.preventDefault();

                if (!copyBtn.disabled) {
                    copyBtn.click();
                }

                return;
            }


            /* Escape */
            if (event.key === "Escape") {

                document.activeElement?.blur();
            }

        }
    );


    /* =========================================
       STICKY NAVBAR
    ========================================= */

    function updateNavbar() {

        if (window.scrollY > 20) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    }

    window.addEventListener(
        "scroll",
        updateNavbar,
        { passive: true }
    );

    updateNavbar();


    /* =========================================
       BACK TO TOP
    ========================================= */

    function updateBackToTop() {

        if (window.scrollY > 450) {

            backToTop.classList.add("visible");

        } else {

            backToTop.classList.remove("visible");
        }
    }


    window.addEventListener(
        "scroll",
        updateBackToTop,
        { passive: true }
    );


    backToTop.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


    /* =========================================
       COOKIE BANNER
    ========================================= */

    const cookieAccepted =
        localStorage.getItem(
            "promptly-cookie-notice"
        );


    if (!cookieAccepted) {

        setTimeout(() => {

            cookieBanner.classList.remove(
                "hidden"
            );

        }, 700);
    }


    cookieAccept.addEventListener(
        "click",
        () => {

            localStorage.setItem(
                "promptly-cookie-notice",
                "accepted"
            );

            cookieBanner.classList.add(
                "hidden"
            );

        }
    );


    /* =========================================
       FAQ ACCORDION
    ========================================= */

    const faqItems =
        document.querySelectorAll(
            ".faq-item"
        );


    faqItems.forEach((item) => {

        item.addEventListener(
            "toggle",
            () => {

                if (!item.open) {
                    return;
                }


                faqItems.forEach((otherItem) => {

                    if (
                        otherItem !== item &&
                        otherItem.open
                    ) {

                        otherItem.open = false;
                    }

                });

            }
        );

    });


    /* =========================================
       HTML ESCAPE
    ========================================= */

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* Initial state */
    updateCharacterCount();
    updateBackToTop();

});