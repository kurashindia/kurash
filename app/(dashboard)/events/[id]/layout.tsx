// Simple layout file without any client/server mixing conflicts
export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children;
}

// Hardcode event IDs from your SQL insert statements
export function generateStaticParams() {
  return [
    { id: '4409e94d-61fd-4a61-84a7-06b687d09e50' }, // Boys Under 40kg
    { id: '73947ce4-70fc-428d-b211-9f1b6e97905e' }, // Boys Under 45kg
    { id: '8d1f333e-5a72-487d-aa1c-deb03e1dcd51' }, // Girls Under 40kg
    { id: '6dfc7f04-d93c-4706-b24e-dae1b67442a2' }  // Girls Under 45kg
  ];
} 