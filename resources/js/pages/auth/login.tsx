import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginForm = {
  email: string;
  password: string;
  remember: boolean;
};

interface LoginProps {
  status?: string;
  canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);

  const { data, setData, post, processing, errors, reset } =
    useForm<Required<LoginForm>>({
      email: '',
      password: '',
      remember: false,
    });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Head title="Login - Dental Clinic" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Back to Home */}
        <div className="mb-4">
          <TextLink
            href={route('home')}
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </TextLink>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-gray-100">
          {/* Brand header (matches Register) */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center mr-3">
                <img src="logo.png" alt="Logo" className="w-15 h-15 object-contain" />
              </div>
              <div>
                <span className="text-2xl font-bold text-blue-600">Dental Clinic</span>
                <p className="text-xs text-gray-500">Dental Clinic Management System</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Log in to your account</h2>
            <p className="mt-2 text-sm text-gray-600">Welcome back</p>
          </div>

          {status && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {status}
            </div>
          )}

          <form className="flex flex-col gap-6" onSubmit={submit}>
            <div className="grid gap-6">
              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  tabIndex={1}
                  autoComplete="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-lg border-gray-200 text-gray-800 px-4 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <InputError message={errors.email} />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                {/* <div className="flex items-center">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  {canResetPassword && (
                    <TextLink
                      href={route('password.request')}
                      className="ml-auto text-sm text-blue-600 hover:text-blue-700"
                      tabIndex={5}
                    >
                      Forgot password?
                    </TextLink>
                  )}
                </div> */}
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    tabIndex={2}
                    autoComplete="current-password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Your password"
                    className="w-full rounded-lg border-gray-200 text-gray-800 px-4 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <InputError message={errors.password} />
              </div>

              {/* Remember me */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="remember"
                  name="remember"
                  checked={data.remember}
                  onCheckedChange={(v) => setData('remember', !!v)}
                  tabIndex={3}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="remember" className="text-gray-600">
                  Remember me
                </Label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="mt-2 w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                tabIndex={4}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Logging in...
                  </>
                ) : (
                  'Log in'
                )}
              </Button>
            </div>

            <div className="text-gray-600 text-center text-sm">
              Don’t have an account?{' '}
              <TextLink
                href={route('register')}
                className="text-blue-600 hover:text-blue-700 font-medium"
                tabIndex={6}
              >
                Create one
              </TextLink>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
            © 2025 Dental Clinic Management System. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
