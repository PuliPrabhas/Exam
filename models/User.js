import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["admin", "student"], required: true },
  rollNumber: {
    type: String,
    required: function () {
      return this.role === "student";
    },
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
