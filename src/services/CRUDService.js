import bcrypt from 'bcryptjs';
const salt = bcrypt.genSaltSync(10);

let createNewUser = async (data) => {
    let hashPasswordFromBcrypt = await hashUserPassword(data.password);
    console.log('Data from service');
    console.log(data);
    //console.log(hashPasswordFromBcrypt);

}
let hashUserPassword = (password) => {
    return new Promise(async (resolve,reject) => {
        try{
            let hash = await bcrypt.hashSync(password, salt);
            resolve(hash);
        }catch(e)
        {
            reject(e);
        }
    })
}

module.exports = {
    createNewUser: createNewUser,
}