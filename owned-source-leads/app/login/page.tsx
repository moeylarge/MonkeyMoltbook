import { loginAction } from './actions';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  return (
    <div className="panel" style={{ maxWidth: 480, margin: '40px auto' }}>
      <div className="h2">Admin Access</div>
      <p className="muted">Enter the admin password to access the lead system.</p>
      {params.error ? <div className="badge junk">Invalid password</div> : null}
      <form action={loginAction} className="grid" style={{ marginTop: 16 }}>
        <input type="hidden" name="next" value={params.next || '/'} />
        <input className="input" type="password" name="password" placeholder="Password" required />
        <button className="button" type="submit">Login</button>
      </form>
    </div>
  );
}
