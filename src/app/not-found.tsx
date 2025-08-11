import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
        <div className="space-y-10">
          {/* Header */}
          <div className="space-y-8">
            <Link
              href="/"
              className="text-xl font-medium no-underline hover:underline transition-colors"
              style={{ color: "var(--heading-color)" }}
            >
              ← Alé Pouroullis
            </Link>

            <div className="space-y-6 mt-8">
              <h1
                className="text-3xl font-medium"
                style={{ color: "var(--heading-color)" }}
              >
                Page Not Found
              </h1>

              <div className="space-y-6">
                <p
                  className="text-lg leading-relaxed"
                  style={{ color: "var(--text-primary)" }}
                >
                  Seems like you&apos;ve wandered into the void. The page
                  you&apos;re looking for doesn&apos;t exist, or perhaps it
                  never did.
                </p>

                <p style={{ color: "var(--text-secondary)" }}>
                  But I can help you find your way back!
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="space-y-6">
            <h2
              className="text-lg font-medium"
              style={{ color: "var(--heading-color)" }}
            >
              Where to next?
            </h2>

            <div className="space-y-4">
              <div>
                <Link href="/">← Back to home</Link>
              </div>

              <div>
                <Link href="/essays">Browse essays</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
