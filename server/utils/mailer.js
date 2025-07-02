const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth:{
        user: "oldphonedeals.official@gmail.com",
        pass: "hpuatmbldvdggsri"
    }
});

const sendEmail = async(options) =>{
    try{
        const mailOptions = {
            from: `OldPhoneDeals`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Mail successfully sent', info.messageId);
    } catch (error) {
        console.error('Mail failed to send', error);
        throw error;
    }
};

module.exports = sendEmail;