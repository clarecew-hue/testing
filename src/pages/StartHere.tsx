import Card from "../components/Card";
import BucketLegend from "../components/BucketLegend";

export default function StartHere({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <div className="space-y-3 pt-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#00787F]">
          The Bridge Builder · Clarece Weinraub Financial Services
        </p>
        <h1 className="text-4xl font-semibold text-[#0D4A4B] sm:text-5xl">The 30-Day Spending Reset</h1>
        <p className="text-lg text-[#0D4A4B]/80">
          A no-shame plan to find your money and put it back to work.
        </p>
      </div>

      <Card className="space-y-3 text-center">
        <p className="text-[#0D4A4B]">
          Here's the truth: you don't have a spending problem. You have a{" "}
          <span className="font-semibold">visibility</span> problem.
        </p>
        <p className="text-[#0D4A4B]/80">
          Upload your bank and credit card statements, sort every transaction into four simple
          buckets, and see — clearly, for the first time — exactly where your money goes. No
          judgment. Just the picture.
        </p>
        <p className="text-sm font-semibold text-[#00787F]">
          Your data never leaves your device. Everything here stays in your browser.
        </p>
        <button
          onClick={onGetStarted}
          className="mt-2 rounded-full bg-[#00787F] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#0D4A4B]"
        >
          Upload my first statement →
        </button>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="border-[#00787F]/20" style={{ backgroundColor: "rgba(213,234,235,0.4)" }}>
          <h2 className="text-xl font-semibold text-[#0D4A4B]">Week 1 — See It</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[#0D4A4B]/90">
            <li>Upload every account's CSV — checking, savings, every credit card.</li>
            <li>Categorize every transaction into one of the four buckets.</li>
            <li>Look at your four numbers. That's it — no changes yet, just awareness.</li>
          </ul>
          <p className="mt-4 rounded-lg bg-white/60 p-3 text-sm font-semibold text-[#0D4A4B]">
            Reset Rule #1: You can't redirect money you can't see.
          </p>
        </Card>

        <Card className="border-[#718E02]/20" style={{ backgroundColor: "rgba(228,237,201,0.4)" }}>
          <h2 className="text-xl font-semibold text-[#0D4A4B]">Week 2 — Automate the Important</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[#0D4A4B]/90">
            <li>List every bill you owe, with its amount and due date.</li>
            <li>Put every bill on autopay (or pick one bill-pay day).</li>
            <li>Set an automatic payday transfer to savings — even $25.</li>
            <li>Cancel the unused subscriptions your Top Leaks turn up.</li>
          </ul>
          <p className="mt-4 rounded-lg bg-white/60 p-3 text-sm font-semibold text-[#0D4A4B]">
            Reset Rule #2: Willpower is a terrible budget. Automation never has a weak day.
          </p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-center text-xl font-semibold text-[#0D4A4B]">The Four Buckets</h2>
        <BucketLegend />
      </div>
    </div>
  );
}
