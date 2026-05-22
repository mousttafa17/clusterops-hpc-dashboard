import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IAuditLog {
  actorUserId?: Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface IAuditLogDocument extends IAuditLog, Document {
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    resourceId: {
      type: String,
      trim: true,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLogDocument> = mongoose.model<IAuditLogDocument>(
  'AuditLog',
  auditLogSchema
);
