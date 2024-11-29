import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import User from "./models/user.model.js";
import Message from "./models/message.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "./config/utils.js";
import { protectRoute } from "./middleware/auth.middleware.js";
import cloudinary from "./config/cloudinary.js";
import cors from "cors";

import path from "path";

const __dirname = path.resolve();

const app = express();
app.use(express.json()); // used to parse JSON bodies
app.use(cookieParser()); // used to parse cookies
dotenv.config();
app.use(
  cors({ //cors is a middleware that allows the server to accept requests from the client, even if they are coming from a different origin, ie, different port or domain
    origin: "http://localhost:5173", // the origin that is allowed to make requests to the server,other than port 5001, which is the port of the server , if requests are coming from any other origin, they will be blocked, other than ports 5001 and 5173
    credentials: true,
  })
);


//AUTHENTICATION ROUTES

app.post("/api/auth/signup", async (req, res) => {

    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password) {
          return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }


        const user = await User.findOne({ email }); // check if user already exists in the database
        if (user) return res.status(400).json({ message: "Email already exists" });


        const salt = await bcrypt.genSalt(10); // generate a salt with 10 rounds
        const hashedPassword = await bcrypt.hash(password, salt); // hash the password with the salt


        const newUser = new User({ // new User() creates a new user object, where User() only refers to the model, wheras const newUser is an instance of the user object created by the model
            fullName,
            email,
            password: hashedPassword,
          });

          //When you create a new instance of a Mongoose model (like new User(...)), Mongoose pre-generates the _id for the object, even before it is saved to the database.
          //The newUser._id is already available because Mongoose has pre-generated it.

          if (newUser) {
            // generate jwt token here
            generateToken(newUser._id, res); //_id is the unique id of the user in the database, that is how mongoDB identifies the user
            
            await newUser.save(); // save the user to the database only if the user is created successfully and the jwt token is generated
      
            res.status(201).json({ // send the user data as a response to the client if the user is created successfully
              _id: newUser._id,
              fullName: newUser.fullName,
              email: newUser.email,
              profilePic: newUser.profilePic,
            });
          } else {
            res.status(400).json({ message: "Invalid user data" });
          }

    }  

    catch (error) {
        console.log("Error on user signup", error);
        res.status(500).json({ message: "Internal server error" });
    } 
});

app.post("/api/auth/login", async (req, res) => {
    
    const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }


});

app.post("/api/auth/logout", async (req, res) => {
    
    try {
        res.cookie("jwt-chatapp", "", { maxAge: 0 }); // clear the jwt token cookie
        res.status(200).json({ message: "Logged out successfully" });
      } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
      }

});


app.put("/api/auth/update-profile", protectRoute, async (req, res) => {
    try {
        const { profilePic } = req.body; //req.body refers to the data sent by the client in the request body to the server
        const userId = req.user._id; //req.user is the user object added to tthe request object by the protectRoute middleware so that it can be accessed in the next middleware or controller
        // we got the power to access the user data from just request, due to middleware varification
        
        if (!profilePic) {
          return res.status(400).json({ message: "Profile pic is required" });
        }
    
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { profilePic: uploadResponse.secure_url }, // update the profilePic field of the user with the secure_url of the uploaded image, that comes from cloudinary
          { new: true } // return the updated user data
        );
    
        res.status(200).json(updatedUser); // send the updated user data as a response to the client
      } 
      
      catch (error) {
        console.log("error in update profile:", error);
        res.status(500).json({ message: "Internal server error" });
      } 
});

app.get("/api/auth/check", protectRoute, async (req, res) => { // check if the user is authenticated
    try {
        res.status(200).json(req.user); // try to access req.user, if it is available, then the user is authenticated
      } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
      }
});



// MESSAGE ROUTES

app.get("/api/messages/users", protectRoute, async (req, res) => { // for users to be shown in sidebar
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password"); // find all users except the logged in user and exclude the password field
    
        res.status(200).json(filteredUsers);
      } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ error: "Internal server error" });
      }
});

app.get("/api/messages/:id", protectRoute, async (req, res) => { // to get message histtory of two particular user
    try {
        const { id: userToChatId } = req.params; // get the user id from the request params, which is the id of the user to chat with
        const myId = req.user._id; // get the id of the logged in user
    
        const messages = await Message.find({ // find all messages where the senderId is the logged in user and the receiverId is the user to chat with, or vice versa
          $or: [
            { senderId: myId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: myId },
          ],
        });
    
        res.status(200).json(messages);
      } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
      }
});

app.post("/api/messages/send/:id", protectRoute, async (req, res) => { // to send a message to a particular user
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params; // get the receiver id from the request params
        const senderId = req.user._id; // get the sender id from the logged in user
    
        let imageUrl;
        if (image) {
          // Upload base64 image to cloudinary
          const uploadResponse = await cloudinary.uploader.upload(image);
          imageUrl = uploadResponse.secure_url;
        }
    
        const newMessage = new Message({
          senderId,
          receiverId,
          text,
          image: imageUrl,
        });
    
        await newMessage.save();
    
        // realtime functionality using socket io
    
        res.status(201).json(newMessage);
      } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
      }
    

});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "./frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "./frontend", "dist", "index.html"));
  });
}


const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log("Server running on http://localhost:" + PORT);
    connectDB();
});