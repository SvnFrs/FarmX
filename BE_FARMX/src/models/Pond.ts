import { Schema, model, Document, Types } from "mongoose";

export interface IPond extends Document {
  _id: Types.ObjectId;
  name: string;
  farm: Types.ObjectId;
  area?: number;
  status: "active" | "inactive" | "maintenance";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PondSchema = new Schema<IPond>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    farm: {
      type: Schema.Types.ObjectId,
      ref: "Farm",
      required: true,
    },
    area: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
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
PondSchema.index({ farm: 1 });
PondSchema.index({ farm: 1, createdAt: -1 });
PondSchema.index({ isActive: 1 });

export default model<IPond>("Pond", PondSchema);
