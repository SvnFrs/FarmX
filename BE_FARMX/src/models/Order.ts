import { Schema, model, Document, Types } from "mongoose";

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: Array<{
    product: Types.ObjectId;
    qty: number;
    priceAtPurchase: number;
  }>;
  total: number;
  status: "pending" | "completed" | "cancelled";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        qty: {
          type: Number,
          required: true,
          min: 1,
        },
        priceAtPurchase: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
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
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ isActive: 1 });

export default model<IOrder>("Order", OrderSchema);
