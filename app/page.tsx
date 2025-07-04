import { redirect } from 'next/navigation';

export default function SubEventPage({ params }: { params: { id: string; subEventId: string } }) {
  // You can use `params.id` and `params.subEventId` here if needed
  redirect('/dashboard');
}
