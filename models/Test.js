import mongoose from "mongoose";

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  duration: {
    type: Number,
    default: 30,
  },

  startTime: {
    type: Date,
    required: true,
  },

  endTime: {
    type: Date,
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Test ||
  mongoose.model("Test", TestSchema);