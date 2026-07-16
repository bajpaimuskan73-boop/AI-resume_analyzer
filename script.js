// ==========================
// Global Variables
// ==========================

let resumeText = "";
let aiResult = "";
let isAnalyzing = false;

// API Key Configuration
let API_KEY = localStorage.getItem("geminiApiKey") || "";

// Validation Functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showLoading(elementId, show = true) {
    const element = document.getElementById(elementId);
    if (show) {
        element.innerHTML = '<div class="loading"><p>⏳ Processing... Please wait</p></div>';
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="error-message"><p>❌ ${message}</p></div>`;
}

// Save Gemini API Key
function saveApiKey() {
    const key = document.getElementById("geminiApiKey").value.trim();
    if (!key) {
        alert("❌ Please enter a valid API key");
        return;
    }
    localStorage.setItem("geminiApiKey", key);
    API_KEY = key;
    alert("✅ API Key saved successfully!");
    document.getElementById("apiKeyStatus").textContent = "✅ API Key configured";
}

// Load API Key on page load
window.addEventListener("DOMContentLoaded", () => {
    if (API_KEY) {
        document.getElementById("apiKeyStatus").textContent = "✅ AI Features Enabled!";
    } else {
        document.getElementById("apiKeyStatus").textContent = "✅ Basic Analysis Works Without API Key! Optionally add your free Gemini API key for AI-powered detailed feedback";
    }
});

// Modal management
window.openApiModal = function() {
    const m = document.getElementById('apiModal');
    if (!m) return;
    m.style.display = 'flex';
    m.setAttribute('aria-hidden', 'false');
};

window.closeApiModal = function() {
    const m = document.getElementById('apiModal');
    if (!m) return;
    m.style.display = 'none';
    m.setAttribute('aria-hidden', 'true');
};

window.saveApiKeyFromModal = function() {
    const key = document.getElementById('modalApiKey').value.trim();
    if (!key) {
        alert('❌ Please paste a valid API key');
        return;
    }
    localStorage.setItem('geminiApiKey', key);
    API_KEY = key;
    document.getElementById('apiKeyStatus').textContent = '✅ AI Features Enabled!';
    closeApiModal();
    alert('✅ API Key saved and AI enabled');
};

// ==========================
// Analyze Resume
// ==========================

async function analyzeResume() {
    const file = document.getElementById("resume").files[0];

    if (!file) {
        alert("❌ Please upload a PDF Resume");
        return;
    }

    if (file.type !== "application/pdf") {
        alert("❌ Please upload a valid PDF file");
        return;
    }

    try {
        showLoading("aiResult");
        resumeText = await extractPDFText(file);
        
        if (!resumeText || resumeText.trim().length === 0) {
            showError("aiResult", "Could not extract text from PDF. Please try another file.");
            return;
        }

        const ats = calculateATS(resumeText);
        updateDashboard(ats);
        
        // Call AI Analysis
        await getAIAnalysis(resumeText, ats);
    } catch (error) {
        showError("aiResult", `Failed to analyze resume: ${error.message}`);
        console.error(error);
    }
}

// ==========================
// PDF Extract
// ==========================

async function extractPDFText(file) {

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {

        const page = await pdf.getPage(i);

        const content = await page.getTextContent();

        content.items.forEach(item => {

            text += item.str + " ";

        });

    }

    return text;

}

// ==========================
// ATS Calculator
// ==========================

function calculateATS(text) {

    const keywords = [

        "html",
        "css",
        "javascript",
        "react",
        "node",
        "express",
        "mongodb",
        "firebase",
        "sql",
        "python",
        "java",
        "c++",
        "api",
        "git",
        "github"

    ];

    let found = [];

    text = text.toLowerCase();

    keywords.forEach(skill => {

        if (text.includes(skill)) {

            found.push(skill);

        }

    });

    let missing = keywords.filter(

        skill => !found.includes(skill)

    );

    let score = Math.round(

        (found.length / keywords.length) * 100

    );

    return {

        score,
        found,
        missing

    };

}

// ==========================
// Dashboard
// ==========================

function updateDashboard(data) {

    document.getElementById("atsScore").innerText =
        data.score;

    document.getElementById("skillsList").innerHTML =
        data.found
            .map(skill => `<li>${skill}</li>`)
            .join("");

    document.getElementById("missingList").innerHTML =
        data.missing
            .map(skill => `<li>${skill}</li>`)
            .join("");

    let suggestions = [];

    if (data.score < 50) {

        suggestions.push("Add technical skills");
        suggestions.push("Add projects");
        suggestions.push("Add certifications");

    }

    else if (data.score < 80) {

        suggestions.push("Improve project descriptions");
        suggestions.push("Add achievements");
        suggestions.push("Add internship experience");

    }

    else {

        suggestions.push("Excellent Resume");
        suggestions.push("Ready for ATS");

    }

    document.getElementById("suggestionList").innerHTML =
        suggestions
            .map(item => `<li>${item}</li>`)
            .join("");

}

// ==========================
// Resume vs Job Description
// ==========================

function compareResume() {
    if (!resumeText || resumeText.trim().length === 0) {
        alert("❌ Please analyze a resume first");
        return;
    }

    const jd = document.getElementById("jobDescription").value.toLowerCase().trim();

    if (jd === "") {
        alert("❌ Please paste a job description");
        return;
    }

    try {
        const words = [...new Set(jd.match(/\b[a-z]+\b/g))].filter(w => w.length > 3);
        
        if (words.length === 0) {
            alert("❌ Job description is too short. Please paste more details.");
            return;
        }

        let matched = [];
        words.forEach(word => {
            if (resumeText.toLowerCase().includes(word)) {
                matched.push(word);
            }
        });

        const score = words.length > 0 ? Math.round((matched.length / words.length) * 100) : 0;

        const matchColor = score >= 80 ? "#00c853" : score >= 50 ? "#ffa500" : "#d32f2f";

        document.getElementById("matchResult").innerHTML = `
            <div class="match-result" style="border-left-color: ${matchColor};">
                <h2>Match Score: <span style="color: ${matchColor}; font-weight: bold;">${score}%</span></h2>
                <h3>✅ Matched Skills (${matched.length}/${words.length})</h3>
                <p>${matched.join(", ") || "No keywords matched"}</p>
                ${score < 50 ? '<p style="color: #d32f2f; font-weight: 600;">⚠️ Consider adding missing keywords to your resume</p>' : ''}
            </div>
        `;
    } catch (error) {
        showError("matchResult", `Error comparing resume: ${error.message}`);
    }
}

// ======================================
// Gemini AI Analysis
// ======================================

async function getAIAnalysis(resumeText, ats) {
    if (!API_KEY) {
        alert("⚠️ Please configure your Gemini API key first!");
        generateDefaultAnalysis(ats);
        return;
    }

    isAnalyzing = true;
    showLoading("aiResult");

    const prompt = `Analyze this resume and provide detailed feedback:

Resume Content:
${resumeText}

ATS Score: ${ats.score}%
Skills Found: ${ats.found.join(", ")}
Missing Skills: ${ats.missing.join(", ")}

Please provide a comprehensive analysis including:
1. Overall Assessment
2. Strengths
3. Weaknesses
4. Top 5 Skills to Add
5. Resume Format Suggestions
6. Interview Preparation Tips
7. Action Items Priority List

Format your response in an easy-to-read way with clear sections.`;

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: prompt,
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
        },
    };

    const endpoints = [
        `https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-flash:generateText?key=${API_KEY}`,
        `https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-mini:generateText?key=${API_KEY}`,
        `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${API_KEY}`
    ];

    let data = null;
    let lastError = null;

    try {
        for (const url of endpoints) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    let message = `API request failed (${response.status})`;
                    const contentType = response.headers.get("Content-Type") || "";
                    if (contentType.includes("application/json")) {
                        const errorBody = await response.json();
                        message = errorBody.error?.message || message;
                    }
                    throw new Error(message);
                }

                const responseJson = await response.json();
                if (!responseJson.candidates || responseJson.candidates.length === 0) {
                    throw new Error("No response from AI endpoint");
                }

                data = responseJson;
                break;
            } catch (error) {
                lastError = error;
                console.warn(`GenAI endpoint failed: ${url}`, error);
            }
        }

        if (!data) {
            throw lastError || new Error("All AI endpoints failed");
        }

        const aiText = data.candidates?.[0]?.content?.[0]?.text || data.outputText || "";
        if (!aiText) {
            throw new Error("AI returned no text response");
        }

        aiResult = aiText;

        document.getElementById("aiResult").innerHTML = `
            <div class="ai-analysis">
                <div class="ai-header">
                    <h3>🤖 AI-Powered Resume Analysis</h3>
                    <p class="ai-timestamp">Generated: ${new Date().toLocaleString()}</p>
                </div>
                <div class="ai-content">
                    ${aiResult.replace(/\n/g, "<br>")}
                </div>
            </div>
        `;

        // Save to Firebase if logged in
        if (typeof saveAnalysis === "function") {
            try {
                await saveAnalysis(resumeText, aiResult);
            } catch (error) {
                console.warn("Could not save to Firebase:", error);
            }
        }
    } catch (error) {
        console.error("AI Analysis Error:", error);
        showError(
            "aiResult",
            `Failed to get AI analysis: ${error.message}`
        );
        generateDefaultAnalysis(ats);
    } finally {
        isAnalyzing = false;
    }
}

function generateDefaultAnalysis(ats) {
    const scoreColor = ats.score >= 80 ? '#10b981' : ats.score >= 50 ? '#f59e0b' : '#ef4444';
    let feedback = `
    <div class="ai-analysis">
        <div style="padding:16px; border-radius:10px; border-left:4px solid ${scoreColor}; background: #fff;">
            <h3 style="margin-top:0; color:${scoreColor};">📊 Basic Analysis (Demo Mode)</h3>
            <p><strong>ATS Score:</strong> <span style="font-weight:700;">${ats.score}%</span></p>
            <p><strong>Skills Found:</strong> ${ats.found.join(', ') || 'None detected'}</p>
            <p><strong>Missing Skills:</strong> ${ats.missing.join(', ')}</p>
            ${ats.score < 60 ? '<div style="margin-top:10px; padding:10px; background:#fff3cd; border:1px solid #ffe8a1; border-radius:6px;">⚠️ Your resume can be improved. Enable AI Features for personalized suggestions!</div>' : ''}
        </div>
        <div style="margin-top:14px; display:flex; gap:10px; align-items:center;">
            <button onclick="openApiModal()" style="background: linear-gradient(90deg,#10b981,#059669); color:#fff; padding:10px 14px; border-radius:8px; border:none;">🔓 Enable AI Features (Free)</button>
            <button onclick="downloadReport()" style="padding:10px 14px; border-radius:8px; border:1px solid #ddd; background:#fff;">📥 Download Basic Report</button>
        </div>
    </div>
    `;

    aiResult = feedback;
    document.getElementById('aiResult').innerHTML = feedback;
}

async function downloadReport() {
    try {
        if (!document.getElementById("atsScore").innerText || document.getElementById("atsScore").innerText === "0") {
            alert("❌ Please analyze a resume first before downloading the report");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.setTextColor(37, 117, 252);
        doc.text("AI Resume Analysis Report", 20, 20);

        // Metadata
        doc.setFontSize(10);
        doc.setTextColor(68, 68, 68);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 28);

        // ATS Score
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("ATS Score", 20, 40);
        doc.setFontSize(24);
        doc.setTextColor(106, 17, 203);
        doc.text(document.getElementById("atsScore").innerText + "%", 20, 50);

        // Skills Found
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        let y = 65;
        doc.text("Skills Found:", 20, y);
        y += 8;

        document.querySelectorAll("#skillsList li").forEach((skill, index) => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(11);
            doc.text(`• ${skill.innerText}`, 25, y);
            y += 7;
        });

        // Missing Skills
        y += 5;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(12);
        doc.text("Missing Skills:", 20, y);
        y += 8;

        document.querySelectorAll("#missingList li").forEach((skill) => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(11);
            doc.text(`• ${skill.innerText}`, 25, y);
            y += 7;
        });

        // Suggestions
        y += 5;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(12);
        doc.text("Suggestions:", 20, y);
        y += 8;

        document.querySelectorAll("#suggestionList li").forEach((item) => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(11);
            doc.text(`• ${item.innerText}`, 25, y);
            y += 7;
        });

        // Save PDF
        doc.save(`Resume_Analysis_${new Date().getTime()}.pdf`);
        alert("✅ Report downloaded successfully!");
    } catch (error) {
        alert(`❌ Error downloading report: ${error.message}`);
        console.error(error);
    }
}
