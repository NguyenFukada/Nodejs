

let getHomePage = (req,res) =>
{
    return res.render('homePage.ejs');
}


//  object:
// {
//     key: ''
//     value: ''
// }
module.exports = {
    getHomePage: getHomePage
}