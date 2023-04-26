require('dotenv').config();
import nodemailer from 'nodemailer'
let sendSimpleEmail = async (dataSend) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_APP, // generated ethereal user
            pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Fred Foo 👻" <nguyencuonghd66@gmail.com>', // sender address
        to: dataSend.receiverEmail, // list of receivers
        subject: "Thông tin đặt lệnh khám bệnh", // Subject line
        html: getBodyEmail(dataSend), // html body
    });
}
let getBodyEmail = (dataSend) => {
    let result = '';
    if (dataSend.language === 'vi'){
        result = `
        <h3>Xin chào ${dataSend.patientName}!</h3>
        <p>Bạn nhận được email này vì đã đặt lịch khám bệnh online trên Bookingcare</p>
        <p>Thông tin đặt lệnh khám bệnh: </p>
        <div><b>Thời gian: ${dataSend.time}</b></div>
        <div><b>Bác sĩ: ${dataSend.doctorName}</b></div>
        <p>Nếu thông tin trên là đúng sự thật ,bạn hãy click vào đường link để xác nhận và hoàn thành thủ tục đặt lịch khám bệnh</p>
        <div><a href = ${dataSend.redirectLink}> Click here</a></div >
        <div>Xin chân thành cảm ơn bạn đã sử dụng dịch vụ BookingCare</div>
        `
    }
    if (dataSend.language === 'en'){
        result = `
        <h3>Dear ${dataSend.patientName}!</h3>
        <p>You received this email because you booked an online medical appointment on Bookingcare</p>
        <p>Information to order medical examination: </p>
        <div><b>Time: ${dataSend.time}</b></div>
        <div><b>Doctor: ${dataSend.doctorName}</b></div>
        <p>If the above information is true, please click on the link to confirm and complete the procedure to schedule an appointment.</p>
        <div><a href = ${dataSend.redirectLink}> Click here</a></div >
        <div>Thank you very much for using BookingCare service</div>
        `
    }
    return result;
}
 let getBodyEmailRemedy = (dataSend) =>{
     let result = '';
     if (dataSend.language === 'vi') {
         result = `
        <h3>Xin chào ${dataSend.patientName} !</h3>
        <p>Bạn nhận được email này vì đã đặt lịch khám bệnh online trên Bookingcare</p>
        <p>Thông tin đặt lệnh khám bệnh/ đơn thuốc được gửi trong file đính kèm </p>
        
        <div>Xin chân thành cảm ơn bạn đã sử dụng dịch vụ BookingCare</div>
        `
     }
     if (dataSend.language === 'en') {
         result = `
        <h3>Dear ${dataSend.patientName}!</h3>
        <p>You received this email because you booked an online medical appointment on Bookingcare</p>
        <p>Information to order medical examination: </p>

        <div>Thank you very much for using BookingCare service</div>
        `
     }
     return result;
}
let sendAttachment = async (dataSend) =>{
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_APP, // generated ethereal user
            pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Fred Foo 👻" <nguyencuonghd66@gmail.com>', // sender address
        to: dataSend.email, // list of receivers
        subject: "Kết quả đặt lịch khám bệnh", // Subject line
        html: getBodyEmailRemedy(dataSend), // html body
        attachments: [
            {
                filename: `remedy-${dataSend.patientId}-${new Date().getTime()}.png`,
                content: dataSend.imgBase64.split("base64,")[1],
                encoding: "base64"
            }
        ]
    });
}
// async..await is not allowed in global scope, must use a wrapper
async function main() {
}

main().catch(console.error);
module.exports = {
    sendSimpleEmail: sendSimpleEmail,
    sendAttachment: sendAttachment
}