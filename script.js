function analyzeResume(){

    let file=document.getElementById("resume").files[0];

    if(!file){
        alert("Please upload a resume.");
        return;
    }

    document.getElementById("result").innerHTML=
    `
    <p>✅ Resume Uploaded Successfully</p>
    <p>AI Score: 85/100</p>
    <p>Skills Found: HTML, CSS, JavaScript</p>
    <p>Suggestions: Add more projects and certifications.</p>
    `;
}
