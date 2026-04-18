import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[AUTH] Decoded token:", { id: decoded.id, role: decoded.role });

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        console.log("[AUTH] User not found for ID:", decoded.id);
        return res.status(401).json({ message: "User not found" });
      }

      console.log("[AUTH] User loaded:", { id: user._id, role: user.role, name: user.name });
      req.user = user;
      next();
    } catch (error) {
      console.log("[AUTH] Token verification error:", error.message);
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
  } else {
    console.log("[AUTH] No authorization header");
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log("[AUTHZ] Checking role - Required:", roles, "User role:", req.user?.role);
    
    if (!req.user) {
      console.log("[AUTHZ] No user object found");
      return res.status(401).json({ message: "Unauthorized access" });
    }

    if (!roles.includes(req.user.role)) {
      console.log("[AUTHZ] Role check failed - User role not in allowed roles");
      return res.status(403).json({
        message: "Forbidden: You do not have permission to access this resource"
      });
    }
    
    console.log("[AUTHZ] Role check passed");
    next();
  };
};
