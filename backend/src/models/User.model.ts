import mongoose, { Document, Model, Schema } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true
    }
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const user = ret as unknown as Record<string, unknown>;

    delete user.passwordHash;
    delete user.__v;

    return ret;
  }
});

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', userSchema);
