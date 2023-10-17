import { NextResponse } from 'next/server';
import axios from 'axios';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';


interface PostData {
  address: string;
  description: string;
}


export async function POST(req: Request) {
  // TODO store root dir as an env var somewhere
  const db = await open({
    filename: '/Users/lilyjordan/Projects/impact-dac/DAC.db',
    driver: sqlite3.Database
  });

  const data: PostData = await req.json();
  
  try {
    await db.run('INSERT INTO contracts (address, description) VALUES (?, ?)', [data.address, data.description]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.log('\n', err, '\n');
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 } );
  }
}