// forgot-password.tsx
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, ArrowLeft } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm<Required<{ email: string }>>({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Head title="Forgot password" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Back button moved to top */}
                <div className="mb-4">
                    <TextLink 
                        href={route('home')} 
                        className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Home
                    </TextLink>
                </div>
                
                <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-gray-100">
                    <div className="mb-6 text-center">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-green-600 rounded-xl flex items-center justify-center mr-3">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H15V3C15 2.45 14.55 2 14 2H10C9.45 2 9 2.45 9 3V5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01Z"/>
                                </svg>
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-teal-600">JTIMIS</span>
                                <p className="text-xs text-gray-500">JTI Taxi Management</p>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Reset your password</h2>
                        <p className="mt-2 text-sm text-gray-600">Enter your email to receive a password reset link</p>
                    </div>

                    {status && <div className="mb-6 text-center text-sm font-medium text-teal-600">{status}</div>}

                    <form className="flex flex-col gap-6" onSubmit={submit}>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-gray-700 font-medium">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="your.email@jti.com"
                                    className={`w-full rounded-lg text-gray-800 border-gray-200 focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50 px-4 py-2 ${data.email ? 'bg-gray-100' : ''}`}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button 
                                type="submit" 
                                className="mt-6 w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center" 
                                tabIndex={2} 
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                        Sending...
                                    </>
                                ) : (
                                    'Email password reset link'
                                )}
                            </Button>
                        </div>

                        <div className="text-gray-600 text-center text-sm">
                            Remember your password?{' '}
                            <TextLink 
                                href={route('login')} 
                                className="text-teal-600 hover:text-teal-700 font-medium" 
                                tabIndex={3}
                            >
                                Log in
                            </TextLink>
                        </div>
                    </form>
                    
                    <div className="mt-10 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
                        © 2025 JTIMIS - JTI Taxi Management Information System. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}