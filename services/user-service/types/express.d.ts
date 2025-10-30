import mongoose from "mongoose";

declare global {
  namespace Express {
    interface Request {
      db?: mongoose.Connection;
    }
  }
}
