import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        authenticated: false, 
        error: "No userId found",
        headers: Object.fromEntries(
          Object.entries(request.headers).filter(([key]) => 
            key.toLowerCase().includes('clerk') || 
            key.toLowerCase().includes('cookie')
          )
        )
      }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      userId,
      message: "Successfully authenticated"
    });
  } catch (error) {
    console.error("Error in simple-auth debug:", error);
    return NextResponse.json({ 
      error: String(error),
      authenticated: false 
    }, { status: 500 });
  }
} 