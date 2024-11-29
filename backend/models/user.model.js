import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
  },
  { timestamps: true } // timestamps: true will automatically create a createdAt and updatedAt field in the database
);

const User = mongoose.model("User", userSchema); // User is the model name and userSchema is the schema, mongooze will create a collection named users

export default User;