// app/api/redis/route.ts (or in your main app initialization)
import { NextRequest, NextResponse } from "next/server";
import RedisClient from "@/lib/redis";
import { sessionMonitor } from "@/lib/sessionMonitor";

export async function GET(req: NextRequest) {
  try {
    // Test Redis connection
    const redisConnected = await RedisClient.testConnection();
    
    // Start session monitor
    sessionMonitor.start();
    
    // Get initial stats
    const stats = await sessionMonitor.getStats();
    
    return NextResponse.json({
      redis: redisConnected ? "connected" : "disconnected",
      sessionMonitor: "running",
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Initialization failed", details: error },
      { status: 500 }
    );
  }
}