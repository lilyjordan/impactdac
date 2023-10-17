import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
// TODO write tests for all these functions


interface DescriptionData {
  address: string;
  description: string;
}


function validateAddress(address: string | null): string {
  if (!address) {
    throw new Error('Null address');
  }
  address = address.toLowerCase();
  if (address.length === 40) {
    address = '0x' + address;
  }
  const addressRegex = /^0x[a-f0-9]{40}$/;
  if (addressRegex.test(address)) {
    return address;
  } else {
    throw new Error('Invalid address');
  }
}


export async function GET(req: NextRequest) {
  const db = await open({
    filename: '/Users/lilyjordan/Projects/impact-dac/DAC.db',
    driver: sqlite3.Database
  });

  const address: string | null = req.nextUrl.searchParams.get('address');

  let validatedAddress: string;
  try {
    validatedAddress = validateAddress(address);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }
  
  try {
    const statement = await db.prepare('SELECT description FROM contracts WHERE address = ?');
    const result = await statement.get([validatedAddress]);
    await statement.finalize();
  if (result) {
    return NextResponse.json({ description: result.description }, { status: 200 });
  } else {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 });
  }
  } catch (err) {
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
  } finally {
    await db.close();
  }
}


export async function POST(req: NextRequest) {
  // TODO store root dir as an env var somewhere
  const db = await open({
    filename: '/Users/lilyjordan/Projects/impact-dac/DAC.db',
    driver: sqlite3.Database
  });

  const data: DescriptionData = await req.json();

  let validatedAddress: string;
  try {
    validatedAddress = validateAddress(data.address);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }
  
  try {
    await db.run('INSERT INTO contracts (address, description) VALUES (?, ?)',
      [validatedAddress, data.description]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 } );
  }
}