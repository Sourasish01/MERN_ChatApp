import axios from "axios";

export const axiosInstance = axios.create({ // here we are creating an axios instance with the base URL and withCredentials set to true
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api", // here we are using the Vite environment variables to determine the base URL, if we are in development mode, we use http://localhost:5001/api, otherwise we use /api
  withCredentials: true,
});


/*This code snippet creates a reusable Axios instance for making HTTP requests.
 
An Axios instance is a pre-configured object that allows you to define default settings (like a base URL, headers, etc.) for your HTTP requests. This saves time and avoids repeating configurations for every request.





baseURL:

Specifies the base URL for all HTTP requests made using this Axios instance.

Uses Vite's import.meta.env.MODE to determine the environment (either "development" or "production").

In development mode: The base URL is http://localhost:5001/api.

In production mode: The base URL is /api (relative to the deployed domain).

This ensures that your application can dynamically adapt the API's base URL depending on the environment.




withCredentials: true:

Indicates that cross-origin requests (CORS) should include credentials such as cookies or HTTP authentication headers.

Necessary if the backend uses cookies for session management or authentication.






Why use an Axios instance?

Centralized configuration: You only need to define settings (e.g., baseURL, withCredentials) once.

Cleaner code: Instead of setting baseURL for every API request, you can simply call axiosInstance.get(...), axiosInstance.post(...), etc.

Customization: You can add interceptors to handle request/response transformations or error handling.

*/