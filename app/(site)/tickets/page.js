import ResendForm from '@/components/ResendForm';
export const metadata = { title: 'Find my tickets · TwerkDivas' };
export default function Page() { return (<><h1 className="pubh">Find my tickets</h1><p className="mute">Enter the email you used at checkout and we will send your ticket links again.</p><ResendForm /></>); }
