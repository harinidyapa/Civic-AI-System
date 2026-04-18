import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);
const OTP_EXPIRE_MINUTES = Number(process.env.OTP_EXPIRE_MINUTES || 10);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);

const generateOtp = () => {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < OTP_LENGTH; i++) code += digits[Math.floor(Math.random() * digits.length)];
  return code;
};

const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendOtpEmail = async (email, otp) => {
  const transporter = await createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@civicaiproject.local",
    to: email,
    subject: "Your CivicAI System OTP code",
    text: `Your OTP code is ${otp}. It expires in ${OTP_EXPIRE_MINUTES} minutes.`,
    html: `<p>Your OTP code is <strong>${otp}</strong>. It expires in ${OTP_EXPIRE_MINUTES} minutes.</p>`,
  };

  const info = await transporter.sendMail(mailOptions);
  if (process.env.NODE_ENV !== "production") {
    console.info("OTP email sent:", nodemailer.getTestMessageUrl(info));
  }
};

const findByIdentifier = async (identifier) => {
  if (!identifier) return null;
  const query = { $or: [{ email: identifier }, { name: identifier }] };
  return User.findOne(query);
};

const verifyOtpCommon = async (user, otp) => {
  if (!user.otpCode || !user.otpExpiresAt) {
    throw { status: 400, message: "No OTP requested. Please request a new OTP." };
  }

  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();
    throw { status: 429, message: "Too many attempts. Request a new OTP." };
  }

  if (user.otpExpiresAt < new Date()) {
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();
    throw { status: 400, message: "OTP expired. Please request a new OTP." };
  }

  if (user.otpCode !== otp) {
    user.otpAttempts += 1;
    await user.save();
    throw { status: 401, message: "Invalid OTP" };
  }

  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
  await user.save();
};

const createJwtToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.active) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otpCode = generateOtp();
    const hashedPassword = await bcrypt.hash(password, 10);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000);

    let user;

    if (existingUser) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = role || existingUser.role || "citizen";
      existingUser.active = false;
      existingUser.otpCode = otpCode;
      existingUser.otpExpiresAt = otpExpiry;
      existingUser.otpAttempts = 0;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || "citizen",
        active: false,
        otpCode,
        otpExpiresAt: otpExpiry,
        otpAttempts: 0,
      });
    }

    await sendOtpEmail(email, otpCode);
    res.status(200).json({ message: "OTP sent to your email. Verify to complete registration." });
  } catch (error) {
    next(error);
  }
};

export const verifyRegistrationOtp = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ message: "Identifier and OTP are required" });
    }

    const user = await findByIdentifier(identifier);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.active) return res.status(400).json({ message: "User already verified" });

    await verifyOtpCommon(user, otp);

    user.active = true;
    await user.save();

    const token = createJwtToken(user);
    res.status(200).json({ token, role: user.role, name: user.name });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/username and password are required" });
    }

    const user = await findByIdentifier(identifier);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.active) return res.status(403).json({ message: "Account is not verified. Please complete OTP registration." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = createJwtToken(user);
    res.status(200).json({ token, role: user.role, name: user.name });
  } catch (error) {
    next(error);
  }
};

export const requestOtp = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: "Email/username is required" });

    const user = await findByIdentifier(identifier);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.active) return res.status(403).json({ message: "Account is not verified. Please complete registration OTP first." });

    const otpCode = generateOtp();
    user.otpCode = otpCode;
    user.otpAttempts = 0;
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000);
    await user.save();

    await sendOtpEmail(user.email, otpCode);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) return res.status(400).json({ message: "Email/username and OTP are required" });

    const user = await findByIdentifier(identifier);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.active) return res.status(403).json({ message: "Account is not verified. Please complete registration OTP first." });

    await verifyOtpCommon(user, otp);

    const token = createJwtToken(user);
    res.status(200).json({ token, role: user.role, name: user.name });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: "Email/username is required" });

    const user = await findByIdentifier(identifier);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.active) return res.status(403).json({ message: "Account is not verified." });

    const otpCode = generateOtp();
    user.otpCode = otpCode;
    user.otpAttempts = 0;
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000);
    await user.save();

    await sendOtpEmail(user.email, otpCode);
    res.status(200).json({ message: "Password reset OTP sent to your email" });
  } catch (error) {
    next(error);
  }
};

export const verifyPasswordReset = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: "Identifier, OTP and new password are required" });
    }

    const user = await findByIdentifier(identifier);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.active) return res.status(403).json({ message: "Account is not verified." });

    await verifyOtpCommon(user, otp);

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully. You can now log in with your new password." });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name.trim();
    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

