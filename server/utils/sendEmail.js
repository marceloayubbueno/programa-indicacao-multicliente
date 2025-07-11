const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Criar transportador SMTP
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    // Definir opções do email
    const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    // Enviar email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail; 