const db = require("../models")
let createClinic = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.name || !data.imageBase64 || !data.descriptionHTML || !data.descriptionMarkDown || !data.address) {
                resolve({
                    errCode: 1,
                    message: 'Missing parameter specialty',
                })
            } else {
                await db.Clinic.create({
                    name: data.name,
                    address: data.address,
                    image: data.imageBase64,
                    descriptionHTML: data.descriptionHTML,
                    descriptionMarkDown: data.descriptionMarkDown
                })
                resolve({
                    errCode: 0,
                    message: 'OK',
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
let getAllClinic = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await db.Clinic.findAll();

            if (data && data.length > 0) {
                data.map(item => {
                    item.image = new Buffer(item.image, 'base64').toString('binary');
                    return item;
                })

            }
            resolve({
                errCode: 0,
                message: "OK",
                data
            })
        } catch (e) {
            reject(e);
        }
    })
}
let getDetailClinicById = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    message: 'Missing parameter something in getDetailClinicById !',
                })
            } else {
                let data = await db.Clinic.findOne({
                    where: {
                        id: inputId
                    },
                    atrributes: ['descriptionHTML', 'descriptionMarkDown','address','name'],
                })
                if (data) {
                    let doctorClinic = [];
                        doctorClinic = await db.Doctor_Infor.findAll({
                            where: { clinicId: inputId },
                            atrributes: ['doctorId'],
                        })
                    
                    data.doctorClinic = doctorClinic;
                } else {
                    data = {}
                }
                resolve({
                    errCode: 0,
                    message: "OK",
                    data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
module.exports = {
    createClinic: createClinic,
    getAllClinic: getAllClinic,
    getDetailClinicById: getDetailClinicById,
 
}