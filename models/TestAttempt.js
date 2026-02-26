import mongoose from "mongoose";

const AttemptSchema = new mongoose.Schema({
  studentId: String,
  studentName: String,

  total: Number,
  correct: Number,
  wrong: Number,
  attempted: Number,
  locked: Number,
  percent: Number,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Attempt ||
  mongoose.model("Attempt", AttemptSchema);