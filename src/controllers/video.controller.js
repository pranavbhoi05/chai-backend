import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    // step1:  parse the page and limit parameters 
    const parsedPage = parseInt(page)
    const parsedLimit = parseInt(limit)
    const skip = (parsedPage - 1) * parsedLimit
    
    // step 2: build sort stage and match stages ,  sortBy is the field to sort by, sortType is either "asc" or "desc"
    let sortStage = {} 
    sortStage[sortBy] = sortType === "asc" ? 1 : -1; 
    
    const matchStage = {              // Only fetch videos where isPublished is true., This field tells us whether a video is public (published) or hidden (unpublished/draft).
        isPublished: true             // $match: matchStage in aggregation
    }

    // step 3: add search conditions
    if(query){
        matchStage.$or = [ 
            { title : { $regex: query, $options: "i" } }, // case-insensitive search
            { description : { $regex: query, $options: "i" } },  // The title is short, catchy — but doesn’t tell everything, but The description has keywords, full context, tags, or topics so that why we add description as well
        ]
    }

    // step 4: add user filter if userId is provided
    if(userId && isValidObjectId(userId)) {
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }
    // This means:
   //"If the frontend has passed a valid userId, then filter the videos to only show videos that belong to that user."
//    This is useful for:
                        // Fetching videos by a specific user
                       // For example: someone’s channel page


    // step 5: aggregate the videos
//This (matchStage) object will automatically match both:
// isPublished: true 
// owner: ObjectId(...) 
    const videos = await Video.aggregate(
        [
            {
        $match : matchStage 
            },
    {
        $lookup : {
            from : "users",
            localField : "owner",
            foreignField : "_id",
            as : "ownerDetails",
        pipeline : [
            {
                $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                }
            }
        ]
    }
},
{     
    $addFields:{
        owner: { $first: "$ownerDetails" },
    }
},
{$sort: sortStage},             //$sort is A MongoDB aggregation stage keyword , for sorting the result
{$skip: skip},                  //$skip is A MongoDB aggregation stage keyword, for pagination
{$limit: parsedLimit}           //$limit is A MongoDB aggregation stage keyword
])

// step 6: check if video is empty
if(videos.length === 0) {
    throw new ApiError(404, "No videos found")
}

// step 7: return the response
return res.status(200)
.json( 
    new ApiResponse(200,
         "Videos fetched successfully", 
         videos    
    )
)
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video}

        // step 1: validate the request
     if(!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "title and description are required")
     }

     // step 2: check if video file is provided
     const videoFileLocalPath = req.files?.video?.[0]
        if(!videoFileLocalPath) {
            throw new ApiError(400, "video file is required")
        }
    
        // step 3: upload the video to cloudinary
     const videoFile = await uploadOnCloudinary(videoFileLocalPath.path)
        if(!videoFile) {
            throw new ApiError(500, "Failed to upload video")
        }

        // step 4: create the video document in the database
    const video = await Video.create({
        title: title.trim(),
        description: description.trim(),
        videoFile : videoFile?.secure_url,
        owner : req.user._id
        
    }) 
    
    // step 5: return the response
    res.status(201).json(
        new ApiResponse(201, "Video published successfully", video)
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    
    // step 1: validate the videoId
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.aggregate([
        {
            $match : {
                _id: new mongoose.Types.ObjectId(videoId),
                isPublished: true // Only fetch published videos
            }
        },
        {
            $lookup: {
                from: "users",
                localField:"owner",
                foreignField:"_id",
                as: "ownerDetails",
                pipeline: [{
                    $project : {
                        fullname: 1,
                        username: 1,
                        avatar: 1
                    }
                }
            ]
         }
        },{
            $addFields: {                     //$addFields: replaces owner with just one object (not an array)
                owner: {$first: "$ownerDetails"}
            }
        }
    ])

    // step 2: check if video is found
    if(video.length === 0) {
        throw new ApiError(404, "Video not found")
    }

    //step 3 : return res
    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video fetched successfully", video)
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const {title , description , thumbnail} = req.body
    if(!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required")
    }

    // step 1: find the video
    const video = await Video.findByIdAndUpdate(
        videoId, 
        {
            $set : {
                title: title.trim(),
                description: description.trim(),
                thumbnail
            }
    },
            {new: true} // return the updated video
    )

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    // step 2: return the response
    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video updated successfully", video)
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
     const video = await Video.findByIdAndDelete(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video deleted successfully", video)
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // step 1: validate the videoId
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    
    // step 2: find the video by id and chak if it exists
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }

   // step 3: toggle the isPublished status
    video.isPublished = !video.isPublished
    //If video.isPublished is true, this sets it to false and If false, sets it to true.

    await video.save()  // Save the updated video document

    // step 4: return the response
    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video publish status toggled successfully", video)
    )
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}