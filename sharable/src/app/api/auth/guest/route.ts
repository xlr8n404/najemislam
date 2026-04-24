import { NextResponse } from 'next/server';

// Guest mode has been deprecated
export async function POST() {
  return NextResponse.json(
    { error: 'Guest mode has been disabled. Please log in or create an account.' },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Guest mode has been disabled.' },
    { status: 403 }
  );
}
