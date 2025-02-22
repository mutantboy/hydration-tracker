import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
  const session = await getSession()

  if (!session) {
    return { hydrationEntries: [] }
  }

  const { data: hydrationEntries } = await supabase
    .from('hydration_entries')
    .select('*')
    .order('created_at', { ascending: false })

  return {
    hydrationEntries: hydrationEntries ?? []
  }
}

export const actions: Actions = {
  default: async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession()
    
    if (!session) {
      return fail(401, {
        error: 'You must be logged in to add entries'
      })
    }

    const formData = await request.formData()
    const amount = formData.get('amount')

    const { error } = await supabase
      .from('hydration_entries')
      .insert([
        {
          user_id: session.user.id,
          amount: Number(amount)
        }
      ])

    if (error) {
      return fail(500, {
        error: 'Failed to add entry'
      })
    }

    return { success: true }
  }
}