import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from   "../utils/ApiError.js"
import {ApiResponse} from  "../utils/ApiResponse.js"

import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



const registerProduct=asyncHandler(async(req,res)=>{
    const {productName,category}=req.body
    console.log(productName,category)

    if([productName,category].some((value)=>value?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }

    const existedProduct= await Product.findOne({
        $and:[
            {productName},{category}
        ]
    })
    if(existedProduct){
        throw new ApiError(409,"Products already exists")
    }
    console.log(req.file)

    const productLocalPath=req.file?.path
    if(!productLocalPath){
        throw new ApiError(409,"Product Local path is not found")
    }

    const uploadProduct=await uploadOnCloudinary(productLocalPath)


    if(!uploadProduct){
        throw new Apierrror(400,"Product image is required")

    }

    const product=await Product.create({
        productName,
        category,
        productImage:uploadProduct.url

    })

    return res.status(201).json(new ApiResponse(201,product,"Product registered successfully"))






})



/////// get product by params :name

const getProducts=asyncHandler(async(req,res)=>{
    const productName=req.params.name
    const  products=await Product.find({
        productName:productName})
    res.status(200).json(new ApiResponse(200,products,"Products have been fetched"))
})





export {registerProduct,getProducts}