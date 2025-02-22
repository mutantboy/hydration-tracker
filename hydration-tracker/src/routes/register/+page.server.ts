import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          email: email
        }
      }
    })

    if (error) {
      return fail(400, {
        error: error.message
      })
    }

    throw redirect(303, '/dashboard')
  }
}