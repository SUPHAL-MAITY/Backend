import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from   "../utils/ApiError.js"
import {ApiResponse} from  "../utils/ApiResponse.js"

import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"


const generateAccessTokenAndRefreshTokens=async(userId)=>{
    try {

        ////take user id as parameter and find user on that basis
        //// generate accesstoken (methods in models)
        ////generate refreshtoken (methods in models)
        ///save refresh token in the database
        //save user in the database
        //return accestoken and refresh token

        
        const user=await User.findById(userId)
        
        
        const accessToken= user.generateAccessToken()
        
        
        const refreshToken= user.generateRefreshToken()
       

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
        
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating token")
        
    }
}




const registerUser = asyncHandler(async(req,res)=>{


    ///get user details from frontend
    //validation
    //check if the user already exits:email,username
    // store the local path of images,validate the path,upload on cloudiary and store their response
    //create user object
    ////remove password , refresh token from the response field
    /// check for user creation
     //return res




    ///get user details from frontend
    const {fullName,email,username,password}=req.body
    // console.log("email",email)
    // console.log(req.body)
    // console.log(req.files)


    
    //validation

    if([fullName,email,username,password].some((value)=>value?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }


   //check if the user already exits:email,username


   const existedUser=await User.findOne({
    $or:[{username},{email}]
   })
//    console.log(req?.files)

   if(existedUser){
    throw new ApiError(409,"User with email or username already exists")
   }


    // store the local path of images,validate the path,upload on cloudiary and store their response
    
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files?.coverImage[0]?.path;

    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }


    //upload them to cloudinary

    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }
    

    //create user object and entry into db
    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()


    })
    console.log(user)

    


    //remove password , refresh token from the response field
    const createdUser= await User.findById(user._id).select("-password -refreshToken")
    
    /// check for user creation
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    

    //return res

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Succeessfully")
    )
})

const loginUser=asyncHandler(async(req,res)=>{
    ////take data from req body
    ////validate username or email
    ///find the user using username or email
    ///password check
    ////destructure  access and refresh token
    ///find user 
    ///send cookies and json
    
    const {email,username,password}=req.body
   
    if(!(username || email)){
        throw new ApiError(400,"Username or email is required")
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    
    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)
    // console.log(isPasswordValid)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }
    

   const {accessToken,refreshToken}= await generateAccessTokenAndRefreshTokens(user._id)
//    console.log("accessToken")
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken ")

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{user:loggedInUser,accessToken,refreshToken },
            "User logged In successfully"
        )
    )




})


const logoutUser=asyncHandler(async(req,res)=>{

    ////user access was given by middleware
    ///set the refreshtoken as undefined
    ///return user clearing cookies



    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{ refreshToken: undefined
        }},
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))


    })


const refreshAccessToken=asyncHandler(async(req,res)=>{

    ///take the refresh  token from cookies or body
    ///decode the user id from refresh token
    ///check the refresh token
    ////destructure the accessToken and refreshToken 
    ////return two tokens as cookie
    ///
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh Token")
        }
        if(incomingRefreshToken !==user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken}=await generateAccessTokenAndRefreshTokens(user._id)
    
        return res.status(200).cookie("AccessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options).json(
            new ApiResponse(
                200,{accessToken,newRefreshToken},
                "Access token refreshed"
            )
        )
    
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
        
    }








})



const changeCurrentPassword=asyncHandler(async(req,res)=>{

    ////take old and new password 
    ///find user
    ///check password
    ///set user password 
    ///save user without validation
    ///return res
    const {oldPassword,newPassword}=req.body
    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(new ApiResponse(200,{},"Password changed Successfully") )


})


const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})


const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")

    }

    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullName,email
        }

    },{new:true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Accoount details updated successfully"))


});


const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)

if (!avatar?.url){
    throw new ApiError(400,"Error while uploading on avatar")
}


const user=await User.findByIdAndUpdate(req.user?._id,{
    $set:{
        avatar:avatar.url
    }
},{new:true}).select("-password")

return res.status(200).json(new ApiResponse(200,user,"Avatar Image updated successfully"))


})


const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover  Image file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

if (!coverImage?.url){
    throw new ApiError(400,"Error while uploading on avatar")
}


const user=await User.findByIdAndUpdate(req.user?._id,{
    $set:{
        coverImage:coverImage.url
    }
},{new:true}).select("-password")

return res.status(200).json(new ApiResponse(200,user,"Cover Image updated successfully"))




})




    




export {registerUser,loginUser,logoutUser,refreshAccessToken,getCurrentUser,updateUserAvatar,updateUserCoverImage,changeCurrentPassword,updateAccountDetails}
