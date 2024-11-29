import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { // create a jwt token with the user id and the secret key
    expiresIn: "7d",
  });

  res.cookie("jwt-chatapp", token, { // send the jwt token as a cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS milliseconds
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "strict", // CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV !== "development", // secure when in production, this will only work in https
  });

  return token;
};