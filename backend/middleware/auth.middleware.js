import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt-chatapp;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // verify the token with the secret key , to get decoded payload

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password"); // find the user by id and exclude the password field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // when the user is found, add the user object to the request object
    req.user = user; // add the user object to the request object which can be accessed in the next middleware or controller

    next();

  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};