// models/TestAttempt.js
import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
  questionId: { type: String, default: null },
  questionText: { type: String, default: "" },
  options: {
    A: { type: String, default: "" },
    B: { type: String, default: "" },
    C: { type: String, default: "" },
    D: { type: String, default: "" },
  },
  selectedOption: { type: String, default: null },
  correctAnswer: { type: String, default: null },
  locked: { type: Boolean, default: false },
});

const TestAttemptSchema = new mongoose.Schema(
  {
    testId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, default: "Unknown" },
    total: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    attempted: { type: Number, default: 0 },
    locked: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    cheatingDetected: { type: Boolean, default: false },
    reason: { type: String, default: null },
    answers: { type: [AnswerSchema], default: [] },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

// Prevent model overwrite issues in Next dev hot reload
export default mongoose.models.TestAttempt ||
  mongoose.model("TestAttempt", TestAttemptSchema);