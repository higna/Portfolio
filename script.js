// About Me 
var tablinks = document.getElementsByClassName("tab-links");
var tabcontents = document.getElementsByClassName("tab-contents");

function opentab(tabname) {
    for (tablink of tablinks) {
        tablink.classList.remove("active-link");
    }
    for (tabcontent of tabcontents) {
        tabcontent.classList.remove("active-tab");
    }
    event.currentTarget.classList.add("active-link");
    document.getElementById(tabname).classList.add("active-tab");
}

// Download CV
function downloadCV() {
    const fileId = '1jViCz9sZAzlyKQwsR5Q97Q6ayfeBBo412dM6qz4-Ank';
    const fileUrl = `https://docs.google.com/document/d/${fileId}/export?format=pdf`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'CV.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}