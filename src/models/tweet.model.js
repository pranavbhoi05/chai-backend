import mongoose ,{Schema} from "mongoose";
const tweetSchema = new Schema(
    {
        owner : {
            type : Schema.Types.ObjectId,
            req : "User",
        } ,
        
        content : {
            type : String,
            required: true
        } ,

        }
    
,{
    timestamps: true
})

tweetSchema.plugin(mongooseAggregatePaginate);
export const Tweet = mongoose.model("Tweet", tweetSchema);