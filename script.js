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

// Services
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.read_more');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const gridItem = button.closest('.services_tab');
            const short_text = gridItem.querySelector('.short_text');
            const more_text = gridItem.querySelector('.more_text');

            if (short_text.style.display === "none") {
                short_text.style.display = "inline";
                button.textContent = "Read More";
                more_text.style.display = "none";
            } else {
                short_text.style.display = "none";
                button.textContent = "Show Less";
                more_text.style.display = "inline";
            }
        });
    });
});

// Contact
// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const port = 5500; // You can change this port if needed

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from 'public' directory

// Route to handle form submission
app.post('/send-message', (req, res) => {
  const { name, email, message } = req.body;

  // Create a transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // Replace with your email service
    auth: {
      user: 'your-email@gmail.com', // Replace with your email address
      pass: 'your-email-password'   // Replace with your email password or app-specific password
    }
  });

  // Email options
  const mailOptions = {
    from: email,
    to: 'your-email@gmail.com', // Replace with your email address
    subject: 'Contact Form Message',
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error: ' + error);
      res.send('Error occurred. Please try again.');
    } else {
      console.log('Email sent: ' + info.response);
      res.send('Message sent successfully!');
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
