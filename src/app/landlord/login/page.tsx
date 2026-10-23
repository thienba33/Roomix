import { redirect } from 'next/navigation';

// Keep bookmarked URLs working while using a single login form.
export default function LandlordLoginPage() {
  redirect('/login?role=landlord');
}
