import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    required: true,
  },
  questionNumber: {
    type: Number,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    A: String,
    B: String,
    C: String,
    D: String,
  },
  correctAnswer: {
    type: String,
    enum: ["A", "B", "C", "D"],
    required: true,
  },
});

export default mongoose.models.Question ||
  mongoose.model("Question", QuestionSchema);
