"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Image from 'next/image'
import Link from 'next/link';

import { Button } from "@/components/ui/button"
import {Form} from "@/components/ui/form"
import FormField from "@/components/FormField"
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup} from "firebase/auth";
import { auth, googleProvider } from "@/firebase/client";
import { signIn, signUp, signInWithGoogle } from "@/lib/actions/auth.action";

const authFormSchema = (type: FormType) => {
    return z.object({
        name: type === 'sign-up' ? z.string().min(3) : z.string().optional(),
        email: z.string().email(),
        password: z.string().min(8),
    })
}

const AuthForm = ({type}: {type: FormType}) => {
    const router = useRouter();
    const formSchema = authFormSchema(type);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    })

    async function handleGoogleSignIn() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            const response = await signInWithGoogle({
                uid: result.user.uid,
                name: result.user.displayName ?? 'User',
                email: result.user.email ?? '',
                idToken,
            });
            if (!response.success) {
                toast.error(response.message);
                return;
            }
            toast.success('Signed in with Google successfully.');
            router.push('/');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(`Google sign-in failed: ${message}`);
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (type === 'sign-up') {
                const {name, email, password} = values;
                const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
                const result = await signUp({
                    uid: userCredentials.user.uid,
                    name: name!,
                    email,
                    password,
                });
                if (!result?.success) {
                    toast.error(result?.message);
                    return;
                }
                toast.success('Account created successfully. Please sign in.');
                router.push('/sign-in');
            } else {
                const {email, password} = values;
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const idToken = await userCredential.user.getIdToken();
                if (!idToken) {
                    toast.error('Sign in failed');
                    return;
                }
                await signIn({ email, idToken });
                toast.success('Signed in successfully.');
                router.push('/');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(`There was an error: ${message}`);
        }
    }

    const isSignIn = type === "sign-in";

    return (
        <div className="card-border lg:min-w-[566px]">
            <div className="flex flex-col gap-6 card py-14 px-10">
                <div className="flex flex-row gap-2 justify-center">
                    <Image src="/logo.svg" alt="Logo" height={32} width={38}/>
                    <h2 className="text-primary-100">HireAI</h2>
                </div>
                <h3>Practise Job Interviews With AI</h3>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="w-full space-y-6 mt-4 form"
                    >
                        {!isSignIn && (
                            <FormField
                                control={form.control}
                                name="name"
                                label="Name"
                                placeholder="Your Name"
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="email"
                            label="Email"
                            placeholder="Your Email Address"
                            type="email"
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            type="password"
                        />
                        <Button className="btn" type="submit">
                            {isSignIn ? 'Sign in' : 'Create an Account'}
                        </Button>
                    </form>
                </Form>

                <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-light-600" />
                    <span className="text-light-400 text-sm">or</span>
                    <div className="flex-1 h-px bg-light-600" />
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    className="flex items-center justify-center gap-3 w-full border border-light-600 rounded-lg py-3 px-4 hover:bg-dark-200 transition-colors"
                >
                    <Image src="/google.svg" alt="Google" width={20} height={20} />
                    <span className="text-sm font-medium">Continue with Google</span>
                </button>

                <p className="text-center">
                    {isSignIn ? 'No account yet?' : 'Have an account already?'}
                    <Link href={!isSignIn ? '/sign-in' : '/sign-up'} className="font-bold text-user-primary ml-1">
                        {!isSignIn ? "Sign in" : 'Sign up'}
                    </Link>
                </p>
            </div>
        </div>
    )
}
export default AuthForm
