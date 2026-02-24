const items = [
  '😱 "Woke up to a $3,847 OpenAI bill from a runaway loop"',
  '💸 "Didn\'t realize we were using GPT-4 for simple summarization"',
  '🔥 "Our costs doubled MoM and we had no idea why"',
  '😰 "3 team members all using the same API key — no attribution"',
  '🚨 "Got a $900 Midjourney bill from a script I forgot about"',
  '🤯 "Switched to Claude but forgot to remove the GPT-4 calls"',
];

export default function Ticker() {
  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden py-4"
      style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="px-10 text-sm whitespace-nowrap"
            style={{
              color: "var(--muted)",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
