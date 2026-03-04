export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>
          © 2025. Built with{' '}
          <svg
            className="inline w-4 h-4 text-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>{' '}
          using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}

