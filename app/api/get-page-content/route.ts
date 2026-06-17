
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET() {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    // This policy number is for testing purposes only and should exist in your development database
    await page.goto('http://localhost:3000/order/details?number=P-961031376', { waitUntil: 'networkidle0' });
    const content = await page.content();
    await browser.close();
    
    return new NextResponse(content, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error fetching page content:', error);
    return new NextResponse('Error fetching page content', { status: 500 });
  }
}
