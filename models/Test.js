// models/Test.js
import mongoose from "mongoose";

const TestSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Scheduled Test" },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    // ✅ single source of truth
    active: { type: Boolean, default: false, index: true },

    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// ✅ only ONE active test allowed
TestSchema.index(
  { active: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);

export default mongoose.models.Test || mongoose.model("Test", TestSchema);