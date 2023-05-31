const express = require("express");
const cors = require("cors");
require("./db/config");
const User = require("./db/User");
const Products = require("./db/products");

const Jwt = require('jsonwebtoken');
const JwtKey ='e-commerce';

// const mongoose = require('mongoose');

// const connectDB= async ()=>{
//     mongoose.connect("mongodb://127.0.0.1:27017/e-commerce");
//     const productschema = new mongoose.Schema({});
//     const product=mongoose.model("products",productschema);
//     const data= await product.find();
//     console.log(data)
// }
// connectDB();

const app = express();

app.get("/", (req, res) => {
  res.send("app is working....");
});

app.use(express.json());
app.use(cors());

app.post("/register", async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result },JwtKey,{expiresIn:"2h"},(err,token)=>{
    if(err){
      res.send({result:"something went wrong, Please try after sometime...."})
    }
    res.send({result, auth:token})
  });
});

app.post("/login", async (req, res) => {
  
if (req.body.password && req.body.email) {
  let user = await User.findOne(req.body).select("-password");
  if (user) {
    Jwt.sign({ user },JwtKey,{expiresIn:"2h"},(err,token)=>{
      if(err){
        res.send({result:"something went wrong, Please try after sometime...."})
      }
      res.send({user, auth:token})
    })
  } else {
    res.send({ result: "No user found" });
  }
} else {
  res.send({ result: "No user found" });
}
});

//Middleware
function verifyToken(req,res,next){
  let token = req.headers['authorization'];
  if(token)
  {
    token = token.split(' ')[1];
    //console.log("middleware called",token);
    Jwt.verify(token,JwtKey,(err,valid)=>{
      if(err)
      {
        return res.status(401).send({result:"Please provide valid token"})
      }
      else{
        return next();
      }
    })
  }
  else{
    return res.status(403).send({result:"Please add token in header"});
  }
}

app.get("/getProducts",verifyToken,async (req, res) => {
  const products = await Products.find();
  if (products.length > 0) {
    return res.send(products);
  } else {
    return res.send({ result: "No Product found" });
  }
});

app.post("/addProducts",verifyToken, async (req, res) => {
  let products = new Products(req.body);
  let result = await products.save();
  return res.send(result);
});

app.delete("/deleteProducts/:id",verifyToken, async (req, res) => {
  let result = await Products.deleteOne({ _id: req.params.id });
  return res.send(result);
});

app.get("/getProducts/:id",verifyToken, async (req, res) => {
  let result = await Products.findOne({ _id: req.params.id });
  if (result) {
     res.send(result);
  } else {
   res.send({ result: "No record found" });
  }
});

app.put("/updateProducts/:id",verifyToken, async (req, res) => {
  let result = await Products.updateOne(
    {
      _id: req.params.id,
    },
    {
      $set: req.body,
    }
  );
     res.send(result);
});

app.get("/searchProducts/:key", verifyToken,async (req, res) => {
  let result = await Products.find({
    $or: [
      {
        name: { $regex: req.params.key },
      },
      {
        company:{$regex:req.params.key }
      }
    ],
  });
  return res.send(result);
});


app.listen(5000);
