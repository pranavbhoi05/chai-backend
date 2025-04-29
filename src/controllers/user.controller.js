import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {uploadonCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Registration logic here
  // res.status(200).json ({
  //   message : "me and myself"
  // })
   
  // steps :
  //get user details from frontend
  //validation
  //check if user already exists : username ,email
  // check for images, check for avatar (checks our file exists or not)
  //upload them to cloudinary , after we'll check avatar is uploaded or not
  // create user object - (create entry in db)
  //remove password and refresh token feild from response 
  //check for user creation success or failure
  //return response to frontend if successed

  // step 1 :
  const {fullname, email, username, password} = req.body;
  console.log("email :", email);


  // step 2 : validation
  // if(fullname === ""){
  //   throw new ApiError(400, "Fullname is required", "registerUser")
  // }

  //to check multiple errors at once we'll pass array
  if(
    [fullname, email, username, password].some((field) =>
  field?.trim() === "")
){
    throw new ApiError(400, "All feilds are required")
  } 
  //can also create conditon for email format validation  
 

// step 3 : check if user already exists
  const existedUser = User.findone({
    $or: [{ username }, { email }]
  })

  if(existedUser){
  throw new ApiError(409, "User with email or username already exists")
   
  }
  
 // step 4 : check for images, avatar
 const avatarLocalPath =  req.files?.avatar[0]?.path;
 const coverImageLocalPath = req.files?.coverImage[0]?.path;

 if(!avatarLocalPath){
  throw new ApiError(400, "Avatar is required")
 }

// step 5 : upload them to cloudinary 

const avatar = await uploadonCloudinary(avatarLocalPath)
const coverImage = await uploadonCloudinary(coverImageLocalPath)
 
if(!avatar){
  throw new ApiError(400, "Avatar file is required")
}

// step 6 : create user object and 
// step 7 : remove password and refresh token feild from response

const user = await User.create({
  fullname,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  email,
  password,
  username : username.toLowerCase(),

})

const createdUser = await user.findById(user._id).select(
  "-password -refreshToken"
)

//step 8 : check for user creation success or failure

if(!createdUser){
  throw new ApiError("500", "something went wrong while registering the user")
}

// step 9 : return response to frontend if successed
  
  return res.status(201).json(
    new ApiResponse(200, createdUser , "User created successfully")
  )

})

export {registerUser}
