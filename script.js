async function analyzeResume() {
    const file = document.getElementById("resume").files[0];

    if (!file) {
        alert("Please upload a PDF resume.");
        return;
    }

    const reader = new FileReader();

    reader.onload = async function () {
        const typedArray = new Uint8Array(reader.result);

        const pdf = await pdfjsLib.getDocument(typedArray).promise;

        let resumeText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();

            content.items.forEach(item => {
                resumeText += item.str + " ";
            });
        }

        document.getElementById("result").innerHTML = `
            <h3>Resume Text Extracted</h3>
            <textarea rows="10" cols="40">${resumeText}</textarea>
        `;

        console.log(resumeText);
    };

    reader.readAsArrayBuffer(file);
}

async function getAIAnalysis(resumeText) {

    const API_KEY = "YOUR_GEMINI_API_KEY";

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `Analyze this resume and give:
                                1. ATS Score out of 100
                                2. Skills Found
                                3. Missing Skills
                                4. Suggestions
                                Resume:
                                ${resumeText}`
                            }
                        ]
                    }
                ]
            })
        }
    );

    const data = await response.json();

    document.getElementById("result").innerHTML =
        data.candidates[0].content.parts[0].text;
}


await getAIAnalysis(resumeText);

let aiResult = "";

async function getAIAnalysis(resumeText) {

    const API_KEY = "YOUR_GEMINI_API_KEY";

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Analyze this resume:
                        Give ATS Score,
                        Skills,
                        Missing Skills,
                        Suggestions.
                        Resume:
                        ${resumeText}`
                    }]
                }]
            })
        }
    );

    const data = await response.json();

    aiResult = data.candidates[0].content.parts[0].text;

    document.getElementById("result").innerText = aiResult;
}

function downloadReport() {

    if (!aiResult) {
        alert("Analyze the resume first.");
        return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("AI Resume Analysis Report", 20, 20);

    const lines = doc.splitTextToSize(aiResult, 170);
    doc.text(lines, 20, 35);

    doc.save("Resume_Report.pdf");
}




