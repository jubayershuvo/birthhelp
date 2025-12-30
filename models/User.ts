import { Schema, model, models, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  whatsapp?: string;
  password: string;

  isEmailVerified: boolean;
  isBanned: boolean;
  isActive: boolean;
  reseller?: Types.ObjectId;

  loginAttempts: number;

  lastLogin?: Date;
  lastSeen?: Date;
  lastLoginIp?: string;
  location?: string;
  lockUntil?: Date;

  balance: number;

  services: [
    {
      service: Types.ObjectId;
      fee: number;
    }
  ];
  postServices: [
    {
      service: Types.ObjectId;
      reseller_fee: number;
    }
  ];

  createdAt: Date;
  updatedAt: Date;

  comparePassword: (enteredPassword: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    whatsapp: { type: String, default: "" },

    avatar: { type: String, default: "" },
    password: { type: String, required: true },

    isEmailVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    services: [
      {
        service: {
          type: Schema.Types.ObjectId,
          ref: "Service",
        },
        fee: { type: Number },
      },
      { _id: false },
    ],
    postServices: [
      {
        service: {
          // FIXED: Changed from postService to service
          type: Schema.Types.ObjectId,
          ref: "PostService",
        },
        reseller_fee: { type: Number },
      },
      { _id: false },
    ],

    reseller: { type: Schema.Types.ObjectId, ref: "Reseller" },

    loginAttempts: { type: Number, default: 0 },

    lastLogin: { type: Date, default: null },
    lastSeen: { type: Date, default: null },
    lastLoginIp: { type: String, default: "" },
    location: { type: String, default: "" },
    lockUntil: { type: Date, default: null },

    balance: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

/**
 * 🔐 Hash password before saving
 */
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
});

/**
 * 🔍 Method to compare passwords
 */
UserSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Fix for Next.js hot reload
const User = models.User || model<IUser>("User", UserSchema);

export default User;
