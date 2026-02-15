import mongoose from "mongoose";

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  totalQuestions: {
    type: Number,
    default: 30,
  },
  duration: {
    type: Number,
    default: 30, // minutes
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Test ||
  mongoose.model("Test", TestSchema);
