import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["citizen", "admin", "crew"],
      default: "citizen",
    },
    active: { type: Boolean, default: true },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
    otpAttempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
