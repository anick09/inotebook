const express=require('express')
const router =express.Router();
const User = require('../models/User');
const {body, validationResult } = require('express-validator');
const bcrypt=require('bcryptjs');
var jwt=require('jsonwebtoken');

const JWT_SECRET = "Anick@Bhattacharya";

// create a user POST "/api/auth/createuser"
router.post('/createuser', [
    body('name').isLength({min: 3}),
    body('email').isEmail(),
    body('password').isLength({min:5})
],async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    // Check whether the user with same email already existing

    try{
    let user =await User.findOne({email: req.body.email});
    if(user){
        return res.status(400).json({error: "Email id already exists"});
    }

    //generating a secret password
    const salt=await bcrypt.genSalt(10);
    const secpass=await bcrypt.hash(req.body.password,salt);
    user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secpass
    });
    const data = {
        user:{
            id: user.id
        }
    }
    const authToken=jwt.sign(data,JWT_SECRET);
    console.log(authToken);
    res.json({authToken});

    } catch(err) {
        console.error(err.message);
        res.status(500).json({"Ineternal Server Error": err.message});
    }
    // .then(user => res.json(user))
    // .catch(err=>{console.log(err)
    // res.json({"errors": "Please enter unique email"})});
});


// Login a user POST "/api/auth/login"
router.post('/login', [
    body('email',"Enter valid email").isEmail(),
    body('password',"Password cannot be empty").exists()
],async (req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    //destructuring request.body and getting email and password separate
    const {email,password}=req.body;
    
    try{
        let user=await User.findOne({email});
        if(!user){
            return res.status(400).json({errors:"wrong email or password"});
        }

        const passwordCompared=await bcrypt.compare(password,user.password);
        if(!passwordCompared){
            return res.status(400).json({errors:"wrong email or password"});
        }

        const data = {
            user:{
                id:user.id
            }
        }

        const authToken = jwt.sign(data,JWT_SECRET);
        res.json({authToken})
    }catch(err){
        console.error(err.message);
        res.status(500).send("Ineternal Server Error: " + err.message);
    }
});


module.exports = router