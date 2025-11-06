import { Schema, model, Document, Types } from "mongoose";

export interface IAlert extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: "health" | "weather" | "device" | "system";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  relatedFarm?: Types.ObjectId;
  relatedPond?: Types.ObjectId;
  relatedDevice?: Types.ObjectId;
  resolved: boolean;
  resolvedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["health", "weather", "device", "system"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedFarm: {
      type: Schema.Types.ObjectId,
      ref: "Farm",
    },
    relatedPond: {
      type: Schema.Types.ObjectId,
      ref: "Pond",
    },
    relatedDevice: {
      type: Schema.Types.ObjectId,
      ref: "Device",
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
AlertSchema.index({ user: 1, resolved: 1, createdAt: -1 });
AlertSchema.index({ user: 1, type: 1 });
AlertSchema.index({ relatedFarm: 1 });
AlertSchema.index({ relatedPond: 1 });
AlertSchema.index({ isActive: 1 });

export default model<IAlert>("Alert", AlertSchema);

