import mongoose,{Schema} from "mongoose"

const productSchema= new Schema({
    productName:{
        type:String,
        required:true
        
    },
    category:{
        type:String,
        required:true
    },
    productImage:{
        type:String,
        required:true
    }
})



export const Product=mongoose.model("Product",productSchema)