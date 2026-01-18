import { redirect } from 'next/navigation'

// Redirect /lobby to the main lobby page
export default function MainPage() {
  redirect('/lobby')
}
