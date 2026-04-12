// src/models/Project.model.js
import mongoose from 'mongoose';
const s = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, required: true, unique: true, uppercase: true },
  description: { type: String, trim: true },
  projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  members:     [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: { type: String, default: 'Member' }, assignedAt: { type: Date, default: Date.now } }],
  startDate:   { type: Date, required: true },
  deadline:    { type: Date },
  status:      { type: String, enum: ['Planning','Active','On Hold','Completed','Cancelled'], default: 'Planning' },
  priority:    { type: String, enum: ['Low','Medium','High','Critical'], default: 'Medium' },
  completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true } });
s.virtual('teamSize').get(function () { return this.members?.length ?? 0; });
s.virtual('isOverdue').get(function () { return this.deadline && this.status !== 'Completed' && new Date() > new Date(this.deadline); });
export default mongoose.model('Project', s);
