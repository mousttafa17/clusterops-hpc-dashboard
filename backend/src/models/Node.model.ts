import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type NodeStatus = 'online' | 'offline' | 'draining';

export interface INode {
  name: string;
  status: NodeStatus;
  totalCpus: number;
  availableCpus: number;
  totalMemoryGb: number;
  availableMemoryGb: number;
  totalGpus: number;
  availableGpus: number;
  currentJobs: Types.ObjectId[];
  lastHeartbeat: Date;
}

export interface INodeDocument extends INode, Document {
  createdAt: Date;
  updatedAt: Date;
}

const nodeSchema = new Schema<INodeDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'draining'],
      default: 'online',
      index: true
    },
    totalCpus: { type: Number, required: true, min: 1 },
    availableCpus: { type: Number, required: true, min: 0 },
    totalMemoryGb: { type: Number, required: true, min: 1 },
    availableMemoryGb: { type: Number, required: true, min: 0 },
    totalGpus: { type: Number, required: true, min: 0, default: 0 },
    availableGpus: { type: Number, required: true, min: 0, default: 0 },
    currentJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
    lastHeartbeat: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Node: Model<INodeDocument> = mongoose.model<INodeDocument>('Node', nodeSchema);
