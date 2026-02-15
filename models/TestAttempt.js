import mongoose from "mongoose";

const TestAttemptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    required: true,
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  answers: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      selectedOption: String,
      correctAnswer: String,
      questionText: String,
      status: String, // correct | wrong | unanswered
    },
  ],
  score: Number,
  correct: Number,
  wrong: Number,
  unanswered: Number,
  totalQuestions: Number,
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.TestAttempt ||
  mongoose.model("TestAttempt", TestAttemptSchema);
