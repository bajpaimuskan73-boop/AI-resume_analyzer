// ==========================
// Global Variables
// ==========================

let resumeText = "";
let aiResult = "";

// ==========================
// Analyze Resume
// ==========================

async function analyzeResume() {

    const file = document.getElementById("resume").files[0];

    if (!file) {
        alert("Please upload a PDF Resume");
        return;
    }

    resumeText = await extractPDFText(file);

    const ats = calculateATS(resumeText);

    updateDashboard(ats);

    // Part 2 me ye function add hoga
    // await getAIAnalysis(resumeText, ats);

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

    const jd = document
        .getElementById("jobDescription")
        .value
        .toLowerCase();

    if (jd == "") {

        alert("Paste Job Description");

        return;

    }

    const words = [

        ...new Set(

            jd.match(/\b[a-z]+\b/g)

        )

    ];

    let matched = [];

    words.forEach(word => {

        if (resumeText.toLowerCase().includes(word)) {

            matched.push(word);

        }

    });

    const score = Math.round(

        matched.length /
        words.length *
        100

    );

    document.getElementById("matchResult").innerHTML =

        `
        <h2>Match Score : ${score}%</h2>

        <h3>Matched Skills</h3>

        <p>${matched.join(", ")}</p>
        `;

}

// ======================================
// Gemini AI Analysis
// ======================================

async function getAIAnalysis(resumeText, ats) {

    const API_KEY = "YOUR_GEMINI_API_KEY";

    const prompt = `
You are an expert ATS Resume Reviewer.

Analyze this resume.

Resume:
${resumeText}

ATS Score:
${ats.score}

Skills Found:
${ats.found.join(", ")}

Missing Skills:
${ats.missing.join(", ")}

Return your response in this format:

# Resume Analysis

ATS Score:
Overall Feedback:
Strengths:
Weaknesses:
Missing Skills:
Project Suggestions:
Interview Tips:
Final Rating:
`;

    try {

        document.getElementById("result").innerHTML =
        "<h2>Analyzing Resume...</h2>";

        const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                contents:[
                    {

                        parts:[
                            {

                                text:prompt

                            }
                        ]

                    }
                ]

            })

        });

        const data = await response.json();

        aiResult =
        data.candidates[0].content.parts[0].text;

        document.getElementById("result").innerHTML =

        `
        <div class="history-card">

        <h2>AI Resume Analysis</h2>

        <pre>${aiResult}</pre>

        </div>
        `;

        // Firebase save (Part 3)
        // await saveAnalysis(resumeText, aiResult);

    }

    catch(error){

        console.log(error);

        document.getElementById("result").innerHTML=

        `
        <h2 style="color:red;">
        Error while contacting Gemini API
        </h2>
        `;

    }

}

// ======================================
// Analyze Resume Updated
// ======================================

async function analyzeResume(){

    const file=document.getElementById("resume").files[0];

    if(!file){

        alert("Please Upload Resume");

        return;

    }

    resumeText=await extractPDFText(file);

    const ats=calculateATS(resumeText);

    updateDashboard(ats);

    await getAIAnalysis(resumeText,ats);

}
