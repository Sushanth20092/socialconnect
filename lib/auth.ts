import { supabase } from "./supabaseClient"

export const signUp = async (
  email: string,
  password: string,
  username: string,
  first_name: string,
  last_name: string
) => {
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .single()

  if (existingUser) {
    return { error: { message: "Username is already taken" } }
  }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return { error }

  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([{
        id: data.user.id,
        username: username.toLowerCase(),
        email: data.user.email,
        first_name,
        last_name,
        updated_at: new Date().toISOString(),
      }])

    if (profileError) return { error: profileError }
  }

  return { data }
}

export const signIn = async (identifier: string, password: string) => {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
  let email = identifier

  if (!isEmail) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", identifier.toLowerCase())
      .single()

    if (profileError || !profile) {
      return { error: { message: "No account found with that username" } }
    }

    email = profile.email
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error }

  if (data.user) {
    await supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", data.user.id)
  }

  return { data }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}