import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const ToggleSchema = z.object({
  habit_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
  is_completed: z.boolean()
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = ToggleSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error }, { status: 400 });
    }

    const { habit_id, date, is_completed } = parsed.data;

    // Execute Atomic Transaction via Supabase RPC
    const { data, error } = await supabase.rpc('toggle_habit_completion', {
      p_user_id: session.user.id,
      p_habit_id: habit_id,
      p_date: date,
      p_is_completed: is_completed
    });

    if (error) throw error;

    return NextResponse.json({ success: true, updated_stats: data }, { status: 200 });

  } catch (error) {
    console.error('[TOGGLE_API_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}