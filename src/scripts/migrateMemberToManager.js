import mongoose from "mongoose";
import dotenv from "dotenv";
import Agent from "../models/AgentModel/AgentModel.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");

  // Copy member -> manager
  const res1 = await Agent.updateMany(
    { member: { $exists: true } },
    [
      {
        $set: {
          manager: "$member"
        }
      }
    ]
  );
  console.log("Set manager from member:", res1.modifiedCount);

  // Remove member field
  const res2 = await Agent.updateMany(
    { member: { $exists: true } },
    { $unset: { member: "" } }
  );
  console.log("Unset member:", res2.modifiedCount);

  // Remove managerId field
  const res3 = await Agent.updateMany(
    { managerId: { $exists: true } },
    { $unset: { manager: "" } }
  );
  console.log("Unset member:", res3.modifiedCount);

  await mongoose.disconnect();
  console.log("Done");
}

run().catch(console.error);