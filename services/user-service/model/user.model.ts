import mongoose, { Document, Schema } from "mongoose";

export interface UserDocument extends Document {
  fullName: string;
  email: string;
  role:
    | "Registrar"
    | "student"
    | "teacher"
    | "short_training_office"
    | "short_training_department"
    | "department_head"
    | "department_admin";
  department?: mongoose.Types.ObjectId | null;
  profilepic?: string;
  status?: boolean;
  rating: Array<{
    rate: number;
    user: mongoose.Types.ObjectId;
  }>;
  createdAt: Date;
  keycloakId: string;
  updatedAt: Date;
  averageRating?: number;
}

const RatingSchema = new Schema(
  {
    rate: { type: Number, min: 0, max: 5, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false }
);

export const UserSchema = new Schema<UserDocument>(
  {
    fullName: { type: String, required: true, minlength: 2, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        "Registrar",
        "student",
        "teacher",
        "short_training_office",
        "short_training_department",
        "department_head",
        "department_admin",
      ],
      default: "student",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    keycloakId: { type: String, required: true, unique: true },
    profilepic: { type: String, default: "" },
    status: { type: Boolean, default: false },
    rating: [RatingSchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

UserSchema.virtual("averageRating").get(function (this: UserDocument) {
  if (!this.rating || this.rating.length === 0) return 0;
  const total = this.rating.reduce((acc, rating) => acc + rating.rate, 0);
  return total / this.rating.length;
});
