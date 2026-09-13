const INLINE = /(\*\*[^*]+\*\*|`[^`]+`)/g;

function inline(text, keyPrefix) {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} className="bg-sunk px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

/**
 * Renders the small markdown subset the model actually emits as React nodes.
 * Deliberately not an HTML-string renderer — model output is never trusted
 * enough to hand to dangerouslySetInnerHTML.
 */
export default function Markdown({ text }) {
  const blocks = [];
  let list = null;

  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={`my-1.5 space-y-1 pl-5 ${list.ordered ? 'list-decimal' : 'list-disc'}`}
      >
        {list.items.map((item, i) => (
          <li key={i} className="marker:text-marigold">
            {inline(item, `li-${blocks.length}-${i}`)}
          </li>
        ))}
      </Tag>,
    );
    list = null;
  };

  for (const line of text.split('\n')) {
    const isBullet = BULLET.test(line);
    const isNumbered = NUMBERED.test(line);

    if (isBullet || isNumbered) {
      const ordered = isNumbered;
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push(line.replace(isNumbered ? NUMBERED : BULLET, ''));
      continue;
    }

    flush();
    if (line.trim() === '') continue;
    blocks.push(
      <p key={`p-${blocks.length}`} className="my-1.5 first:mt-0 last:mb-0">
        {inline(line, `p-${blocks.length}`)}
      </p>,
    );
  }
  flush();

  return <div className="text-sm leading-relaxed text-ink">{blocks}</div>;
}
