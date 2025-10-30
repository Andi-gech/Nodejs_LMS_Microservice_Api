import mongoose, { Schema, Document } from "mongoose";

/**
 * @openapi
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           example: "Acme University"
 *         email:
 *           type: string
 *           example: "admin@acme.edu"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         address:
 *           type: string
 *           example: "123 Main St, City, Country"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-03T12:00:00.000Z"
 */

export interface TenantDocument extends Document {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
}

const TenantSchema = new Schema<TenantDocument>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const TenantModel = mongoose.model<TenantDocument>(
  "Tenant",
  TenantSchema
);
