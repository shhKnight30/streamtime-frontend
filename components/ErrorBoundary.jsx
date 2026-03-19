// components/ErrorBoundary.jsx — MISSING, should be added
'use client';
import { Component } from 'react';

export class ErrorBoundary extends Component {
    state = { hasError: false, error: null };
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, info) {
        console.error('Uncaught error:', error, info);
        // Send to monitoring (Sentry, etc.)
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-64 p-8">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Something went wrong</h2>
                    <button 
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// app/layout.js
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                <Providers>
                    <ErrorBoundary>
                        <AuthInitializer>
                            <Navbar />
                            <main>{children}</main>
                        </AuthInitializer>
                    </ErrorBoundary>
                </Providers>
            </body>
        </html>
    );
}