import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface IJobLogEntry {
  timestamp: Date;
  message: string;
}

export interface IJob {
  userId: Types.ObjectId;
  jobName: string;
  script: string;
  cpus: number;
  memoryGb: number;
  gpus: number;
  estimatedRuntimeSeconds: number;
  status: JobStatus;
  slurmJobId: string;
  assignedNodeId?: Types.ObjectId;
  submittedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  logs: IJobLogEntry[];
  output?: string;
  errorMessage?: string;
}

export interface IJobDocument extends IJob, Document {
  createdAt: Date;
  updatedAt: Date;
}

const jobLogSchema = new Schema<IJobLogEntry>(
  {
    timestamp: { type: Date, default: Date.now },
    message: { type: String, required: true }
  },
  { _id: false }
);

const jobSchema = new Schema<IJobDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    jobName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    script: {
      type: String,
      required: true,
      maxlength: 10000
    },
    cpus: {
      type: Number,
      required: true,
      min: 1,
      max: 256
    },
    memoryGb: {
      type: Number,
      required: true,
      min: 1,
      max: 2048
    },
    gpus: {
      type: Number,
      required: true,
      min: 0,
      max: 16,
      default: 0
    },
    estimatedRuntimeSeconds: {
      type: Number,
      required: true,
      min: 5,
      max: 86400
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true
    },
    slurmJobId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    assignedNodeId: {
      type: Schema.Types.ObjectId,
      ref: 'Node'
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    startedAt: Date,
    completedAt: Date,
    logs: {
      type: [jobLogSchema],
      default: []
    },
    output: String,
    errorMessage: String
  },
  { timestamps: true }
);

jobSchema.index({ userId: 1, status: 1 });
jobSchema.index({ submittedAt: -1 });

export const Job: Model<IJobDocument> = mongoose.model<IJobDocument>('Job', jobSchema);
