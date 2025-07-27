import { NextRequest, NextResponse } from "next/server";
import { migrateExistingUsers } from "@/lib/clerk-billing";

export async function POST(req: NextRequest) {
  try {
    console.log('Starting user migration...');
    await migrateExistingUsers();
    
    return NextResponse.json({
      success: true,
      message: 'All users have been migrated to the new schema and synced with Clerk billing'
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to run the migration',
    description: 'This endpoint migrates existing users to align with Clerk billing system'
  });
} 