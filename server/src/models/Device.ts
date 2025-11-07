import { Schema, model, Document, Types } from "mongoose";

export interface IDevice extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  type: "camera" | "feeder" | "sensor" | "monitor";
  deviceModel?: string;
  serialNumber?: string;
  status: "online" | "offline" | "maintenance";
  farm?: Types.ObjectId;
  pond?: Types.ObjectId;
  settings?: {
    schedule?: any;
    autoFeed?: boolean;
    feedSchedule?: Array<{
      time: string;
      amount: number;
    }>;
    [key: string]: any;
  };
  lastSeen?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["camera", "feeder", "sensor", "monitor"],
      required: true,
    },
    deviceModel: {
      type: String,
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["online", "offline", "maintenance"],
      default: "offline",
    },
    farm: {
      type: Schema.Types.ObjectId,
      ref: "Farm",
    },
    pond: {
      type: Schema.Types.ObjectId,
      ref: "Pond",
    },
    settings: {
      type: Schema.Types.Mixed,
    },
    lastSeen: {
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
DeviceSchema.index({ user: 1, status: 1 });
DeviceSchema.index({ farm: 1 });
DeviceSchema.index({ pond: 1 });
DeviceSchema.index({ serialNumber: 1 });
DeviceSchema.index({ isActive: 1 });

export default model<IDevice>("Device", DeviceSchema);

