import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  const redirectUrl = new URL('/callback/github', req.url);
  if (code) redirectUrl.searchParams.set('code', code);
  if (error) redirectUrl.searchParams.set('error', error);
  if (error_description) redirectUrl.searchParams.set('error_description', error_description);

  return NextResponse.redirect(redirectUrl);
}
