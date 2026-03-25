import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center -ml-64">
      <SignUp />
    </div>
  );
}
