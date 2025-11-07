import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  password: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role: "user" | "admin" | "expert";
  subLevel: number;
  cart?: {
    items: Array<{
      product: Types.ObjectId;
      qty: number;
    }>;
  };
  ownedProducts?: Types.ObjectId[];
  subscription?: Types.ObjectId;
  refreshToken?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "expert"],
      default: "user",
    },
    subLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    cart: {
      items: [
        {
          product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
          },
          qty: {
            type: Number,
            default: 1,
            min: 1,
          },
        },
      ],
    },
    ownedProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
    },
    refreshToken: {
      type: String,
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
UserSchema.index({ username: 1 });
UserSchema.index({ isActive: 1 });

export default model<IUser>("User", UserSchema);
