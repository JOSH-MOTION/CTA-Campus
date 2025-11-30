// src/models/RoadmapStatus.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRoadmapStatus extends Document {
  weekId: string; // e.g., "HTML-Week 1"
  completions: Map<string, boolean>; // { "Gen 30": true, "Gen 31": false }
  updatedAt: Date;
}

const RoadmapStatusSchema = new Schema<IRoadmapStatus>({
  weekId: { type: String, required: true, unique: true, index: true },
  completions: { 
    type: Map, 
    of: Boolean,
    default: new Map() 
  },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.RoadmapStatus || 
  mongoose.model<IRoadmapStatus>('RoadmapStatus', RoadmapStatusSchema);