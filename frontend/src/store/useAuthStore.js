import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/"; // here we are using the Vite environment variables to determine the base URL, if we are in development mode, we use http://localhost:5001, otherwise we use /

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => { // this function checks if the user is authenticated
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data }); // here we are setting the authUser state to the data we get from the response
     /*
     If the user is authenticated, req.user contains the user information (set by the middleware).
     The route handler directly responds with req.user as JSON using res.json(req.user)
     When the client makes a request, the server sends a JSON response.
     Axios automatically parses this JSON, and the user data becomes accessible in res.data
     */    

      get().connectSocket(); // here we are calling the connectSocket function to connect the socket, where get() is used to get the current state of the store, including the socket state, after the authUser state has been set from the response

    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false }); // here we are setting isCheckingAuth to false after the try-catch block, to indicate that the checkAuth function has completed
    }
  },




  signup: async (data) => { // this function is used to sign up the user
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();// here we are calling the connectSocket function to connect the socket, when the user signs up
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket(); // here we are calling the connectSocket function to connect the socket, when the user logs in
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket(); // here we are calling the disconnectSocket function to disconnect the socket, when the user logs out
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => { // this function is used to connect the socket
    
    const { authUser } = get(); // here we are getting the authUser state from the store, get() is used to get the current state of the store , ie the authUser state
    if (!authUser || get().socket?.connected) return; // if the user is not authenticated or the socket is already connected, we return from the function to prevent connecting the socket again

    const socket = io(BASE_URL, { // here we are creating a new socket connection using the socket.io-client library, where the base URL is the URL of the server , to which the socket will connect
      query: {                    // here we are passing the userId to the server as a query, and the userId is the _id of the authenticated user
        userId: authUser._id,
      },
    });
    socket.connect(); // here we are connecting the socket to the server, once the socket is created, for the first time ,for the authenticated user

    set({ socket: socket }); // here we are setting the socket state to the socket object, after the socket is created and connected to the server, teh socket object is stored in the socket state, which contains the socket connection ,ie the information about the connection, and can be accessed from the store

    socket.on("getOnlineUsers", (userIds) => { // here we are listening to the getOnlineUsers event, which is emitted by the server, and contains the userIds of the online users
      set({ onlineUsers: userIds });           // here we are setting the onlineUsers state to the userIds, which contains the userIds of the online users, after the getOnlineUsers event is emitted by the server
    });
  },



  disconnectSocket: () => { // this function is used to disconnect the socket
    if (get().socket?.connected) get().socket.disconnect(); // if the socket is connected, we disconnect the socket, when the user logs out
  },
}));