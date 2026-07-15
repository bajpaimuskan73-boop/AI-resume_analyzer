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
