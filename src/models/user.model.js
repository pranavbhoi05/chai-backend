import mongoose, {Schema} from "mongoose";
// insted of writing mongoose.Schema we can use Schema directly

import jwt from "jsonwebtoken"; // for generating the token
import bcrypt from "bcrypt"; // for hashing the password

const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true, 
        index : true  // index is used to make the search faster
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true, 
    },
    fullname : {
        type : String,
        required : true,
        trim : true, 
        index : true  // index is used to make the search faster
    },
    avatar : {   // based on url
        type : String,        //we will use cloudinary url (its like aws and other cloud storage)
        required : true,
    },
    coverImage : {
        type : String,        
    },
    warchHistory : [
        {
        type : Schema.Types.ObjectId,
        ref : "Video"  // reference to the video model
    }
   ],
   password : {
    type : String,
    required : [true, "Password is required"] // can also give cutome message using array
    },
    refreshToken : {
        type : String,
    }
},
{
    timestamps:true
}
);


userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next()
    this.password = bcrypt.hash(this.password,10)
    next()
} )

userSchema.methods.isPasswordCorrect = async function (password){
 return await bcrypt.compare(password,this.password )
}   

userSchema.methods.generateAccessToken = function () {
   return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        fullname : this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id : this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
)

}

export const User = mongoose.model("User",userSchema);
