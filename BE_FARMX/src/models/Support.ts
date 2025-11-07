import { Schema, model, Document, Types } from "mongoose";

export interface ISupport extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: "question" | "issue" | "feature_request";
  subject: string;
  message: string;
  status: "open" | "answered" | "closed";
  priority: "low" | "medium" | "high";
  expertResponse?: string;
  expertId?: Types.ObjectId;
  relatedFarm?: Types.ObjectId;
  relatedPond?: Types.ObjectId;
  attachments?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupportSchema = new Schema<ISupport>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["question", "issue", "feature_request"],
      default: "question",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "answered", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    expertResponse: {
      type: String,
    },
    expertId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    relatedFarm: {
      type: Schema.Types.ObjectId,
      ref: "Farm",
    },
    relatedPond: {
      type: Schema.Types.ObjectId,
      ref: "Pond",
    },
    attachments: [
      {
        type: String,
      },
    ],
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
SupportSchema.index({ user: 1, status: 1, createdAt: -1 });
SupportSchema.index({ status: 1 });
SupportSchema.index({ type: 1 });
SupportSchema.index({ isActive: 1 });

export default model<ISupport>("Support", SupportSchema);

