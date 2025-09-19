// verify-email.tsx
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';

interface VerifyEmailProps {
    status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Head title="Email Verification" />

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
                        <h2 className="text-2xl font-bold text-gray-800">Verify your email address</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you?
                        </p>
                    </div>

                    {status === 'verification-link-sent' && (
                        <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-teal-600 mr-2" />
                                <p className="text-sm font-medium text-teal-800">
                                    A new verification link has been sent to your email address.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Email instruction */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center mb-2">
                                <Mail className="w-5 h-5 text-gray-600 mr-2" />
                                <h3 className="text-sm font-semibold text-gray-800">Check your email</h3>
                            </div>
                            <p className="text-sm text-gray-600">
                                We've sent a verification link to your email address. Click the link in the email to verify your account.
                            </p>
                        </div>

                        <form onSubmit={submit}>
                            <Button 
                                type="submit"
                                className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center" 
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                        Sending...
                                    </>
                                ) : (
                                    'Resend verification email'
                                )}
                            </Button>
                        </form>

                        <div className="text-center">
                            <form method="POST" action={route('logout')} className="inline">
                                <button
                                    type="submit"
                                    className="text-sm text-gray-600 hover:text-gray-800 underline transition-colors"
                                >
                                    Log out
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <div className="mt-10 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
                        © 2025 JTIMIS - JTI Taxi Management Information System. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}