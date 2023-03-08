import db from '../models/index';
import CRUDService from '../services/CRUDService';
let getHomePage = async (req,res) =>
{
    try {
        let data = await db.User.findAll();
        console.log('---------------------');
        console.log(data);
        console.log('---------------------');
        return res.render('homePage.ejs', {
            data: JSON.stringify(data) });
    }catch(e)
    {
        console.log(e);
    }
    
}


let getCRUD = (req, res) =>{
    return res.render('crud.ejs');
}
let postCRUD = async (req, res) =>{
    await CRUDService.createNewUser(req.body);
    return res.send('post crud from sever');

}

module.exports = {
    getHomePage: getHomePage,
    getCRUD: getCRUD,
    postCRUD: postCRUD,
}