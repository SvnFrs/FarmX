import { Schema, model, Document, Types } from "mongoose";

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  plan: "free" | "premium" | "enterprise";
  status: "active" | "cancelled" | "expired" | "pending";
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  price: number;
  currency: string;
  paymentHistory: Array<{
    date: Date;
    amount: number;
    transactionId?: string;
    status: "success" | "failed" | "pending";
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ["free", "premium", "enterprise"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "pending"],
      default: "active",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        amount: {
          type: Number,
          required: true,
        },
        transactionId: {
          type: String,
        },
        status: {
          type: String,
          enum: ["success", "failed", "pending"],
          default: "pending",
        },
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
SubscriptionSchema.index({ user: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ plan: 1 });
SubscriptionSchema.index({ isActive: 1 });

export default model<ISubscription>("Subscription", SubscriptionSchema);

