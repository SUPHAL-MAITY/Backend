import mongoose ,{Schema} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"






const userSchema= new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true


    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
        


    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
        


    },
    avatar:{
        type:String,///cloudinary url
        required:true,
       

    },
    coverImage:{
        type:String,///cloudinary url
    },
    watchHistory:{
        type:Schema.Types.ObjectId,
        ref:"Video"

    },
    password:{
        type:String,
        required:[true,"Password is reuired"]
    },
    refreshToken:{
        type:String

    }







},{timestamps:true})

////////hash the password before save if password is modified
///a pre-save mongoose middleware

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password =await bcrypt.hash(this.password,10)
    next()
})



// returns a boolean>> wheather the  password (taken in the parameter ) is same with hashed password (this.password) stored in the document

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password)
}



///////  generate a JSON Web  AccessToken (JWT)

userSchema.methods.generateAccessToken=function(){
    // console.log("generate access token started")
    const payload = {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    };
    const options = {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    };
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, options);
}

/// generate a JSON Web  RefreshToken (JWT)


userSchema.methods.generateRefreshToken=function(){
    // console.log("generate refresh token started")
    const payload = {
        _id: this._id,
        
    };
    const options = {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    };
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, options);
}




export const User=mongoose.model("User",userSchema)