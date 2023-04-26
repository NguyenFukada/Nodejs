import db from '../models/index'
require('dotenv').config();
import emaiLService from './emailService'
import {v4 as uuidv4} from 'uuid'
let buildUrEmail = (doctorId, token) =>
{
    let result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}`
    return result;
}

let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.timeType || !data.date || !data.doctorId || !data.fullName
                || !data.selectedGender || !data.address) {
                resolve({
                    errCode: 1,
                    message: 'Missing parameter in postBookAppointment'
                })
            }
            else {
                let token = uuidv4();
                await emaiLService.sendSimpleEmail({
                    receiverEmail: data.email,
                    patientName: data.fullName,
                    time: data.timeString,
                    doctorName: data.doctorName,
                    language: data.language,
                    redirectLink: buildUrEmail(data.doctorId, token)

                })
                // upsert patient
                let user = await db.User.findOrCreate({
                    where: { email: data.email },
                    defaults: {
                        email: data.email,
                        roleId: 'R3',
                        address: data.address,
                        gender: data.selectedGender,
                        firstName: data.fullName,
                    },
                    
                });

                // let user = await db.User.create({
                //     email: data.email,
                //     address: data.address,
                //     roleId: 'R3',
                // })
               
                //create booking record 
                if (user && user[0]) {
                    await db.Booking.findOrCreate({
                        where: { patientId: user[0].id },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: user[0].id,
                            date: data.date,
                            timeType: data.timeType,
                            token: token,
                            
                        }

                    })
                }
                resolve({
                    errCode: 0,
                    data: user,
                    message: 'Save infor doctor patient succeed!'
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
let postVerifyBookAppointment = (data) => {
    return new Promise(async (resolve,reject)=>{
        try {
            if (!data.token || !data.doctorId){
                resolve({
                    errCode: 1,
                    message: 'Missing parameter!'
                })
            }else{
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        token: data.token,
                        statusId : 'S1'
                    },
                    raw: false
                })
                if(appointment) {
                    appointment.statusId = "S2";
                    await appointment.save();
                    resolve({
                        errCode: 0,
                        message: "Update appointment success !"
                    })
                }else{
                    resolve({
                        errCode: 2,
                        message: "Appointment has been activated or not existed"
                    })
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}
module.exports = {
    postBookAppointment: postBookAppointment,
    postVerifyBookAppointment: postVerifyBookAppointment
}