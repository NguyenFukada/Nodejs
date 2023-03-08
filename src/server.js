import express from "express";
import bodyParser from "body-parser";
import ViewEngine from "./config/ViewEngine";
import initWebroutes from "./route/web";
import connectDB from './config/connectDB';
require('dotenv').config();


let app = express();

//config app


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

ViewEngine(app);
initWebroutes(app);

connectDB();


let port = process.env.PORT || 6969;
//PORT == undefined -> PORT = 6969;
app.listen(port, () =>
{
    //callback
    console.log("Backend Nodejs is running on the port: "+port);
})