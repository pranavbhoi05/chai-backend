import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshTokens = async (userId) =>{
  try {
    const user = await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(500, "somthing went wrong while generating tokens")
  }
}

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
  const {fullName, email, username, password} = req.body;
//   console.log("email :", email);


  // step 2 : validation
  // if(fullName === ""){
  //   throw new ApiError(400, "fullName is required", "registerUser")
  // }

  //to check multiple errors at once we'll pass array
  if(
    [fullName, email, username, password].some((field) =>
  field?.trim() === "")
){
    throw new ApiError(400, "All feilds are required")
  } 
  //can also create conditon for email format validation  
 
   
// step 3 : check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }] 
  })

  if(existedUser){
  throw new ApiError(409, "User with email or username already exists")
   
  }
  
 // step 4 : check for images, avatar
 const avatarLocalPath =  req.files?.avatar[0]?.path;
let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
  

 if(!avatarLocalPath){ 
  throw new ApiError(400, "Avatar is required")
 }

// step 5 : upload them to cloudinary 

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)
 
if(!avatar){
  throw new ApiError(400, "Avatar file is required")
}

// step 6 : create user object and 
// step 7 : remove password and refresh token feild from response

const user = await User.create({
  fullName,
  avatar: avatar?.url || "",
  coverImage: coverImage?.url || "",
  email,
  password,
  username : username.toLowerCase()

})

// console.log(req.files);

const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
)

//step 8 : check for user creation success or failure

if(!createdUser){
  throw new ApiError(500, "something went wrong while registering the user")
}

// step 9 : return response to frontend if successed
  
  return res.status(201).json(
    new ApiResponse(200, createdUser , "User created successfully")
  )

})

const loginUser = asyncHandler(async (req, res) => {
  //todo's: 
  // 1. get user details from frontend
  // 2. validation username or email
  // 3. check if user exists in db
  // 4. check for password
  // 5.access and refresh token generation
  // 6. set cookies
  // 7. return response to frontend


  const {username , email, password} = req.body
  console.log(email);
  // console.log(req.body);
  
  
  
  
  // 2. validation username or email
  if(!username && !email){
    throw new ApiError(400, "username or email is required")
  }
   // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }

  // 3. check if user exists in db
  const user = await User.findOne({
    $or: [{username}, {email}]
  })
  //if user does not exist then
  if(!user){
    throw new ApiError(404, "username or email does not exist") 
  }

// console.log("Plain password:", password);
// console.log("Hashed in DB:", user.password);

  // 4. check for password 
  const isPasswordValid = await user.isPasswordCorrect(password)
  // console.log("Password match:", isPasswordValid);
  if(!isPasswordValid){
    throw new ApiError(401, "invalid password")  
  }

  // 5.access and refresh token generation
  
  const {accessToken , refreshToken} = await
   generateAccessAndRefreshTokens(user._id)

  //we are doing login method, so it's (user) will have its own (user)method, (its same as we previouly created method for register user method)   so  we need to hind refresh token and password. so we'll add another db method  
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  // 6. set cookies
 const options = {
   
  httpOnly: true,
  secure : true
 } 

 return res.
 status(200)
 .cookie("accessToken", accessToken , options)
 .cookie("refreshToken", refreshToken, options)
 .json(
  new ApiResponse(
    200,{
      user: loggedInUser,
      accessToken,
      refreshToken
      
    },
    "User logged in successfully")
 )

})

const logoutUser =  asyncHandler(async (req,res) =>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset : {
        refreshToken : 1   // 1 means delete this field
      }
    },
    {
      new : true
    }
  )

   const options = { 
  httpOnly: true,
  secure : true
 } 

 return res
 .status(200)
 .clearCookie("accessToken", options)
 .clearCookie("refreshToken", options)
 .json(
  new ApiResponse(
    200,"User logged out successfully"))
}) 

const refreshAccessToken = asyncHandler(async (req , res) =>{
  //todo's:
  // 1. get refresh token from cookies or body
  // 2. check if refresh token exists
  // 3. verify refresh token 
  // 4. generate new access token
  // 5. set new access token in cookies
  // 6. return response to frontend

  // 1. get refresh token from cookies or body
  const incomingRefreshToken = req.cookies.
  refreshToken || req.body.refreshToken

   // 2. check if refresh token exists
  if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorized request")
  }

  // 3. verify incoming refresh token
try {
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    //we'll find user by id so that we;ll get user details
    const user = await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401, "invalid refresh token")
    }
    
  // check if refresh token is same as in db
     if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "refresh token is expired or used")
     }
  
     const options = {
      httpOnly: true,
      secure: true  
     }
  
    // 4. generate new access token
    const {accessToken , newRefreshToken} = await 
    generateAccessAndRefreshTokens(user._id)
     return res
     .status(200)
     .cookie("accessToken",accessToken, options)
     .cookie("refreshToken",newRefreshToken, options)
     .json(
      new ApiResponse(
        200,
        {accessToken,
          refreshToken:
        newRefreshToken},
        "Access token refreshed successfully"
      )
     )
  
} catch (error) {
  throw new ApiError(401, "invalid refresh token")
}
})

const changeCurrentPassword = asyncHandler(async (req , res) =>{
  //todo's:
  //step 1. get current password and new password from body
  //step 2. check if current password is correct
  //step 3. update password in db
  //step 4. return response to frontend

  //step 1
  const {oldPassword, newPassword} = req.body 
  
  const user = await User.findById(req.user?._id)
  if(!user){
    throw new ApiError(404, "user not found")
  }

  //step 2 check if current password is correct
  const isPasswordCorrect = await user.
  isPasswordCorrect(oldPassword)
  
  if(!isPasswordCorrect){
    throw new ApiError(400, "invalid old password")
  }   
  
  //step 3 set new password
  // for understanding how user.password = newPassword works
  //let a = {};        // a is an object
  // let b = "hello";   // b is a variable
  // a.text = b;        // store the value of b in the 'text' property of a

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  //step 4 return response to frontend
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    {},
    "Password changed successfully"
  ))
})


  const getCurrentUser = asyncHandler(async(req , res) => {
    return res
    .status(200)
    .json(new ApiResponse(
      200,
      req.user,
      "Current user fetched successfully"
    ))
  })

  const updateAccountDeatails = asyncHandler(async (req, res) => {
   
    // get user details from body
    const {fullName , email } = req.body

    // validation
    if(!fullName || !email){
      throw new ApiError(400, "Full name and email are required ")
    }

    // find user by id and update
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set : {          // to update fields
          fullName,
          email
        } 
      },
      {new: true}, // return the updated user
    ).select(
      "-password"
    )

    return res
    .status(200)
    .json(new ApiResponse (
      200,
      user,
      "Account details updated successfully"
    ))
  })

  const updateUserAvatar = asyncHandler(async (req, res) => {
    //todo's:
    // get avatar file from request
     const avatarLocalPath = req.file?.path

     if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is missing")}

      // todos : write code for delete previous avatar file from cloudinary



      // upload avatar on cloudinary
     const avatar =  await uploadOnCloudinary(avatarLocalPath)

     // check if avatar url is uploaded
     if(!avatar.url){
      throw new ApiError(400, "error while uploading on avatar")
     }
      // update user avatar in db
      const user = await User.findByIdAndUpdate(req.user._id,
        {
         $set :{ 
         avatar : avatar.url
         } //
        },
      {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Avatar updated successfully"
      )
    )
  })

  const updateUserCoverImage = asyncHandler(async (req, res) => {
     const coverImageLocalPath = req.file?.path

     if(!coverImageLocalPath){
      throw new ApiError(400, "cover file is missing")}

      // upload avatar on cloudinary
     const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

     // check if avatar url is uploaded
     if(!coverImage.url){
      throw new ApiError(400, "error while uploading on coverImage")
     }
      // update user avatar in db
      const user = await User.findByIdAndUpdate(req.user._id,
        {
         $set :{  
         coverImage : coverImage.url
         } //
        },
      {new: true}
    ).select("-password")

     return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "coverImage updated successfully"
      )
    )
  })

  const getUserChannelProfile = asyncHandler(async (req, res) => {
    //todo's:
  // 1. get username from params
  // 2. find user by username
  // 3. check if user exists
  // 4. return user profile

    const {username} = req.params
   // "Take the value of username from the URL params and create a new variable named username."

   
    if(!username?.trim()){
      throw new ApiError(400, "username is required")
    }

    // User.find({username})

   const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase()
      }
    },
    {
      $lookup: {
          from: "subscriptions",    ///	Which collection to join (pull data from)
          localField: "_id",        //Field from the current collection
          foreignField: "channel",  // Match to 'channel' in subscriptions (we are calculating subscribers so we are matching with channel)
          as: "subscribers"         //Name of the new array field to add
      } 
    },    
    {
      $lookup: {
         from: "subscriptions",    // Again join with subscriptions
         localField: "_id",        
         foreignField: "subscriber",  // Match to 'subscriber' in subscriptions (to calculate how many channels a user has subscribed to) 
         as: "subscribedTo"
      }
    },
    {
      $addFields: {  
            subscribersCount: {
              $size: "$subscribers" // Count the number of subscribers
            },
            channelSubscribedToCount:{
              $size: "$subscribedTo" // Count the number of channels subscribed to
        },
        isSubscribed: {
          $cond: {
            if:{ $in: [req.user?._id, "$subscribers.subscriber"]}, // in this code $subscribers from above lookup and subscriber is the field in subscription model
            then: true,
            else: false
          }
        }    
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        createdAt: 1
      }
    }
  ])

  if(!channel?.length){    
    throw new ApiError(404, "Channel not found")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0], // since we are using aggregate, it will return an array, so we need to take first element
      "User channel profile fetched successfully"
    )
  )
  })

  const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    // 1. Filter the User collection to find the currently logged-in user by _id
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)

      }
    },

    // 2. Join the videos collection using the watchHistory array
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistoryVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ]);

  // Safety check
  // if (!user.length || !user[0]) {
  //   return res.status(404).json(
  //     new ApiResponse(404, null, "User not found")
  //   );
  // }

  return res.status(200).json(
    new ApiResponse(
      200,
      user[0].watchHistoryVideos,
      "Watch history fetched successfully"
    )
  );
});


export {
        registerUser,
        loginUser, 
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDeatails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory
      }
      


    