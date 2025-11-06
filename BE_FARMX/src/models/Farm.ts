import { Schema, model, Document, Types } from "mongoose";

export interface IFarm extends Document {
  _id: Types.ObjectId;
  name: string;
  location?: string;
  owner?: Types.ObjectId;
  status: "active" | "inactive" | "archived";
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FarmSchema = new Schema<IFarm>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
    description: {
      type: String,
      trim: true,
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

// Index for faster queries
FarmSchema.index({ owner: 1 });
FarmSchema.index({ isActive: 1 });

export default model<IFarm>("Farm", FarmSchema);
