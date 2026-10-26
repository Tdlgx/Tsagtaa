"use client";

import { CircleAlert, Eye, EyeOff, MailCheck } from "lucide-react";
import { useActionState, useState, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction, type LoginState } from "@/features/auth/actions";
import { useT } from "@/i18n/client";

const INITIAL: LoginState = { error: null, login: "", codeFor: null };

/**
 * Утсаар нууц үгээр нэвтэрнэ; имэйлд оронд нь 6 оронтой код ирнэ.
 * Server Action-тэй энгийн <form> тул JavaScript ачаалагдахаас өмнө ч ажиллана
 * (тэр үед нууц үгийн талбар үлдэх ба имэйл бол үл тоомсорлогдоно). Амжилттай
 * болбол action redirect хийнэ.
 */
export function LoginForm({ next }: { next: string }): JSX.Element {
  const t = useT();
  const words = t.auth;
  const [state, action, pending] = useActionState(loginAction, INITIAL);
  const [visible, setVisible] = useState(false);
  // Бичих явцыг дагана; тэр болтол талбарт дахин бөглөгдсөн утгаас хамаарна.
  const [typedEmail, setIsEmail] = useState<boolean | null>(null);
  const isEmail = typedEmail ?? state.login.includes("@");

  const alert = state.error ? (
    <p
      role="alert"
      className="flex animate-in items-start gap-2.5 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger-foreground duration-250 fade-in"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {words.errors[state.error]}
    </p>
  ) : null;

  if (state.codeFor) {
    return (
      <form action={action} className="mt-8 flex flex-col gap-4" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <input type="hidden" name="login" value={state.login} />
        <input type="hidden" name="codeFor" value={state.codeFor} />
        <p className="flex items-start gap-2.5 rounded-md bg-surface-muted px-4 py-3 text-sm text-foreground">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-primary-strong" />
          <span>{words.codeSent(state.codeFor)}</span>
        </p>
        {alert}
        <Field>
          <Label htmlFor="login-code">{words.code}</Label>
          <Input
            // Шинэ хариу (дахин илгээх, буруу код) ирэхэд талбар хоосорно.
            key={JSON.stringify(state)}
            id="login-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            placeholder="123456"
            autoFocus
            required
            className="text-lg tracking-[0.3em] tabular-nums"
          />
        </Field>
        {/* Маягтын эхэнд байгаа тул кодын талбарт Enter дарахад нэвтэрнэ. */}
        <Button type="submit" name="intent" value="verify" size="lg" loading={pending}>
          {words.submit}
        </Button>
        <div className="flex flex-wrap justify-between gap-2">
          <Button type="submit" name="intent" value="resend" variant="ghost" size="sm">
            {words.resend}
          </Button>
          <Button type="submit" name="intent" value="back" variant="ghost" size="sm">
            {words.otherLogin}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {alert}
      <Field>
        <Label htmlFor="login-id">{words.login}</Label>
        {/* Tel биш text: утасны тоон гар дээр имэйлийн "@" тэмдэг байдаггүй. */}
        <Input
          id="login-id"
          name="login"
          type="text"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={state.login}
          onChange={(event) => setIsEmail(event.target.value.includes("@"))}
          placeholder={words.loginPlaceholder}
          maxLength={120}
          required
          className="tabular-nums"
        />
        {isEmail ? <FieldHint className="text-xs">{words.emailHint}</FieldHint> : null}
      </Field>
      {isEmail ? null : (
        <Field>
          <Label htmlFor="login-password">{words.password}</Label>
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setVisible((shown) => !shown)}
              aria-label={visible ? words.hide : words.show}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground"
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
      )}
      <Button type="submit" size="lg" loading={pending} className="mt-2">
        {isEmail ? words.getCode : words.submit}
      </Button>
    </form>
  );
}
