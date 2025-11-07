import { Schema, model, Document, Types } from "mongoose";

export interface IScanResult extends Document {
  _id: Types.ObjectId;
  pond?: Types.ObjectId;
  deviceId?: string;
  healthScore?: number;
  diseasePrediction?: {
    disease?: string;
    confidence?: number;
    recommendations?: string[];
  };
  metrics: Record<string, number | string>;
  rawData?: any;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScanResultSchema = new Schema<IScanResult>(
  {
    pond: {
      type: Schema.Types.ObjectId,
      ref: "Pond",
    },
    deviceId: {
      type: String,
      trim: true,
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    diseasePrediction: {
      disease: {
        type: String,
        trim: true,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
      },
      recommendations: [
        {
          type: String,
        },
      ],
    },
    metrics: {
      type: Schema.Types.Mixed,
      required: true,
    },
    rawData: {
      type: Schema.Types.Mixed,
    },
    imageUrl: {
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

// Indexes for faster analytics queries
ScanResultSchema.index({ pond: 1, createdAt: -1 });
ScanResultSchema.index({ pond: 1, createdAt: 1 });
ScanResultSchema.index({ isActive: 1 });

export default model<IScanResult>("ScanResult", ScanResultSchema);
