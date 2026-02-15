const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://prabhaspuli152_db_user:9391487676@cluster0.cctdwoi.mongodb.net/?appName=Cluster0");

async function createTest() {
  await mongoose.connection.collection("tests").insertOne({
    title: "Technical Assessment 2026",
    totalQuestions: 30,
    duration: 30,
    createdAt: new Date(),
  });

  console.log("Test created");
  process.exit();
}

createTest();
