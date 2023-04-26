import db from '../models/index'
require('dotenv').config();
import _, { reject } from 'lodash';
const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;
import emailService from '../services/emailService'

let getTopDoctorHome = (limitInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = await db.User.findAll({
                limit: limitInput,
                where: { roleId : 'R2'},
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['password']
                },
                include: [
                    { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] }
                ],
                raw: true,
                nest: true
            })

            resolve({
                errCode: 0,
                data: users
            })
        } catch (e) {
            reject(e);
        }
    })
}
let checkRequiredFields = (inputData)=>{
    let arr = ['doctorId', 'contentHTML', 'contentMarkDown', 'action', 'selectedPrice', 'selectedPayment', 'selectedProvince', 'nameClinic'
        , 'addressClinic', 'note', 'specialtyId']
    
    let isValid = true;
    let element = '';
    for (let i = 0; i < arr.length; i++){
        if (!inputData[arr[i]]){
            isValid = false;
            element = arr[i]
            break;
        }
    }
    return {
        isValid: isValid,
        element: element
    }
}
let getAllDoctors = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let doctors = await db.User.findAll({
                where: { roleId: 'R2' },
                attributes: {
                    exclude: ['password', 'image']
                },
            })
            resolve({
                errCode: 0,
                data: doctors
            })
        } catch (e) {
            reject(e);
        }
    })
}
let saveDetailInfoDoctor = (inputData) => {
    return new Promise(async (resolve, reject) => {
        try {
            let checkObject = checkRequiredFields(inputData);
            if (checkObject.isValid === false)
            {
                resolve({
                    errCode: 1,
                    message: 'missing parameter',
                })
            } else {
                //upsert to MarkDown
                if(inputData.action === 'CREATE'){
                    await db.MarkDown.create({
                        contentHTML: inputData.contentHTML,
                        contentMarkDown: inputData.contentMarkDown,
                        description: inputData.description,
                        doctorId: inputData.doctorId
                    })
                } else if (inputData.action === 'EDIT') {
                    let doctorMarkDown = await db.MarkDown.findOne({
                        where: {doctorId: inputData.doctorId},
                        raw: false
                    })
                    if(doctorMarkDown)
                    {
                        doctorMarkDown.contentHTML = inputData.contentHTML,
                        doctorMarkDown.contentMarkDown = inputData.contentMarkDown,
                        doctorMarkDown.description = inputData.description,
                        doctorMarkDown.doctorId = inputData.doctorId,
                        await doctorMarkDown.save();
                    }
                }
                // upsert to Doctor_infor_table
                let doctorInfor = await db.Doctor_Infor.findOne({
                    where: {doctorId: inputData.doctorId
                    },
                    raw: false
                })
                if (doctorInfor){
                    //update
                    doctorInfor.doctorId = inputData.doctorId;
                    doctorInfor.priceId = inputData.selectedPrice;
                    doctorInfor.provinceId = inputData.selectedProvince;
                    doctorInfor.paymentId = inputData.selectedPayment;

                    doctorInfor.addressClinic = inputData.addressClinic;
                    doctorInfor.nameClinic = inputData.nameClinic;
                    doctorInfor.note = inputData.note;
                    doctorInfor.specialtyId = inputData.specialtyId;
                    doctorInfor.clinicId = inputData.clinicId;
                    await doctorInfor.save();
                }else{
                    await db.Doctor_Infor.create({
                        doctorId : inputData.doctorId,
                        priceId:inputData.selectedPrice,
                        provinceI: inputData.selectedProvince,
                        paymentId:inputData.selectedPayment,
                        addressClini: inputData.addressClinic,
                        nameClini: inputData.nameClinic,
                        note: inputData.note,
                        specialtyId: inputData.specialtyId,
                        clinicId: inputData.clinicId
                    })
                }
            }
            resolve({
                errCode: 0,
                message: 'Save info doctor succeed!'
            })
        } catch (e) {
            reject(e);
        }
    })
}
let getDetailDoctorById = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    message: "missing required parameter"
                })
            } else {
                let data = await db.User.findOne({
                    where: {
                        id: inputId
                    },
                    attributes: {
                        exclude: ['password']
                    },
                    include: [
                        {
                            model: db.MarkDown,
                            attributes: ['description', 'contentHTML', 'contentMarkDown'],
                        },
                        
                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                        {
                            model: db.Doctor_Infor,
                            atrributes: {
                            exclude: ['id', 'doctorId'],
                            },
                            // eager loading
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi']},
                                { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymenTypeData', attributes: ['valueEn', 'valueVi'] }  
                            ]
                        },
                    ],
                    raw: false,
                    nest: true
                })
                if(data && data.image){
                    data.image = new Buffer(data.image, 'base64').toString('binary');
                }
                if(!data) data = {}
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
let bulkCreateSchedule =  (data) => {
    return new Promise(async (resolve,reject)=>{
        try {
            if (!data.arrSchedule || !data.doctorId || !data.formatedDate){
                resolve({
                    errCode: 1,
                    message: "Missing required paramater!"
                })
            }else{
                let schedule = data.arrSchedule;
                if (schedule && schedule.length > 0){
                    schedule = schedule.map(item => {
                        item.maxNumber = MAX_NUMBER_SCHEDULE;
                        return item;
                    })
                }
                
                

                let existing = await db.Schedule.findAll({
                    where: { doctorId: data.doctorId, date: data.formatedDate },
                    atrributes: ['timeType','date','doctorId','maxNumber'],
                    raw: true
                });
                
                //compare different
                let toCreate = _.differenceWith(schedule, existing, (a,b) => {
                    return a.timeType === b.timeType && +a.date === +b.date;
                });
                //create data
                if (toCreate && toCreate.length > 0)
                {
                    await db.Schedule.bulkCreate(toCreate);
                }
                resolve({
                    errCode: 0,
                    message: 'OK'
                })
                
            }
            
        } catch (e) {
            reject(e);
        }
    })
}
let getScheduleByDate = (doctorId, date) => {
    return new Promise(async (resolve,reject)=>{
        try{
            if(!doctorId || !date){
                resolve({
                    errCode: 1,
                    message: "Missing required parameter"
                })
            }else{
                let data = await db.Schedule.findAll({
                    where: {
                        doctorId: doctorId,
                        date: date
                    },
                    include: [
                        { model: db.Allcode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.User, as: 'doctorData', attributes: ['firstName', 'lastName'] }
                    ],
                    raw: false,
                    nest: true
                })
                if(!data) data = [];
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        }catch(e){
            reject(e);
        }
    })
}
let getExtraInforDoctorById = (doctorId) => {
    return new Promise(async (resolve,reject) => {
        try {
            if(!doctorId){
                resolve({
                    errCode: 1,
                    message: "Missing required parameter"
                })
            }else{
                let data  = await db.Doctor_Infor.findOne({
                    where: {
                        doctorId: doctorId
                    },
                    atrributes: {
                        exclude: ['id', 'doctorId'],
                    },
                    include: [
                        { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'paymenTypeData', attributes: ['valueEn', 'valueVi'] }
                    ],
                    raw: false,
                    nest: true
                })

                if(!data) data = {};
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
let getProfileDoctor = async (doctorId) => {
    return new Promise(async(resolve,reject) => {
    try {
        if (!doctorId)
        {
            resolve({
                errCode: 1,
                message: "Missing required parameter in getProfileDoctor"
            })
        }else{
            let data = await db.User.findOne({
                where: {
                    id: doctorId
                },
                attributes: {
                    exclude: ['password']
                },
                include: [
                    {
                        model: db.MarkDown,
                        attributes: ['description', 'contentHTML', 'contentMarkDown'],
                    },
                    { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    {
                        model: db.Doctor_Infor,
                        atrributes: {
                            exclude: ['id', 'doctorId'],
                        },
                        // eager loading
                        include: [
                            { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                            { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                            { model: db.Allcode, as: 'paymenTypeData', attributes: ['valueEn', 'valueVi'] }
                        ]
                    },
                ],
                raw: false,
                nest: true
            })
            if (data && data.image) {
                data.image = new Buffer(data.image, 'base64').toString('binary');
            }
            if (!data) data = {}
            resolve({
                errCode: 0,
                data: data
            })
        }

    } catch (e) {
        reject(e);
    }})
}
let getListPatientForDoctor =  (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId || !date) {
                resolve({
                    errCode: 1,
                    message: "Missing required parameter in getListPatientForDoctor"
                })
            } else {
                let data = await db.Booking.findAll({
                    where: {
                        statusId: 'S2',
                        doctorId: doctorId,
                        date: date
                    },
                    include: [
                        {
                         model: db.User, as: 'patientData',
                         attributes: ['firstName', 'email','address', 'gender'] ,
                        include: [
                            { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] }
                        ]
                    },
                    {
                        model: db.Allcode, as: 'timeTypeDataPatient', attributes: ['valueEn', 'valueVi']
                    }
                    ],
                    raw: false,
                    nest: true
                })
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
let sendRemedy = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.patientId || !data.timeType) {
                resolve({
                    errCode: 1,
                    message: "Missing required parameter in getListPatientForDoctor"
                })
            } else {
                
                // update patient status
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        patientId: data.patientId,
                        timeType: data.timeType,
                        statusId: 'S2'
                    }, raw: false
                })

                if (appointment){
                    appointment.statusId = 'S3'
                    await appointment.save();
                }
                // send email remedy
                await emailService.sendAttachment(data);
                resolve({
                    errCode: 0,
                    message: 'OK'
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    saveDetailInfoDoctor: saveDetailInfoDoctor,
    getDetailDoctorById: getDetailDoctorById,
    bulkCreateSchedule: bulkCreateSchedule,
    getScheduleByDate: getScheduleByDate,
    getExtraInforDoctorById: getExtraInforDoctorById,
    getProfileDoctor: getProfileDoctor,
    getListPatientForDoctor: getListPatientForDoctor,
    sendRemedy: sendRemedy
}