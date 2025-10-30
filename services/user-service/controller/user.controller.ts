import { Request, Response } from "express";
import mongoose from "mongoose";
import KeycloakAdminClient from "@keycloak/keycloak-admin-client";
import axios from "axios";
import { UserSchema } from "../model/user.model";
import { getModel } from "../model/modelFactory";
import { sendMessage } from "../producer/kafkaProducer";
import { defaultUserTopic } from "../config/kafkaConfig";
import {
  validateUserRegister,
  validateUserAuth,
} from "../validation/user.validation";

const kcAdmin = new KeycloakAdminClient({
  baseUrl: process.env.KEYCLOAK_URL!,
  realmName: process.env.KEYCLOAK_REALM!,
});
console.log("Keycloak Admin URL:", process.env.KEYCLOAK_URL);
console.log("Keycloak Realm:", process.env.KEYCLOAK_REALM);
console.log(process.env.KEYCLOAK_REALM, "ss");
console.log("Keycloak Realm:", process.env.KEYCLOAK_REALM);
console.log("Keycloak Admin Client ID:", process.env.KEYCLOAK_ADMIN_CLIENT_ID);

console.log(
  "Keycloak Admin Client Secret:",
  process.env.KEYCLOAK_ADMIN_CLIENT_SECRET
);
const initKeycloak = async () => {
  console.log(process.env.KEYCLOAK_REALM, "ss");
  console.log("Keycloak Realm:", process.env.KEYCLOAK_REALM);
  console.log(
    "Keycloak Admin Client ID:",
    process.env.KEYCLOAK_ADMIN_CLIENT_ID
  );

  console.log(
    "Keycloak Admin Client Secret:",
    process.env.KEYCLOAK_ADMIN_CLIENT_SECRET
  );
  await kcAdmin.auth({
    clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
    clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET!,
    grantType: "client_credentials",
  });
};

export const registerUser = async (req: Request, res: Response) => {
  const { error } = validateUserRegister(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  if (!req.db) return res.status(500).send("Database not initialized");
  const User = getModel(req.db, "User", UserSchema);
  const session = await req.db.startSession();
  session.startTransaction();

  try {
    const existing = await User.findOne({ email: req.body.email }).session(
      session
    );
    if (existing) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Email already registered" });
    }

    await initKeycloak();

    const kcUser = await kcAdmin.users.create({
      username: req.body.email,
      email: req.body.email,
      enabled: true,
      firstName: req.body.fullName,
      credentials: [
        { type: "password", value: req.body.password, temporary: false },
      ],
      requiredActions: ["VERIFY_EMAIL"], // ← Key part
    });

    // Assign user to a Keycloak group (e.g., "students")
    const groups = await kcAdmin.groups.find();
    const studentGroup = groups.find((g) => g.name === "students");
    if (!studentGroup)
      throw new Error("Group 'students' does not exist in Keycloak");
    await kcAdmin.users.addToGroup({
      id: kcUser.id,
      groupId: studentGroup.id || "",
    });

    const createdUser = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      role: "student",
      department:
        req.body.department &&
        mongoose.Types.ObjectId.isValid(req.body.department)
          ? new mongoose.Types.ObjectId(req.body.department)
          : null,
      profilepic: req.body.profilepic || "",
      keycloakId: kcUser.id,
    });
    await kcAdmin.users.sendVerifyEmail({ id: kcUser.id });

    await createdUser.save({ session });
    await session.commitTransaction();

    (async () => {
      try {
        const tenantId = (req.headers["x-tenant-id"] as string) || null;
        const payload = {
          event: "user.created",
          tenantId,
          user: {
            id: createdUser._id.toString(),
            email: createdUser.email,
            fullName: createdUser.fullName,
            role: createdUser.role,
            keycloakId: createdUser.keycloakId,
          },
          createdAt: new Date().toISOString(),
        };
        await sendMessage(defaultUserTopic, payload);
      } catch (err) {
        console.error("Failed to publish user.created event:", err);
      }
    })();

    res.status(201).json({ user: createdUser.toObject() });
  } catch (err: any) {
    await session.abortTransaction();
    if (err?.kcUserId) {
      try {
        await kcAdmin.users.del({ id: err.kcUserId });
      } catch {}
    }
    console.error("Error during user registration:", err);
    res
      .status(500)
      .json({ error: "Registration failed", details: err.message });
  } finally {
    session.endSession();
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { error } = validateUserAuth(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const tokenUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
    const params = new URLSearchParams();
    params.append("grant_type", "password");
    params.append("client_id", process.env.USER_CLIENT_ID!);
    if (process.env.USER_CLIENT_SECRET)
      params.append("client_secret", process.env.USER_CLIENT_SECRET!);
    params.append("username", req.body.email);
    params.append("password", req.body.password);

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (!response.data.email_verified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    res.status(200).json({ token: response.data });
  } catch (err: any) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
};

export const socialLogin = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token is required" });

  try {
    const userInfoUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
    const response = await axios.get(userInfoUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const kcUser = response.data;
    if (!kcUser.sub) return res.status(400).json({ error: "Invalid token" });

    if (!req.db) return res.status(500).send("Database not initialized");
    const User = getModel(req.db, "User", UserSchema);

    let appUser = await User.findOne({ keycloakId: kcUser.sub });
    if (!appUser) {
      appUser = new User({
        keycloakId: kcUser.sub,
        fullName: kcUser.name || "",
        email: kcUser.email || "",
        role: kcUser.role || "student",
        profilepic: kcUser.picture || "",
      });
      await appUser.save();
    }

    res.status(200).json({ user: appUser.toObject() });
  } catch (err: any) {
    res.status(500).json({
      error: "Social login failed",
      details: err.response?.data || err.message,
    });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  if (!req.db) return res.status(500).send("Database not initialized");
  const User = getModel(req.db, "User", UserSchema);
  const filter: any = {};
  // optional ?department=<id>
  if (
    req.query.department &&
    mongoose.Types.ObjectId.isValid(String(req.query.department))
  ) {
    filter.department = new mongoose.Types.ObjectId(
      String(req.query.department)
    );
  }
  const users = await User.find(filter).select("-password");
  res.status(200).json(users);
};

export const getUserById = async (req: Request, res: Response) => {
  if (!req.db) return res.status(500).send("Database not initialized");
  const User = getModel(req.db, "User", UserSchema);
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json(user);
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.db) return res.status(500).send("Database not initialized");
  const userPayload = (req as any).user;
  if (!userPayload || !userPayload.sub)
    return res.status(401).send("Unauthorized");
  const User = getModel(req.db, "User", UserSchema);
  const user = await User.findOne({ keycloakId: userPayload.sub }).select(
    "-password"
  );
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json(user);
};

export const updateMe = async (req: Request, res: Response) => {
  if (!req.db) return res.status(500).send("Database not initialized");
  const userPayload = (req as any).user;
  if (!userPayload || !userPayload.sub)
    return res.status(401).send("Unauthorized");
  const User = getModel(req.db, "User", UserSchema);
  const user = await User.findOneAndUpdate(
    { keycloakId: userPayload.sub },
    req.body,
    { new: true }
  ).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json(user);
};

export const changePassword = async (req: Request, res: Response) => {
  // This service delegates auth to Keycloak; changing password should call Keycloak token endpoint.
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res
      .status(400)
      .json({ error: "currentPassword and newPassword are required" });
  const userPayload = (req as any).user;
  if (!userPayload || !userPayload.sub)
    return res.status(401).send("Unauthorized");
  try {
    // Use Keycloak Admin API to reset password for the user
    await initKeycloak();
    // Find Keycloak user by id (sub)
    const kcUsers = await kcAdmin.users.find({ id: userPayload.sub });
    const kcUser = kcUsers && kcUsers[0] ? kcUsers[0] : null;
    if (!kcUser)
      return res
        .status(404)
        .json({ error: "User not found in identity provider" });
    await kcAdmin.users.resetPassword({
      id: userPayload.sub,
      credential: { type: "password", value: newPassword, temporary: false },
    });
    return res.status(200).json({ changed: true });
  } catch (err: any) {
    console.error("Password change failed:", err);
    return res
      .status(500)
      .json({ error: "Password change failed", details: err.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  if (!req.db) return res.status(500).send("Database not initialized");
  const User = getModel(req.db, "User", UserSchema);
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json(user);
};

export const deleteUser = async (req: Request, res: Response) => {
  if (!req.db) return res.status(500).send("Database not initialized");
  const User = getModel(req.db, "User", UserSchema);
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json({ message: "User deleted" });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Token required");

  try {
    await axios.get(
      `${process.env.KEYCLOAK_URL}/realms/mine/login-actions/action-token`,
      {
        params: { key: token },
      }
    );
    res.status(200).send("Email verified successfully");
  } catch (err) {
    res.status(400).send("Invalid or expired token");
  }
};

export const getTeachers = async (req: Request, res: Response) => {
  if (!req.db) return res.status(500).send("Database not initialized");
  const User = getModel(req.db, "User", UserSchema);
  const filter: any = { role: "teacher" };
  if (
    req.query.department &&
    mongoose.Types.ObjectId.isValid(String(req.query.department))
  ) {
    filter.department = new mongoose.Types.ObjectId(
      String(req.query.department)
    );
  }
  // sort by averageRating if virtual exists
  const teachers = await User.find(filter).select("-password");
  res.status(200).json(teachers);
};

export const getStudents = async (req: Request, res: Response) => {
  if (!req.db) return res.status(500).send("Database not initialized");
  const User = getModel(req.db, "User", UserSchema);
  const filter: any = { role: "student" };
  if (
    req.query.department &&
    mongoose.Types.ObjectId.isValid(String(req.query.department))
  ) {
    filter.department = new mongoose.Types.ObjectId(
      String(req.query.department)
    );
  }
  const students = await User.find(filter).select("-password");
  res.status(200).json(students);
};

export const rateUser = async (req: Request, res: Response) => {
  if (!req.db) return res.status(500).send("Database not initialized");
  const { rate } = req.body;
  if (rate == null || isNaN(Number(rate)))
    return res
      .status(400)
      .json({ error: "rate is required and must be a number" });
  const User = getModel(req.db, "User", UserSchema);
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });
  const r = { rate: Number(rate), user: (req as any).user?.sub || null };
  target.rating = target.rating || [];
  target.rating.push(r as any);
  await target.save();
  res.status(200).json({ ok: true, rating: target.rating });
};
