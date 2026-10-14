import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI 환경변수가 필요합니다.");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}

