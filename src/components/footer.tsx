import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-sand-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-display text-lg font-bold">BridgeEast</h3>
            <p className="mt-2 text-sm text-gray-500">
              Helping Asian F&B brands navigate their first NYC location.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Platform
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/data" className="text-sm text-gray-600 hover:text-terracotta">
                  Market Data
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-sm text-gray-600 hover:text-terracotta">
                  Guides
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-sm text-gray-600 hover:text-terracotta">
                  Partners
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Resources
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/waitlist" className="text-sm text-gray-600 hover:text-terracotta">
                  Join Waitlist
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Contact
            </h4>
            <p className="mt-3 text-sm text-gray-500">hello@bridgeeast.co</p>
          </div>
        </div>

        <div className="mt-10 border-t border-sand-200 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} BridgeEast. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
